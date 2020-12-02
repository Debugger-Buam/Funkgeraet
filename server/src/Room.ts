import {
  BaseMessage,
  ChatMessage,
  ChatMessageList,
  UserListChangedMessage,
  WebSocketMessageType,
} from "../../shared/Messages";
import { Log } from "../../shared/Util/Log";
import { Configuration } from "./Configuration";
import { Connection } from "./Connection";
import { ConnectionGroup } from "./ConnectionGroup";
import { RoomManager } from "./RoomManager";

/**
 * A room groups individual connections based and consists of
 * a room name as its key. In future more advanced rooms could be
 * implemented that are for example secured by a password.
 */
export class Room extends ConnectionGroup {
  private chatMessages: ChatMessage[] = [];

  private staleTimeout?: NodeJS.Timeout;

  constructor(public roomName: string, private roomManager: RoomManager) {
    super();
  }

  addConnection(connection: Connection) {
    super.addConnection(connection);

    if (this.staleTimeout) {
      clearTimeout(this.staleTimeout);
      Log.info(
        `Stopped room inactive timeout for room "${this.roomName}" since a new connection entered.`
      );
      this.staleTimeout = undefined;
    }

    this.broadcast(new UserListChangedMessage(this.getUsers()));

    // Listen on room specific messages
    connection.socket.on("message", (data: any) => {
      const message: BaseMessage = JSON.parse(data);
      if (message.type === WebSocketMessageType.CHAT) {
        const request = message as ChatMessage;
        if (request.message) {
          const msg = new ChatMessage(
            connection.user?.name ?? request.username,
            request.message.trim()
          );
          this.onChatMessage(msg);
        }
      }
    });

    if (connection.user != null) {
      this.send(new ChatMessageList(this.chatMessages), connection.user);
    }
  }

  removeConnection(connection: Connection) {
    super.removeConnection(connection);
    this.broadcast(new UserListChangedMessage(this.getUsers()));

    if (this.connections.size == 0 && !this.staleTimeout) {
      this.staleTimeout = setTimeout(
        this.onStaleTimeoutElapsed.bind(this),
        Configuration.INACTIVE_ROOM_LIFETIME_MS
      );
      Log.info(
        `Started room inactive timeout for room "${this.roomName}" since room is empty.`
      );
    }
  }

  private onStaleTimeoutElapsed() {
    Log.info(`Room inactive timeout elapsed for room "${this.roomName}".`);
    this.roomManager.removeRoom(this);
  }

  private onChatMessage(message: ChatMessage) {
    if (message.username.length > 0 || message.message.length > 0) {
      this.chatMessages.push(message);
      this.broadcast(message);
    }
  }
}
