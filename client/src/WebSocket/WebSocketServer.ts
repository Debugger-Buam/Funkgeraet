import { Log } from "../../../shared/Util/Log";

import {
  BaseMessage,
  CallRequestMessage,
  CallResponseMessage,
  ChatMessage,
  ChatMessageList,
  InitMessage,
  JoinRoomRequestMessage,
  PeerConnectionMessage,
  RedirectMessage,
  UserListChangedMessage,
  WebSocketMessageType,
} from "../../../shared/Messages";

import { WebSocketConnection } from "./WebSocketConnection";
import { User } from "../../../shared/User";
import { Socket } from "./Socket";

export interface MessageListener {
  onChatMessageReceived(message: ChatMessage): void;

  onUserListChanged(message: UserListChangedMessage): void;

  onPeerConnectionMsg(message: PeerConnectionMessage): void;

  onIncomingCallReceived(message: CallRequestMessage): void;
}

export class WebSocketServer {
  private socket?: Socket;
  private connection?: WebSocketConnection;

  constructor(private readonly listener: MessageListener) {}

  connect(user: User, roomName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!process.env.WEB_SOCKET_SERVER_URL) {
        throw Error("WEB_SOCKET_SERVER_URL not defined in .env!");
      }
      const urlPrefix = window.location.protocol === "https:" ? "wss" : "ws";
      const url = `${urlPrefix}://${process.env.WEB_SOCKET_SERVER_URL}`;
      const socket = new Socket(url, "json");
      this.socket = socket;

      socket.onerror = (event: Event) => {
        Log.error("Socket.onerror", event);
        reject(event);
      };

      socket.addMessageListener(async (event: MessageEvent) => {
        try {
          const message: BaseMessage = JSON.parse(event.data);

          Log.info("Socket.onmessage", message);

          // Message Handler

          switch (message.type) {
            case WebSocketMessageType.INIT: {
              const initMessage = message as InitMessage;

              this.connection = {
                id: initMessage.clientId,
                user: user,
              };

              const msg = new JoinRoomRequestMessage(roomName, user.name);
              try {
                await socket.request(WebSocketMessageType.JOIN_RESPONSE, msg);
                resolve();
              } catch (e) {
                reject(e);
              }
              break;
            }

            case WebSocketMessageType.USER_LIST_CHANGED: {
              const userListChangedMessage = message as UserListChangedMessage;
              this.listener.onUserListChanged(userListChangedMessage);
              break;
            }

            case WebSocketMessageType.CHAT: {
              const chatMessage = message as ChatMessage;
              this.listener.onChatMessageReceived(chatMessage);
              break;
            }

            case WebSocketMessageType.CHAT_LIST: {
              const chatMessageList = message as ChatMessageList;
              chatMessageList.messages.forEach((chatMessage) => {
                this.listener.onChatMessageReceived(chatMessage);
              });
              break;
            }

            case WebSocketMessageType.VIDEO_OFFER:
            case WebSocketMessageType.VIDEO_ANSWER:
            case WebSocketMessageType.NEW_ICE_CANDIDATE:
            case WebSocketMessageType.HANG_UP: {
              this.listener.onPeerConnectionMsg(
                message as PeerConnectionMessage
              );
              break;
            }
          }
        } catch {
          console.error("failed to pass", event.data);
          return;
        }
      });
    });
  }

  disconnect() {
    this.socket?.close();
    this.socket = undefined;
  }

  sendChatMessage(message: string) {
    message = message.trim();
    if (message.length > 0) {
      this.send(new ChatMessage(this.connection!.user.name, message));
    }
  }

  send(message: BaseMessage) {
    this.socket!.send(message.pack());
  }

  async requestCall(username: string): Promise<boolean> {
    if (!this.connection || !this.socket) {
      throw Error("Requesting call without a connection");
    }

    const callerName = this.connection.user.name;
    const calleeName = username;

    const message = new RedirectMessage(
      username,
      new CallRequestMessage(callerName, calleeName)
    );

    const response = await this.socket.request<CallResponseMessage>(
      WebSocketMessageType.CALL_REQUEST,
      message
    );

    return response.accepted;
  }

  async answerCall(callerName: string, accept: boolean) {
    if (!this.connection || !this.socket) {
      throw Error("Answering call without a connection");
    }

    const calleeName = this.connection.user.name;

    const message = new RedirectMessage(
      callerName,
      new CallResponseMessage(callerName, calleeName, accept)
    );

    this.socket.send(message.pack());
  }
}
