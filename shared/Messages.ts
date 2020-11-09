export abstract class BaseMessage {
  constructor(public readonly type: WebSocketMessageType) {}

  pack(): string {
    return JSON.stringify(this);
  }
}

export class InitMessage extends BaseMessage {
  constructor(public readonly clientId: number) {
    super(WebSocketMessageType.ID);
  }
}

export class SetNameMessage extends BaseMessage {
  constructor(public readonly username: string) {
    super(WebSocketMessageType.SET_NAME);
  }
}

export class ChatMessage extends BaseMessage {
  constructor(public readonly username: string, public readonly message: string) {
    super(WebSocketMessageType.CHAT);
  }
}

export declare type PeerConnectionSdpMessageType = WebSocketMessageType.VIDEO_ANSWER | WebSocketMessageType.VIDEO_OFFER;
export class PeerConnectionSdpMessage
    extends BaseMessage {
  constructor(type: PeerConnectionSdpMessageType, public readonly name: string, public readonly target: string, public readonly sdp: RTCSessionDescription) {
    super(type);
  }
}

export class PeerConnectionNewICECandidateMessage extends BaseMessage {
  constructor(public readonly target: string, public readonly candidate: RTCIceCandidate) {
    super(WebSocketMessageType.NEW_ICE_CANDIDATE);
  }
}


export enum WebSocketMessageType {
  ID = "ID",
  SET_NAME = "SET_NAME",
  CHAT = "CHAT",
  VIDEO_OFFER = "VIDEO_OFFER",
  VIDEO_ANSWER = "VIDEO_ANSWER",
  NEW_ICE_CANDIDATE = "NEW_ICE_CANDIDATE"
}
