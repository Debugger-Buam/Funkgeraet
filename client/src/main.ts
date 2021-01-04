import "./main.scss";
import { RoomController } from "./Room/RoomController";
import { RouterController } from "./Router/RouterController";
import { LobbyController } from "./Lobby/LobbyController";
import { WhiteboardController } from "./Whiteboard/WhiteboardController";
import { Dom } from "./View/Dom";
import { Log } from "../../shared/Util";
import { ErrorController } from "./Error/ErrorController";
import { DependencyContainer } from "./injection";

try {
  const container = new DependencyContainer();
  container.install(Dom, new Dom(document));
  
  const controllers = [
    ErrorController,
    RouterController,
    RoomController,
    LobbyController,
    WhiteboardController,
  ];
  container.bootstrap(controllers);

  container.get<RouterController>(RouterController).initRouting();

} catch (e) {
  alert(`FATAL INITIALIZATION ERROR: ${e}`);
  Log.error(e);
}
