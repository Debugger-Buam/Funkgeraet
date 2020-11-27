import "./main.scss";
import { RoomController } from "./Room/RoomController";
import { RouterController } from "./Router/RouterController";
import { LobbyController } from "./Lobby/LobbyController";
import { Dom } from "./View/Dom";
import { Log } from "../../shared/Util/Log";
import { ErrorController } from "./Error/ErrorController";
import { DependencyContainer } from "./injection";

try {
  var container = new DependencyContainer();
  container.install(Dom, new Dom(document));
  
  const controllers = [
    ErrorController,
    RouterController,
    RoomController,
    LobbyController,
  ];
  container.bootstrap(controllers);

} catch (e) {
  alert(`FATAL INITIALIZATION ERROR: ${e}`);
  Log.error(e);
}
