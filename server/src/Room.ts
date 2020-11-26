import {
  BaseMessage,
  ChatMessage,
  ChatMessageList,
  WebSocketMessageType,
} from "../../shared/Messages";
import { Connection } from "./Connection";
import { ConnectionGroup } from "./ConnectionGroup";

/**
 * A room groups individual connections based and consists of
 * a room name as its key. In future more advanced rooms could be
 * implemented that are for example secured by a password.
 */
export class Room extends ConnectionGroup {
  private chatMessages: ChatMessage[] = [];

  constructor(public roomName: string) {
    super();
  }

  addConnection(connection: Connection) {
    super.addConnection(connection);

    // Listen on room specific messages
    // TODO: Remove listener when connection is removed
    connection.socket.on("message", (data: any) => {
      const message: BaseMessage = JSON.parse(data);
      switch (message.type) {
        case WebSocketMessageType.CHAT: {
          const request = message as ChatMessage;
          const msg = new ChatMessage(
            connection.user?.name ?? request.username,
            request.message
          );

          this.onChatMessage(msg);
          break;
        }
      }
    });

    this.onNewConnection(connection);
  }

  private onNewConnection(connection: Connection) {
    if (connection.user != null) {
      this.send(new ChatMessageList(this.chatMessages), connection.user);
    }
  }

  private onChatMessage(message: ChatMessage) {
    this.chatMessages.push(message);
    this.broadcast(message);
  }
}
