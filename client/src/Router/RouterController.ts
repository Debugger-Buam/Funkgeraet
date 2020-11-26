import {RouterView} from './RouterView';
import {ErrorController} from '../Error/ErrorController';

export class RouterController {
  constructor(readonly view: RouterView, readonly errorController: ErrorController) {
  }

  changeRoute(isLobby: boolean): void {
    if (isLobby) {
      this.view.showLobby();
    } else {
      this.view.showRoom();
    }
  }
}
