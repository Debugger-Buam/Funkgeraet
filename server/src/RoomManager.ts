import { Room } from "./Room";

export class RoomManager {
  public rooms = new Array<Room>();

  public getRoomWithName(roomName: string) {
    for (let room of this.rooms) {
      if (room.roomName == roomName) return room;
    }

    // Room does not exist - Lets create one
    const room = new Room(roomName);
    this.rooms.push(room);
    return room;
  }
}
