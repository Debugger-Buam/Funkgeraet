import { Log } from "../../../shared/Util/Log";

import {
  BaseMessage,
  ChatMessage,
  InitMessage,
  JoinRoomMessage, PeerConnectionMessage,
  UserListChangedMessage,
  WebSocketMessageType,
} from '../../../shared/Messages';

import {Optional} from 'typescript-optional';
import {WebSocketConnection} from './WebSocketConnection';
import {User} from '../../../shared/User';

export interface MessageListener {
  onChatMessageReceived(message: ChatMessage): void;

  onUserListChanged(message: UserListChangedMessage): void;

  onPeerConnectionMsg(message: PeerConnectionMessage): void;
}

export class WebSocketServer {
  private socket: Optional<WebSocket> = Optional.empty();
  private connection: Optional<WebSocketConnection> = Optional.empty();

  constructor(private readonly listener: MessageListener) {
  }

  connect(user: User, roomName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!process.env.WEB_SOCKET_SERVER_URL) {
        throw Error('WEB_SOCKET_SERVER_URL not defined in .env!');
      }
      const urlPrefix = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const url = `${urlPrefix}://${process.env.WEB_SOCKET_SERVER_URL}`;
      const socket = new WebSocket(url, 'json');
      this.socket = Optional.of(socket);

      socket.onerror = (event: Event) => {
        Log.error("Socket.onerror", event);
        reject(event);
      };

      socket.onmessage = (event: MessageEvent) => {
        const message: BaseMessage = JSON.parse(event.data);

        Log.info("Socket.onmessage", message);

        // Message Handler

        switch (message.type) {
          case WebSocketMessageType.INIT: {
            const initMessage = message as InitMessage;

            this.connection = Optional.of({
              id: initMessage.clientId,
              user: user,
            });

            this.send(new JoinRoomMessage(roomName, user.name));

            resolve();
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

          case WebSocketMessageType.VIDEO_OFFER:
          case WebSocketMessageType.VIDEO_ANSWER:
          case WebSocketMessageType.NEW_ICE_CANDIDATE: {
            this.listener.onPeerConnectionMsg(message as PeerConnectionMessage);
            break;
          }
        }
      };
    });
  }

  sendChatMessage(message: string) {
    this.send(new ChatMessage(this.connection.get().user.name, message));
  }

  send(message: BaseMessage) {
    this.socket.get().send(message.pack());
  }

  addOnMessageEventListener(listener: (evt: MessageEvent) => any) {
    // TODO: probably would be cleaner subscribing events directly on WebSocketServer and only parsing message once
    // but you'd need an own event system for that, native events only work on DOM objects.

    this.socket.get().addEventListener("message", listener);
  }
}
