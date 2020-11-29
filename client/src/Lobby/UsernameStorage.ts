import { Injectable } from "../injection";

@Injectable()
export class UsernameStorage {
  private static readonly UsernameKey = "username";

  public constructor() {}

  loadUsername(): Promise<string | null> {
    return Promise.resolve(localStorage.getItem(UsernameStorage.UsernameKey));
  }

  saveUsername(username?: string): Promise<void> {
    return Promise.resolve(
      username || username?.length == 0
        ? localStorage.setItem(UsernameStorage.UsernameKey, username)
        : localStorage.removeItem(UsernameStorage.UsernameKey)
    );
  }
}
