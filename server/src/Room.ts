import {
  BaseMessage,
  ChatMessage,
  ChatMessageList,
  PeerConnectionMessage,
  RedirectMessage,
  UserCallStateMessage,
  UserListChangedMessage,
  WebSocketMessageType,
  WhiteboardUpdateMessage,
} from "../../shared/Messages";
import {Log, tryCatch} from '../../shared/Util';
import { PixelData, WhiteboardState } from "../../shared/Whiteboard";
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
  private whiteboardState = new WhiteboardState();

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
    connection.socket.on("message", tryCatch((data: any) => {
      const message: BaseMessage = BaseMessage.parse(data);
      switch (message.type) {
        case WebSocketMessageType.CHAT:
          this.handleChatMessage(connection, message as ChatMessage);
          break;
        case WebSocketMessageType.REDIRECT_MESSAGE:
          this.handleRedirectMessage(message as RedirectMessage);
          break;
        case WebSocketMessageType.NEW_ICE_CANDIDATE:
        case WebSocketMessageType.VIDEO_OFFER:
        case WebSocketMessageType.VIDEO_ANSWER:
        case WebSocketMessageType.HANG_UP:
          this.handlePeerConnectionMessage(message as PeerConnectionMessage);
          break;
        case WebSocketMessageType.USER_CALL_STATE_CHANGED:
          this.handleUserCallStateMessage(message as UserCallStateMessage);
          break;
        case WebSocketMessageType.WHITEBOARD_UPDATE:
          this.handleWhiteboardUpdateMessage(
            connection,
            message as WhiteboardUpdateMessage
          );
          break;
      }
    }));

    if (connection.user != null) {
      this.send(new ChatMessageList(this.chatMessages), connection.user.name);

      const data: PixelData[] = [];
      this.whiteboardState.forEachPixel((x, y, c) => {
        data.push({ x, y, c });
      });

      this.send(new WhiteboardUpdateMessage(data), connection.user.name);
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

  private handlePeerConnectionMessage(request: PeerConnectionMessage) {
    this.send(request, request.receiver);
  }

  private handleWhiteboardUpdateMessage(
    connection: Connection,
    update: WhiteboardUpdateMessage
  ) {
    if (update.clearAll) {
      this.whiteboardState.clear();
    }

    for (const point of update.data) {
      this.whiteboardState.setPixel(point.x, point.y, point.c);
    }

    this.broadcast(update, connection.id);
  }

  private handleUserCallStateMessage(request: UserCallStateMessage) {
    const user = this.findUser(request.user.name);
    if (user) {
      user.inCallWith = request.user.inCallWith;
    }
    this.broadcast(new UserListChangedMessage(this.getUsers()));
  }

  private handleChatMessage(connection: Connection, message: ChatMessage) {
    if (message.message) {
      const msg = BaseMessage.parse<ChatMessage>(message);
      if (msg.username.length > 0 || msg.message.length > 0) {
        this.chatMessages.push(msg);
        this.broadcast(msg);
      }
    }
  }

  private handleRedirectMessage(message: RedirectMessage) {
    if (!message.targetUsername || !message.wrappedMessage) {
      return;
    }

    const targetUser = this.findUser(message.targetUsername);
    Log.info(
      `Handling Redirect message to: ${message.targetUsername}, redirecting message of type: ${message.wrappedMessage.type}`
    );

    if (targetUser == null) {
      Log.warn(
        `Target ${message.targetUsername} of RedirectMessage not found in Room ${this.roomName}`
      );
      return;
    }

    this.send(message.wrappedMessage, targetUser.name);
  }

  private onStaleTimeoutElapsed() {
    Log.info(`Room inactive timeout elapsed for room "${this.roomName}".`);
    this.roomManager.removeRoom(this);
  }
}
