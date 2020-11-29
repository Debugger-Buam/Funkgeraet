import { Injectable } from '../injection';
import {ClassName, Dom} from '../View/Dom';

@Injectable()
export class RouterView {
  private readonly lobbyRoot = this.dom.lobbyRoot;
  private readonly roomRoot = this.dom.roomRoot;

  constructor(private readonly dom: Dom) {
  }

  showLobby(): void {
    this.lobbyRoot.classList.remove(ClassName.hidden);
    this.roomRoot.classList.add(ClassName.hidden);
  }

  showRoom(): void {
    this.lobbyRoot.classList.add(ClassName.hidden);
    this.roomRoot.classList.remove(ClassName.hidden);
  }
}
