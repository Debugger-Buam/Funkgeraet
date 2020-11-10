import WebSocket, {ServerOptions} from "ws";
import {
  BaseMessage,
  ChatMessage,
  InitMessage,
  PeerConnectionMessage,
  SetNameMessage,
  WebSocketMessageType,
} from "../../shared/Messages";
import {User} from "../../shared/User";
import {ConnectionManager} from "./ConnectionManager";
import fs from "fs";
import https from "https";

const port = 6503;
let serverOptions: ServerOptions;

if(process.env.IS_SECURE==="1") {
  const server = https.createServer({
    cert: fs.readFileSync('../certs/local.pem'),
    key: fs.readFileSync('../certs/local-key.pem')
  }).listen(port);
  serverOptions = { server };
} else {
  serverOptions = { port };
}

const wss = new WebSocket.Server(serverOptions);

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
    const message: BaseMessage = JSON.parse(data);

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
      case WebSocketMessageType.NEW_ICE_CANDIDATE:
      case WebSocketMessageType.VIDEO_OFFER:
      case WebSocketMessageType.VIDEO_ANSWER: {
        const request = message as PeerConnectionMessage;
        const target = new User(request.target);
        connectionManager.send(message, target);
        break;
      }

    }
  });
});
