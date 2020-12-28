import { User } from "./User";

export abstract class BaseMessage {
  constructor(public readonly type: WebSocketMessageType) {}

  pack(): string {
    return JSON.stringify(this);
  }

  static parse<T extends BaseMessage>(jsonMessage: string | object): T {
    const obj =
      typeof jsonMessage === "string" ? JSON.parse(jsonMessage) : jsonMessage;

    switch (obj.type) {
      case WebSocketMessageType.INIT:
        return (new InitMessage(obj.clientId) as BaseMessage) as T;
      case WebSocketMessageType.JOIN_REQUEST:
        return (new JoinRoomRequestMessage(
          obj.roomName,
          new User(
            obj.user.name,
            obj.user.color,
            obj.user.inCallWith,
          ),
        ) as BaseMessage) as T;
      case WebSocketMessageType.JOIN_RESPONSE:
        return (new JoinRoomResponseMessage(
          obj.roomName,
          obj.userName,
          obj.error
        ) as BaseMessage) as T;
      case WebSocketMessageType.CHAT:
        return (new ChatMessage(obj.username, obj.message) as BaseMessage) as T;
      case WebSocketMessageType.CHAT_LIST:
        return (new ChatMessageList(obj.messages) as BaseMessage) as T;
      case WebSocketMessageType.VIDEO_OFFER:
      case WebSocketMessageType.VIDEO_ANSWER:
        return (new PeerConnectionSdpMessage(
          obj.type,
          obj.sender,
          obj.receiver,
          obj.sdp
        ) as BaseMessage) as T;
      case WebSocketMessageType.NEW_ICE_CANDIDATE:
        return (new PeerConnectionNewICECandidateMessage(
          obj.sender,
          obj.receiver,
          obj.candidate
        ) as BaseMessage) as T;
      case WebSocketMessageType.HANG_UP:
        return (new PeerConnectionHangUpMessage(
          obj.sender,
          obj.receiver
        ) as BaseMessage) as T;
      case WebSocketMessageType.USER_LIST_CHANGED:
        return (new UserListChangedMessage(obj.users) as BaseMessage) as T;
      case WebSocketMessageType.USER_CALL_STATE_CHANGED:
        return (new UserCallStateMessage(obj.user) as BaseMessage) as T;
      case WebSocketMessageType.REDIRECT_MESSAGE:
        return (new RedirectMessage(
          obj.targetUsername,
          BaseMessage.parse(obj.wrappedMessage)
        ) as BaseMessage) as T;

      case WebSocketMessageType.CALL_REQUEST:
        return (new CallRequestMessage(
          obj.callerName,
          obj.calleeName
        ) as BaseMessage) as T;

      case WebSocketMessageType.CALL_RESPONSE:
        return (new CallResponseMessage(
          obj.callerName,
          obj.calleeName,
          obj.accepted,
          obj.error
        ) as BaseMessage) as T;
      default:
        throw new Error("Unknown message type: " + obj.type);
    }
  }
}

export abstract class BaseResponseMessage extends BaseMessage {
  constructor(
    public readonly type: WebSocketMessageType,
    public readonly error?: string
  ) {
    super(type);
  }
}

export class JoinRoomRequestMessage extends BaseMessage {
  constructor(
    public readonly roomName: string,
    public readonly user: User
  ) {
    super(WebSocketMessageType.JOIN_REQUEST);
  }
}

export class JoinRoomResponseMessage extends BaseResponseMessage {
  constructor(
    public readonly roomName: string,
    public readonly userName: string,
    public readonly error?: string
  ) {
    super(WebSocketMessageType.JOIN_RESPONSE);
  }
}

export class CallRequestMessage extends BaseMessage {
  constructor(
    public readonly callerName: string,
    public readonly calleeName: string
  ) {
    super(WebSocketMessageType.CALL_REQUEST);
  }
}

export class CallResponseMessage extends BaseResponseMessage {
  constructor(
    public readonly callerName: string,
    public readonly calleeName: string,
    public readonly accepted: boolean,
    public readonly error?: string
  ) {
    super(WebSocketMessageType.CALL_RESPONSE);
  }
}

export class InitMessage extends BaseMessage {
  constructor(public readonly clientId: number) {
    super(WebSocketMessageType.INIT);
  }
}

export class UserListChangedMessage extends BaseMessage {
  constructor(public readonly users: Array<User>) {
    super(WebSocketMessageType.USER_LIST_CHANGED);
  }
}

export class UserCallStateMessage extends BaseMessage {
  constructor(public readonly user: User) {
    super(WebSocketMessageType.USER_CALL_STATE_CHANGED);
  }
}

export class ChatMessage extends BaseMessage {
  constructor(
    public readonly username: string,
    public readonly message: string
  ) {
    super(WebSocketMessageType.CHAT);
  }
}

export class ChatMessageList extends BaseMessage {
  constructor(public readonly messages: ChatMessage[]) {
    super(WebSocketMessageType.CHAT_LIST);
  }
}

export class RedirectMessage extends BaseMessage {
  constructor(
    public readonly targetUsername: string,
    public readonly wrappedMessage: BaseMessage
  ) {
    super(WebSocketMessageType.REDIRECT_MESSAGE);
  }
}

export class PeerConnectionMessage extends BaseMessage {
  constructor(
    type: WebSocketMessageType,
    public readonly sender: string,
    readonly receiver: string
  ) {
    super(type);
  }
}

export declare type PeerConnectionSdpMessageType =
  | WebSocketMessageType.VIDEO_ANSWER
  | WebSocketMessageType.VIDEO_OFFER;
export class PeerConnectionSdpMessage extends PeerConnectionMessage {
  constructor(
    type: PeerConnectionSdpMessageType,
    public readonly sender: string,
    public readonly receiver: string,
    public readonly sdp: RTCSessionDescription
  ) {
    super(type, sender, receiver);
  }
}

export class PeerConnectionHangUpMessage extends PeerConnectionMessage {
  constructor(
    public readonly sender: string,
    public readonly receiver: string
  ) {
    super(WebSocketMessageType.HANG_UP, sender, receiver);
  }
}

export class PeerConnectionNewICECandidateMessage extends PeerConnectionMessage {
  constructor(
    public readonly sender: string,
    public readonly receiver: string,
    public readonly candidate: RTCIceCandidate
  ) {
    super(WebSocketMessageType.NEW_ICE_CANDIDATE, sender, receiver);
  }
}

export enum WebSocketMessageType {
  INIT = "INIT",
  JOIN_REQUEST = "JOIN_ROOM_REQUEST",
  JOIN_RESPONSE = "JOIN_ROOM_RESPONSE",
  CALL_REQUEST = "CALL_REQUEST",
  CALL_RESPONSE = "CALL_RESPONSE",
  CHAT = "CHAT",
  REDIRECT_MESSAGE = "REDIRECT_MESSAGE",
  CHAT_LIST = "CHAT_LIST",
  VIDEO_OFFER = "VIDEO_OFFER",
  VIDEO_ANSWER = "VIDEO_ANSWER",
  NEW_ICE_CANDIDATE = "NEW_ICE_CANDIDATE",
  HANG_UP = "HANG_UP",
  USER_LIST_CHANGED = "USER_LIST_CHANGED",
  USER_CALL_STATE_CHANGED = "USER_CALL_STATE_CHANGED",
}
