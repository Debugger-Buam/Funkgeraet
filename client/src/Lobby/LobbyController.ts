import {RouterController} from '../Router/RouterController';
import {LobbyView} from './LobbyView';
import {RoomController} from '../Room/RoomController';
import {ErrorController} from '../Error/ErrorController';
import { Injectable } from '../injection';

@Injectable()
export class LobbyController {
  constructor(view: LobbyView, readonly errorController: ErrorController, router: RouterController, room: RoomController) {
    view.onLobbyFormSubmit = async () => {
      try {
        await room.joinRoom(view.username, view.roomName);
        view.username = '';
        view.roomName = '';
        router.changeRoute(false);
      } catch (error) {
        this.errorController.handleError(error);
      }
    };
  }
}
