import { User } from "./User";

export abstract class BaseMessage {
  constructor(public readonly type: WebSocketMessageType) {}

  pack(): string {
    return JSON.stringify(this);
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
    public readonly userName: string
  ) {
    super(WebSocketMessageType.JOIN);
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
  JOIN = "JOIN_ROOM",
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
