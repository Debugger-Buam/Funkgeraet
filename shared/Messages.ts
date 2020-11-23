export abstract class BaseMessage {
  constructor(public readonly type: WebSocketMessageType) {}

  pack(): string {
    return JSON.stringify(this);
  }
}

export class JoinRoomMessage extends BaseMessage {
  constructor(
    public readonly roomName: string,
    public readonly userName: string
  ) {
    super(WebSocketMessageType.JOIN);
  }
}

export class InitMessage extends BaseMessage {
  constructor(public readonly clientId: number) {
    super(WebSocketMessageType.INIT);
  }
}

export class UserListChangedMessage extends BaseMessage {
  constructor(public readonly users: Array<string>) {
    super(WebSocketMessageType.USER_LIST_CHANGED);
  }
}

export class SetNameMessage extends BaseMessage {
  constructor(public readonly username: string) {
    super(WebSocketMessageType.SET_NAME);
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

export class PeerConnectionMessage extends BaseMessage {
  constructor(type: WebSocketMessageType, public readonly target: string) {
    super(type);
  }
}

export declare type PeerConnectionSdpMessageType =
  | WebSocketMessageType.VIDEO_ANSWER
  | WebSocketMessageType.VIDEO_OFFER;
export class PeerConnectionSdpMessage extends PeerConnectionMessage {
  constructor(
    type: PeerConnectionSdpMessageType,
    public readonly name: string,
    public readonly target: string,
    public readonly sdp: RTCSessionDescription
  ) {
    super(type, target);
  }
}

export class PeerConnectionNewICECandidateMessage extends PeerConnectionMessage {
  constructor(
    public readonly target: string,
    public readonly candidate: RTCIceCandidate
  ) {
    super(WebSocketMessageType.NEW_ICE_CANDIDATE, target);
  }
}

export enum WebSocketMessageType {
  INIT = "INIT",
  JOIN = "JOIN_ROOM",
  SET_NAME = "SET_NAME",
  CHAT = "CHAT",
  VIDEO_OFFER = "VIDEO_OFFER",
  VIDEO_ANSWER = "VIDEO_ANSWER",
  NEW_ICE_CANDIDATE = "NEW_ICE_CANDIDATE",
  USER_LIST_CHANGED = "USER_LIST_CHANGED",
}
