import {Log} from "../Util/Log";
import {
    WebSocketMessage,
    WebSocketMessageInitMessage,
    WebSocketMessageType,
    WebSocketPeerConnectionSdpMessage
} from "./WebSocketMessage";
import {Optional} from "typescript-optional";
import {WebSocketConnection} from "./WebSocketConnection";

export class WebSocketServer {
    private readonly socket: WebSocket;
    private connection: Optional<WebSocketConnection> = Optional.empty();

    constructor() {
        if (!process.env.WEB_SOCKET_SERVER_URL) {
            throw Error("WEB_SOCKET_SERVER_URL not defined in .env!");
        }
        this.socket = new WebSocket(process.env.WEB_SOCKET_SERVER_URL, "json");
        this.socket.onerror = (event: Event) => {
            Log.error("Socket.onerror", event);
        }

        this.socket.onmessage = (event: MessageEvent) => {
            const message: WebSocketMessage = JSON.parse(event.data);
            switch (message.type) {
                case WebSocketMessageType.ID: { // TODO: where do we even need the ID?
                    this.connection = Optional.of({id: (message as WebSocketMessageInitMessage).clientId});
                    break;
                }
            }
        };
    }

    addOnMessageEventListener(listener: (evt: MessageEvent) => any) {
        // TODO: probably would be cleaner subscribing events directly on WebSocketServer and only parsing message once
        // but you'd need an own event system for that, native events only work on DOM objects.
        this.socket.addEventListener("message", listener);
    }

    send(message: WebSocketPeerConnectionSdpMessage) {
        this.socket.send(JSON.stringify(message));
    }
}
