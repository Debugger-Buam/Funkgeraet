import "./lobby.scss";
import { ClassName, Dom } from "../View/Dom";
import { Injectable } from "../injection";
import { version } from "../../package.json";

@Injectable()
export class LobbyView {
  private readonly lobbyForm = this.dom.lobbyForm;
  private readonly usernameInput = this.dom.usernameInput;
  private readonly roomNameInput = this.dom.roomNameInput;
  private readonly errorSpan = this.dom.errorSpan;

  constructor(private readonly dom: Dom) {
    dom.versionText.innerText = `Version ${version}`;
    this.lobbyForm.addEventListener("submit", (e) => e.preventDefault());
  }

  set onLobbyFormSubmit(value: () => void) {
    this.lobbyForm.addEventListener("submit", value);
  }

  get username(): string {
    return this.usernameInput.value;
  }

  set error(errorText: string) {
    console.log("Error is: ", errorText);
    this.errorSpan.innerText = errorText;
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

  public show() {
    this.dom.lobbyRoot.classList.remove(ClassName.hidden);
  }

  public hide() {
    this.dom.lobbyRoot.classList.add(ClassName.hidden);
  }

  public showPrefilled(roomName: string) {
    this.roomName = roomName;
    this.dom.roomNameInput.classList.add(ClassName.hidden);
    this.dom.lobbyJoinButton.innerText = `Join ${roomName}`;
  }

  public reset() {
    this.roomName = "";
    this.dom.roomNameInput.classList.remove(ClassName.hidden);
    this.dom.lobbyJoinButton.innerText = "Join";
  }
}
