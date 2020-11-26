import { ConnectionGroup } from "./ConnectionGroup";

/**
 * A room groups individual connections based and consists of
 * a room name as its key. In future more advanced rooms could be
 * implemented that are for example secured by a password.
 */
export class Room extends ConnectionGroup {
  constructor(public roomName: string) {
    super();
  }
}
