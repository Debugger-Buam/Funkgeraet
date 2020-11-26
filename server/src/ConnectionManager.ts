import { Connection } from "./Connection";

import WebSocket from "ws";
import { ConnectionGroup } from "./ConnectionGroup";

/**
 * The ConnectionManager creates connections and is responsible for
 * incrementing an id counter for each new instance.
 */
export class ConnectionManager extends ConnectionGroup {
  private idCounter = 1;

  newConnection(ws: WebSocket): Connection {
    const con = new Connection(ws, this.getNextId());
    this.connections.set(con.id, con);
    return con;
  }

  private getNextId(): number {
    return this.idCounter++;
  }
}
