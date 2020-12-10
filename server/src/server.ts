import WebSocket, {ServerOptions} from "ws";
import {
  BaseMessage,
  InitMessage,
  JoinRoomMessage,
  PeerConnectionMessage,
  SetNameMessage, UserCallStateMessage,
  UserListChangedMessage,
  WebSocketMessageType,
} from "../../shared/Messages";
import {User} from "../../shared/User";
import fs from "fs";
import https from "https";
import {Log} from "../../shared/Util/Log";
import {RoomManager} from "./RoomManager";
import {ConnectionManager} from "./ConnectionManager";

const port = 6503;
let serverOptions: ServerOptions;

if (process.env.IS_SECURE === "1") {
  const server = https
    .createServer({
      cert: fs.readFileSync("../certs/local.pem"),
      key: fs.readFileSync("../certs/local-key.pem"),
    })
    .listen(port);
  serverOptions = { server };
} else {
  serverOptions = { port };
}

const wss = new WebSocket.Server(serverOptions);

const connectionManager = new ConnectionManager();
const roomManager = new RoomManager();

wss.on("connection", (ws) => {
  // Handler
  const con = connectionManager.newConnection(ws);
  Log.info(`Client connected Id: [${con.id}]`);
  ws.send(new InitMessage(con.id).pack());

  ws.on("close", () => {
    Log.info(`Client disconnected Id: [${con.id}]`);

    con.room?.removeConnection(con);
    con.room = undefined;

    connectionManager.removeConnection(con);
    con.socket.removeAllListeners();
  });

  ws.on("message", (data: any) => {
    const message: BaseMessage = JSON.parse(data);
    switch (message.type) {
      case WebSocketMessageType.JOIN: {
        const request = message as JoinRoomMessage;

        if (
          !request.userName ||
          request.userName.length < 1 ||
          !request.roomName ||
          request.roomName.length < 1
        ) {
          Log.warn(
            `Client tried to join with invalid Room [${request.roomName}] or Username: "${request.userName}"`
          );
          return;
        }

        Log.info(
          `Client joined Room [${request.roomName}] : Username: "${request.userName}"`
        );

        con.user = new User(request.userName);

        // Creates a new room if it does not exist
        const room = roomManager.getOrCreateRoom(request.roomName);
        con.room = room;
        
        room.addConnection(con);

        Log.info("Number of rooms that exist is : ", roomManager.rooms.length);

        break;
      }

      case WebSocketMessageType.SET_NAME: {
        const request = message as SetNameMessage;

        Log.info(
          `Setting client with Id: [${con.id}] to username "${request.username}"`
        );

        if (con.user != null) {
          con.user.name = request.username;
        } else {
          con.user = new User(request.username);
        }

        con.room?.broadcast(new UserListChangedMessage(con.room?.getUsers()));

        break;
      }
      case WebSocketMessageType.NEW_ICE_CANDIDATE:
      case WebSocketMessageType.VIDEO_OFFER:
      case WebSocketMessageType.VIDEO_ANSWER:
      case WebSocketMessageType.HANG_UP: {
        const request = message as PeerConnectionMessage;
        const target = new User(request.receiver);
        con.room?.send(message, target);
        break;
      }
      case WebSocketMessageType.USER_CALL_STATE_CHANGED: {
        const request = message as UserCallStateMessage;
        con.room?.getUsers().forEach((user) => {
          if (user.name === request.user.name) {
            user.isInCall = request.user.isInCall;
          }
        });
        con.room?.broadcast(new UserListChangedMessage(con.room?.getUsers()));
        break;
      }
    }
  });
});
