import "./main.scss";
import { RoomController } from "./Room/RoomController";
import { RouterController } from "./Router/RouterController";
import { LobbyController } from "./Lobby/LobbyController";
import { WhiteboardController } from "./Whiteboard/WhiteboardController";
import { Dom } from "./View/Dom";
import { Log } from "../../shared/Util";
import { ErrorController } from "./Error/ErrorController";
import { DependencyContainer } from "./injection";
declare global {
  interface Environment {
    /**
     * JSON encoded ICE server configuration.
     */
    ICE_SERVERS: string,
    /**
     * @deprecated use ICE_SERVERS instead.
     * Can be removed when everyone adapted their .env to use ICE_SERVERS instead of STUN_SERVER_URL.
     */
    STUN_SERVER_URL: string,
    WEB_SOCKET_SERVER_URL: string
  }
  interface Window { __env__: Environment; }
}

try {
  if (!window.__env__.WEB_SOCKET_SERVER_URL) {
    throw Error("WEB_SOCKET_SERVER_URL not defined in .env!");
  }
  if (!window.__env__.STUN_SERVER_URL && !window.__env__.ICE_SERVERS) {
    throw Error('Neither STUN_SERVER_URL nor ICE_SERVERS defined in .env!');
  }

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
