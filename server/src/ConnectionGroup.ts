import WebSocket from "ws";
import { Connection, ConnectionId } from "./Connection";
import { BaseMessage } from "../../shared/Messages";
import { User } from "../../shared/User";
import { Log } from "../../shared/Util";

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
      con.socket.send(message.pack());
    }
  }

  send(message: BaseMessage, userName: string) {
    // Log.debug("sending... ", message, userName);
    let socket: WebSocket | undefined;
    for (const [_, con] of this.connections) {
      if (con.user && con.user.name === userName) {
        socket = con.socket;
        break;
      }
    }
    if (!socket) {
      Log.warn(
        `Trying to send ${userName} a message - But user does not exists`
      );
      return;
    }
    // FIXME: can't use message.pack() because in server.ts the message object was parsed from JSON where it lost its
    // methods!

    socket.send(JSON.stringify(message));
  }

  getUsers(): Array<User> {
    const users: Array<User> = [];
    this.connections.forEach((con) => {
      if (con.user) {
        users.push(con.user);
      }
    });
    return users;
  }

  findUser(username: string): User | null {
    for (const [_, con] of this.connections.entries()) {
      if (con.user && con.user.name === username) {
        return con.user;
      }
    }
    return null;
  }

  getConnectionCount(): number {
    return this.connections.size;
  }
}
