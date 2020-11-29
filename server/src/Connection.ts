import WebSocket from "ws";
import { User } from "../../shared/User";
import { Room } from "./Room";

export type ConnectionId = number;

export class Connection {
  user?: User;
  room?: Room;

  constructor(public socket: WebSocket, public id: ConnectionId) {}
}

