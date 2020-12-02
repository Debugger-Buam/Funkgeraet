
import WebSocket from "ws";
import { Connection, ConnectionId } from "./Connection";
import { BaseMessage } from "../../shared/Messages";
import { User } from "../../shared/User";
import { Log } from "../../shared/Util/Log";

/**
 * A Connection Group can be used to group connections and
 * allows for common operations like broadcasting to every connection,
 * sending to a specific user in the group or getting all users.
 */
export class ConnectionGroup {
  protected connections = new Map<ConnectionId, Connection>();

  addConnection(con: Connection) {
    this.connections.set(con.id, con);
  }

  removeConnection(con: Connection) {
    this.connections.delete(con.id);
  }

  broadcast(message: BaseMessage, except?: ConnectionId) {
    for (const [_, con] of this.connections) {
      if (con.id == except && except != null) {
        continue;
      }
      Log.warn("sending", message);
      con.socket.send(message.pack());
    }
  }

  send(message: BaseMessage, user: User) {
    Log.debug("sending... ", message, user);
    let socket: WebSocket | undefined;
    for (const [_, con] of this.connections) {
      if (con.user && con.user.name === user.name) {
        socket = con.socket;
        break;
      }
    }
    if (!socket) {
      throw Error("Hülfe hülfe mir homs as Lenkradl gstuhln");
    }
    // FIXME: can't use message.pack() because in server.ts the message object was parsed from JSON where it lost its
    // methods!
    socket.send(JSON.stringify(message));
  }

  getUsers(): Array<string> {
    const userNames: Array<string> = [];
    this.connections.forEach((con) => {
      if (con.user) {
        userNames.push(con.user.name);
      }
    });
    return userNames;
  }

  getConnectionCount(): number {
    return this.connections.size;
  }
}
