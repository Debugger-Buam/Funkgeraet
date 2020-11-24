import {RouterView} from './RouterView';

export class RouterController {
  constructor(readonly view: RouterView) {
  }

  changeRoute(isLobby: boolean): void {
    if (isLobby) {
      this.view.showLobby();
    } else {
      this.view.showRoom();
    }
  }
}
