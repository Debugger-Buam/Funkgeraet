import './main.scss';
import {RoomController} from './Room/RoomController';
import {RouterController} from './Controller/RouterController';
import {RouterView} from './View/RouterView';
import {LobbyController} from './Controller/LobbyController';
import {LobbyView} from './View/LobbyView';
import {RoomView} from './View/RoomView';
import {Dom} from './View/Dom';

const dom = new Dom(document);
const routerView = new RouterView(dom);
const loginView = new LobbyView(dom);
const roomView = new RoomView(dom);
const routerController = new RouterController(routerView);
const roomController = new RoomController(roomView);
const loginController = new LobbyController(loginView, routerController, roomController);
