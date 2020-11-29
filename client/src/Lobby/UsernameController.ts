import { Injectable } from "../injection";

@Injectable()
export class UsernameController {
  private static readonly UsernameKey = "username";

  public constructor() {}

  loadUsername(): Promise<string | null> {
    return Promise.resolve(
      localStorage.getItem(UsernameController.UsernameKey)
    );
  }

  saveUsername(username?: string): Promise<void> {
    return Promise.resolve(
      username || username?.length == 0
        ? localStorage.setItem(UsernameController.UsernameKey, username)
        : localStorage.removeItem(UsernameController.UsernameKey)
    );
  }
}
