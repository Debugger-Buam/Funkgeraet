import {RouterController} from '../Router/RouterController';
import {LobbyView} from './LobbyView';
import {RoomController} from '../Room/RoomController';
import {Log} from '../../../shared/Util/Log';

export class LobbyController {
  constructor(view: LobbyView, router: RouterController, room: RoomController) {
    view.onLobbyFormSubmit = () => {
      room.joinRoom(view.username, view.roomName)
        .then(() => {
          view.username = '';
          view.roomName = '';
          router.changeRoute(false);
        })
        .catch((error) => Log.error(error));
    };
  }
}
