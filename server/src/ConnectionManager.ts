import { Connection } from "./Connection";

import WebSocket from "ws";
import { BaseMessage } from "../../shared/Messages";
import {User} from "../../shared/User";
import {Optional} from "typescript-optional";
import {Log} from "../../shared/Util/Log";

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
      Log.warn("sending", message)
      con.socket.send(message.pack());
    }
  }

  send(message: BaseMessage, user: User) {
    Log.debug("sending... ", message, user);
    let socket: Optional<WebSocket> = Optional.empty();
    for (const [_, con] of this.connections) {
      if (con.user && con.user.name === user.name) {
        socket = Optional.of(con.socket);
        break;
      }
    }
    // FIXME: can't use message.pack() because in server.ts the message object was parsed from JSON where it lost its
    // methods!
    socket.ifPresentOrElse(s => s.send(JSON.stringify(message)), () => {
      throw Error("Hülfe hülfe mir homs as Lenkradl gstuhln");
    });
  }

  private getNextId(): number {
    return this.idCounter++;
  }
}
