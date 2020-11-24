import './main.scss';
import {RoomController} from './Room/RoomController';
import {RouterController} from './Router/RouterController';
import {RouterView} from './Router/RouterView';
import {LobbyController} from './Lobby/LobbyController';
import {LobbyView} from './Lobby/LobbyView';
import {RoomView} from './Room/RoomView';
import {Dom} from './View/Dom';

const dom = new Dom(document);
const routerView = new RouterView(dom);
const loginView = new LobbyView(dom);
const roomView = new RoomView(dom);
const routerController = new RouterController(routerView);
const roomController = new RoomController(roomView);
const loginController = new LobbyController(loginView, routerController, roomController);
