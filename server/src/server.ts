import WebSocket, { ServerOptions } from "ws";
import {
  BaseMessage,
  InitMessage,
  JoinRoomRequestMessage,
  JoinRoomResponseMessage,
  WebSocketMessageType,
} from "../../shared/Messages";
import fs from "fs";
import https from "https";
import {Log, tryCatch} from '../../shared/Util';
import { RoomManager } from "./RoomManager";
import { ConnectionManager } from "./ConnectionManager";
import { Configuration } from "./Configuration";

let serverOptions: ServerOptions;

if (process.env.IS_SECURE === "1") {
  const server = https
    .createServer({
      cert: fs.readFileSync("../certs/local.pem"),
      key: fs.readFileSync("../certs/local-key.pem"),
    })
    .listen(Configuration.PORT);
  serverOptions = { server };
} else {
  serverOptions = { port: Configuration.PORT };
}

const wss = new WebSocket.Server(serverOptions);

const connectionManager = new ConnectionManager();
const roomManager = new RoomManager();

wss.on("connection", tryCatch((ws) => {
  // Handler
  const con = connectionManager.newConnection(ws);
  Log.info(`Client connected Id: [${con.id}]`);
  ws.send(new InitMessage(con.id).pack());

  ws.on("close", tryCatch(() => {
    Log.info(`Client disconnected Id: [${con.id}]`);

    con.room?.removeConnection(con);
    con.room = undefined;

    connectionManager.removeConnection(con);
    con.socket.removeAllListeners();
  }));

  ws.on("message", tryCatch((data: any) => {
    const message: BaseMessage = JSON.parse(data);
    if (message.type === WebSocketMessageType.JOIN_REQUEST) {
      const request = message as JoinRoomRequestMessage;

      if (
        !request.user.name ||
        request.user.name.length < 1 ||
        !request.roomName ||
        request.roomName.length < 1
      ) {
        Log.warn(
          `Client tried to join with invalid Room [${request.roomName}] or Username: "${request.user.name}"`
        );
        con.socket.send(
          new JoinRoomResponseMessage(
            request.roomName,
            request.user.name,
            "Invalid arguments - Room or username cannot be empty"
          ).pack()
        );
        return;
      }

      // Creates a new room if it does not exist
      const room = roomManager.getOrCreateRoom(request.roomName);

      // Check if username already exists in room

      const userWithName = room.findUser(request.user.name);

      if (userWithName != null) {
        // Username already exists
        con.socket.send(
          new JoinRoomResponseMessage(
            request.roomName,
            request.user.name,
            "Username already exists"
          ).pack()
        );
        return;
      }

      con.user = request.user;
      Log.info(
        `Client joined Room [${request.roomName}] : Username: "${request.user.name}"`
      );
      con.room = room;
      room.addConnection(con);

      Log.info("Number of rooms that exist is : ", roomManager.rooms.length);

      // Send 'valid-join' response
      con.socket.send(
        new JoinRoomResponseMessage(request.roomName, request.user.name).pack()
      );
    }
  }));
}));
