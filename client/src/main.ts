import './main.scss';
import {RoomController} from './Room/RoomController';
import {RouterController} from './Router/RouterController';
import {RouterView} from './Router/RouterView';
import {LobbyController} from './Lobby/LobbyController';
import {LobbyView} from './Lobby/LobbyView';
import {RoomView} from './Room/RoomView';
import {Dom} from './View/Dom';
import {Log} from '../../shared/Util/Log';
import {ErrorController} from './Error/ErrorController';

try {
  const dom = new Dom(document);
  const routerView = new RouterView(dom);
  const loginView = new LobbyView(dom);
  const roomView = new RoomView(dom);
  const errorController = new ErrorController();
  const routerController = new RouterController(routerView, errorController);
  const roomController = new RoomController(roomView, errorController);
  const loginController = new LobbyController(loginView, errorController, routerController, roomController);
} catch (e) {
  alert(`FATAL INITIALIZATION ERROR: ${e}`);
  Log.error(e);
}
