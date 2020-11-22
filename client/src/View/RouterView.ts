import {ClassName, elements} from './Dom';

export class RouterView {
  private readonly lobbyRoot = elements.lobbyRoot;
  private readonly roomRoot = elements.roomRoot;

  showLobby(): void {
    this.lobbyRoot.classList.add(ClassName.hidden);
    this.roomRoot.classList.remove(ClassName.hidden);
  }

  showRoom(): void {
    this.roomRoot.classList.add(ClassName.hidden);
    this.lobbyRoot.classList.remove(ClassName.hidden);
  }
}
