import { Room } from "./Room";

/**
 * The RoomManager is responsible for creating and accessing
 * Rooms based on its name.
 */
export class RoomManager {
  public rooms = new Array<Room>();

  public getRoom(roomName: string): Room | null {
    for (let room of this.rooms) {
      if (room.roomName == roomName) return room;
    }
    return null;
  }

  public getOrCreateRoom(roomName: string): Room {
    var existingRoom = this.getRoom(roomName);
    if (existingRoom != null) {
      return existingRoom;
    }

    // Room does not exist - Lets create one
    const newRoom = new Room(roomName);
    this.rooms.push(newRoom);
    return newRoom;
  }
}
