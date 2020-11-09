export abstract class BaseMessage {
  constructor(public readonly type: WebSocketMessageType) {}

  pack(): string {
    return JSON.stringify(this);
  }
}

export class InitMessage extends BaseMessage {
  constructor(public clientId: number) {
    super(WebSocketMessageType.ID);
  }
}

export class SetNameMessage extends BaseMessage {
  constructor(public username: string) {
    super(WebSocketMessageType.SET_NAME);
  }
}

export class ChatMessage extends BaseMessage {
  constructor(public username: string, public readonly message: string) {
    super(WebSocketMessageType.CHAT);
  }
}

export class WebSocketPeerConnectionSdpMessage
    extends BaseMessage {
  constructor(type: WebSocketMessageType, public readonly name: string, public readonly target: string, public readonly sdp: RTCSessionDescription) {
    super(type);
  }
}

export enum WebSocketMessageType {
  ID = "ID",
  SET_NAME = "SET_NAME",
  CHAT = "CHAT",
  VIDEO_OFFER = "VIDEO_OFFER",
  VIDEO_ANSWER = "VIDEO_ANSWER",
}
