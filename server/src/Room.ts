import {
  BaseMessage,
  ChatMessage,
  ChatMessageList,
  UserListChangedMessage,
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
    this.broadcast(new UserListChangedMessage(this.getUsers()));

    // Listen on room specific messages
    connection.socket.on("message", (data: any) => {
      const message: BaseMessage = JSON.parse(data);
      if (message.type === WebSocketMessageType.CHAT) {
        const request = message as ChatMessage;
        const msg = new ChatMessage(
          connection.user?.name ?? request.username,
          request.message
        );

        this.onChatMessage(msg);
      }
    });

    if (connection.user != null) {
      this.send(new ChatMessageList(this.chatMessages), connection.user);
    }
  }

  removeConnection(connection: Connection) {
    super.removeConnection(connection);
    this.broadcast(new UserListChangedMessage(this.getUsers()));
  }

  private onChatMessage(message: ChatMessage) {
    this.chatMessages.push(message);
    this.broadcast(message);
  }
}
