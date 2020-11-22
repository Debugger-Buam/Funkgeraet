import './main.scss';
import {MainRoom} from './Room/MainRoom';
import {RouterController} from './Controller/RouterController';
import {RouterView} from './View/RouterView';
import {LoginController} from './Controller/LoginController';
import {LoginView} from './View/LoginView';

class Main {
  constructor() {
    new MainRoom();
  }
}

const main = new Main();

const routerView = new RouterView();
const loginView = new LoginView();
const routerController = new RouterController(routerView);
const loginController = new LoginController(loginView, routerController);
