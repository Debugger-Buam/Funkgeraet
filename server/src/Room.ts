import { Connection } from "./Connection";

import WebSocket from "ws";
import { BaseMessage } from "../../shared/Messages";
import { User } from "../../shared/User";
import { Log } from "../../shared/Util/Log";

export class Room {
  private connections = new Map<number, Connection>();

  constructor(public roomName: string) {}

  addConnection(con: Connection) {
    this.connections.set(con.id, con);
    return con;
  }

  removeConnection(con: Connection) {
    this.connections.delete(con.id);
  }

  broadcast(message: BaseMessage, except?: number) {
    for (const [_, con] of this.connections) {
      if (con.id == except && except != null) {
        continue;
      }
      Log.warn("Broadcasting...", message, this.roomName);
      con.socket.send(message.pack());
    }
  }

  send(message: BaseMessage, user: User) {
    Log.debug('Sending... ', message, user);
    let socket: WebSocket | undefined;
    for (const [_, con] of this.connections) {
      if (con.user && con.user.name === user.name) {
        socket = con.socket;
        break;
      }
    }
    if (!socket) {
      throw Error('Hülfe hülfe mir homs as Lenkradl gstuhln');
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
}
