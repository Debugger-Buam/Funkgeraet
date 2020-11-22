import {RouterController} from './RouterController';
import {LoginView} from '../View/LoginView';

export class LoginController {
  constructor(readonly view: LoginView, readonly router: RouterController) {
    view.onLobbyFormSubmit = () => {
      console.log('onLobbyFormSubmit', this.view.username, this.view.roomName);
      this.view.username = '';
      this.view.roomName = '';
      this.router.changeRoute(false);
    };

    view.onUsernameChanged = () => {
      console.log('onUsernameChanged', this.view.username);
    };

    view.onRoomNameChanged = () => {
      console.log('onRoomNameChanged', this.view.roomName);
    };
  }
}
