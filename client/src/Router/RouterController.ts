import { RouterView } from "./RouterView";
import { ErrorController } from "../Error/ErrorController";
import { Injectable } from "../injection";
import { Route } from "./Route";

@Injectable()
export class RouterController {
  onRouteChanged?: (route: Route) => void;
  currentRoute?: Route;

  constructor(
    readonly view: RouterView,
    readonly errorController: ErrorController
  ) {
    setTimeout(() => {
      this.setCurrentRoute(this.parseUrlToRoute(document.location.pathname));
    });
  }

  private parseUrlToRoute(url: string): Route {
    const roomRegex = /\w+/g;


    const matchResult = url.match(roomRegex);
    if (matchResult) {
      const roomname = matchResult[0];
      const params = new Map<string, unknown>();
      params.set("roomname", roomname);
      return new Route(`Funkgerät - ${roomname}`, roomname, true, params);
    }

    return new Route("Funkgerät", "", false);
  }

  goToLobby() {
    this.setCurrentRoute(new Route("Funkgerät", "/", false));
  }

  goToRoom(roomname: string) {
    const params = new Map<string, unknown>();
    params.set("roomname", roomname);
    this.setCurrentRoute(
      new Route("Funkgerät - roomname", roomname, true, params)
    );
  }

  private setCurrentRoute(route: Route) {
    history.replaceState(null, route.title, route.url);

    this.currentRoute = route;

    if (route.isRoomRoute) {
      this.view.showRoom();
    } else {
      this.view.showLobby();
    }

    if (this.onRouteChanged) {
      this.onRouteChanged(this.currentRoute);
    }
  }
}
