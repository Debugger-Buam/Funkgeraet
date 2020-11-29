import "./lobby.scss";
import { Dom } from "../View/Dom";
import { Injectable } from "../injection";

@Injectable()
export class LobbyView {
  private readonly lobbyForm = this.dom.lobbyForm;
  private readonly usernameInput = this.dom.usernameInput;
  private readonly roomNameInput = this.dom.roomNameInput;

  constructor(private readonly dom: Dom) {
    this.lobbyForm.addEventListener("submit", (e) => e.preventDefault());
  }

  set onLobbyFormSubmit(value: () => void) {
    this.lobbyForm.addEventListener("submit", value);
  }

  set onUsernameChanged(value: () => void) {
    this.usernameInput.addEventListener("keydown", value);
  }

  get username(): string {
    return this.usernameInput.value;
  }

  set username(value: string) {
    this.usernameInput.value = value;
  }

  get roomName(): string {
    return this.roomNameInput.value;
  }

  set roomName(value: string) {
    this.roomNameInput.value = value;
  }

  focusRoomInput() {
    this.roomNameInput.focus();
  }
}

class Dependency {
  constructor(
    public readonly name: string,
    public readonly con: Function,
    public readonly subDeps: string[]
  ) {}
}
