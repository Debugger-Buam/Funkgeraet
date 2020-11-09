import {Log} from "../Util/Log";

import {BaseMessage, ChatMessage, InitMessage, SetNameMessage, WebSocketMessageType,} from "../../../shared/Messages";

import {Optional} from "typescript-optional";
import {WebSocketConnection} from "./WebSocketConnection";
import {User} from "../../../shared/User";

export class WebSocketServer {
  private socket: Optional<WebSocket> = Optional.empty();
  private connection: Optional<WebSocketConnection> = Optional.empty();

  connect(username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!process.env.WEB_SOCKET_SERVER_URL) {
        throw Error("WEB_SOCKET_SERVER_URL not defined in .env!");
      }

      let socket = new WebSocket(process.env.WEB_SOCKET_SERVER_URL, "json");

      socket.onerror = (event: Event) => {
        Log.error("Socket.onerror", event);
        reject(event);
      };

      socket.onmessage = (event: MessageEvent) => {
        const message: BaseMessage = JSON.parse(event.data);

        Log.info("Socket.onmessage", message);

        // Message Handler

        switch (message.type) {
          case WebSocketMessageType.ID: {
            const initMessage = message as InitMessage;

            this.connection = Optional.of({
              id: initMessage.clientId,
              user: new User(username),
            });
            socket.send(new SetNameMessage(username).pack());

            resolve();
            break;
          }

          case WebSocketMessageType.CHAT: {
            const chatMessage = message as ChatMessage;
            this.onChatMessageReceived(chatMessage)
            break;
          }
        }

        this.socket = Optional.of(socket);
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

  private onChatMessageReceived(message: ChatMessage) {
    const chatList = document.getElementById("chat");

    var el = document.createElement('li');
    el.innerText = `${message.username} - ${message.message}`;

    chatList?.appendChild(el)

  }
}
