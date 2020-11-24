import {RouterController} from './RouterController';
import {LobbyView} from '../View/LobbyView';
import {RoomController} from '../Room/RoomController';
import {Log} from '../../../shared/Util/Log';

export class LobbyController {
  constructor(view: LobbyView, router: RouterController, mainRoom: RoomController) {
    view.onLobbyFormSubmit = () => {
      mainRoom.joinRoom(view.username, view.roomName)
        .then(() => {
          view.username = '';
          view.roomName = '';
          router.changeRoute(false);
        })
        .catch((error) => Log.error(error));
    };
  }
}
