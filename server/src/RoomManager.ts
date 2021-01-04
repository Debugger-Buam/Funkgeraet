import { Log } from "../../shared/Util";
import { Room } from "./Room";

/**
 * The RoomManager is responsible for creating and accessing
 * Rooms based on its name.
 */
export class RoomManager {
  public rooms: Room[] = [];

  /**
   * Tries to find a room by a given room name.
   * @param roomName The room name that acts as a key.
   */
  public getRoom(roomName: string): Room | null {
    for (let room of this.rooms) {
      if (room.roomName == roomName) return room;
    }
    return null;
  }

  /**
   * Get the room by name or create a room if it
   * does not yet exists.
   * @param roomName The room name that acts as a key.
   */
  public getOrCreateRoom(roomName: string): Room {
    const existingRoom = this.getRoom(roomName);
    if (existingRoom != null) {
      return existingRoom;
    }

    // Room does not exist - Lets create one
    const newRoom = new Room(roomName, this);
    this.rooms.push(newRoom);
    Log.info(`Created a new room with name "${roomName}".`);
    return newRoom;
  }

  public removeRoom(room: Room) {
    if (room.getConnectionCount() > 0) {
      Log.error(
        `Tried to remove room "${
          room.roomName
        }" with ${room.getConnectionCount()} connections in it. Only empty rooms can be removed.`
      );
    }

    const index = this.rooms.indexOf(room);
    if (index > -1) {
      this.rooms.splice(index, 1);
    }
    Log.info(`Removed room with name "${room.roomName}".`);
  }
}
