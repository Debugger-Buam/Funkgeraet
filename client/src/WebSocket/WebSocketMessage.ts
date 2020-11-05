export interface WebSocketMessage {
    type: WebSocketMessageType;
}

export interface WebSocketMessageInitMessage extends WebSocketMessage {
    clientId: string;
}

export interface WebSocketPeerConnectionMessage extends WebSocketMessage {
    name: string;
    target: string;
}

export interface WebSocketPeerConnectionSdpMessage extends WebSocketPeerConnectionMessage {
    sdp: RTCSessionDescription;
}

export enum WebSocketMessageType {
    ID = "ID", VIDEO_OFFER = "VIDEO_OFFER", VIDEO_ANSWER = "VIDEO_ANSWER"
}
