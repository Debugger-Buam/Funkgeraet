import WebSocket from "ws";
import {
  ChatMessage,
  InitMessage,
  SetNameMessage,
  WebSocketMessage,
  WebSocketMessageType,
} from "../../shared/Messages";
import { User } from "../../shared/User";
import { ConnectionManager } from "./ConnectionManager";

const port = 6503;

const wss = new WebSocket.Server({
  port,
});

const connectionManager = new ConnectionManager();

wss.on("connection", (ws) => {
  const con = connectionManager.addConnection(ws);

  ws.send(new InitMessage(con.id).pack());
  console.log(`Client connected. Id: ${con.id}`);

  // Handler

  ws.on("close", () => {
    console.log(`Client disconnected. Id: ${con.id}`);
    connectionManager.removeConnection(con);
  });

  ws.on("message", (data: any) => {
    const message: WebSocketMessage = JSON.parse(data);

    switch (message.type) {
      case WebSocketMessageType.SET_NAME: {
        const request = message as SetNameMessage;

        console.log(
          `Setting client username with id : ${con.id} to ${request.username}`
        );

        con.user = new User(request.username);
        break;
      }

      case WebSocketMessageType.CHAT: {
        const request = message as ChatMessage;
        const msg = new ChatMessage(con.user?.name ?? request.username, request.message);
        connectionManager.broadcast(msg);
        break;
      }
    }
  });
});
