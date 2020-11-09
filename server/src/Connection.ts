import WebSocket from "ws";
import { User } from "../../shared/User";

export class Connection {
  user?: User;
  constructor(public socket: WebSocket, public id: number) {}
}
