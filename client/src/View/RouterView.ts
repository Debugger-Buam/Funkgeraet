import {ClassName, Dom} from './Dom';

export class RouterView {
  private readonly lobbyRoot = this.dom.lobbyRoot;
  private readonly roomRoot = this.dom.roomRoot;

  constructor(private readonly dom: Dom) {
  }

  showLobby(): void {
    this.lobbyRoot.classList.add(ClassName.hidden);
    this.roomRoot.classList.remove(ClassName.hidden);
  }

  showRoom(): void {
    this.roomRoot.classList.add(ClassName.hidden);
    this.lobbyRoot.classList.remove(ClassName.hidden);
  }
}
