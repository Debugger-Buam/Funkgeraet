import { Log } from "../../../shared/Util/Log";

import {
  BaseMessage,
  CallRequestMessage,
  CallResponseMessage,
  CallRevokedMessage,
  ChatMessage,
  ChatMessageList,
  InitMessage,
  JoinRoomRequestMessage,
  PeerConnectionMessage,
  RedirectMessage,
  UserListChangedMessage,
  WebSocketMessageType,
  WhiteboardUpdateMessage,
} from "../../../shared/Messages";

import { WebSocketConnection } from "./WebSocketConnection";
import { User } from "../../../shared/User";
import { Socket } from "./Socket";
import { PixelData } from "../../../shared/Whiteboard";

export interface MessageListener {
  onChatMessageReceived(message: ChatMessage): void;

  onUserListChanged(message: UserListChangedMessage): void;

  onPeerConnectionMsg(message: PeerConnectionMessage): void;

  onIncomingCallReceived(message: CallRequestMessage): Promise<void>;

  onWhiteboardMessageReceived(message: WhiteboardUpdateMessage): void;

  onIncomingCallRevoked(message: CallRevokedMessage): Promise<void>;
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
          const message: BaseMessage = BaseMessage.parse(event.data);

          Log.info("Socket.onmessage", message);

          // Message Handler

          switch (message.type) {
            case WebSocketMessageType.INIT: {
              const initMessage = message as InitMessage;

              this.connection = {
                id: initMessage.clientId,
                user: user,
              };

              const msg = new JoinRoomRequestMessage(roomName, user);
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

            case WebSocketMessageType.CALL_REQUEST: {
              const callRequestMessage = message as CallRequestMessage;
              this.listener.onIncomingCallReceived(callRequestMessage);
              break;
            }

            case WebSocketMessageType.CALL_REVOKE: {
              const callRevokedMessage = message as CallRevokedMessage;
              this.listener.onIncomingCallRevoked(callRevokedMessage);
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

            case WebSocketMessageType.WHITEBOARD_UPDATE:
              this.listener.onWhiteboardMessageReceived(
                message as WhiteboardUpdateMessage
              );
              break;
          }
        } catch (e) {
          console.error("Failed to handle Message: ", event.data, e);
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
      this.send(
        new ChatMessage(
          this.connection!.user.name,
          message,
          new Date().toISOString()
        )
      );
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
      WebSocketMessageType.CALL_RESPONSE,
      message,
      60 * 1000 // 1 Minute to accept the call
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

  sendClearWhiteBoard() {
    if (!this.socket) {
      throw Error("Sending whiteboard update without a connection");
    }

    const message = new WhiteboardUpdateMessage([], true);
    this.socket.send(message.pack());
  }

  sendWhiteboardUpdate(data: PixelData[]) {
    if (!this.socket) {
      throw Error("Sending whiteboard update without a connection");
    }

    const message = new WhiteboardUpdateMessage(data);
    this.socket.send(message.pack());
  }

  async revokeCall(username: string) {
    if (!this.connection || !this.socket) {
      throw Error("Revoking call without a connection");
    }

    const callerName = this.connection.user.name;
    const calleeName = username;

    const message = new RedirectMessage(
      calleeName,
      new CallRevokedMessage(callerName)
    );

    this.socket.send(message.pack());
  }
}
