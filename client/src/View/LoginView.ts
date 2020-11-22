import {elements} from './Dom';

export class LoginView {
  private readonly lobbyForm = elements.lobbyForm;
  private readonly usernameInput = elements.usernameInput;
  private readonly roomNameInput = elements.roomNameInput;

  constructor() {
    this.lobbyForm.addEventListener('submit', (e) => e.preventDefault());
  }

  set onLobbyFormSubmit(value: () => void) {
    this.lobbyForm.addEventListener('submit', value);
  }

  set onUsernameChanged(value: () => void) {
    this.usernameInput.addEventListener('change', value);
  }

  set onRoomNameChanged(value: () => void) {
    this.roomNameInput.addEventListener('change', value);
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
}
