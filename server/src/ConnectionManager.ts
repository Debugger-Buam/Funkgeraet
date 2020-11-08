import { Connection } from "./Connection";

import WebSocket from "ws";
import { BaseMessage } from "../../shared/Messages";

export class ConnectionManager {
  private idCounter = 1;
  private connections = new Map<number, Connection>();

  addConnection(ws: WebSocket): Connection {
    const con = new Connection(ws, this.getNextId());
    this.connections.set(con.id, con);
    return con;
  }

  removeConnection(con: Connection) {
    this.connections.delete(con.id);
  }

  broadcast(message: BaseMessage) {
    for (const [_, con] of this.connections) {
      con.socket.send(message.pack());
    }
  }

  private getNextId(): number {
    return this.idCounter++;
  }
}
