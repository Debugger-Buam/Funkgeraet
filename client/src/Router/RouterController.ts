import { RouterView } from "./RouterView";
import { ErrorController } from "../Error/ErrorController";
import { Injectable } from "../injection";
import { Route } from "./Route";

type RouteChangedCallback = (route: Route) => void;

@Injectable()
export class RouterController {
  private currentRoute?: Route;
  private registeredChangedCallbacks: RouteChangedCallback[] = [];

  constructor(
    readonly view: RouterView,
    readonly errorController: ErrorController
  ) {
    this.setCurrentRoute(this.parseUrlToRoute(document.location.pathname));
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

  /**
   * Registers a callback that shall be called when the current route
   * of this router changes. If at the time of registration the current
   * route is not null then the callback is directly invoked with the
   * current rout.
   *
   * @param callback Callback function that shall be called on change
   */
  public addRouteChangedCallback(callback: RouteChangedCallback) {
    this.registeredChangedCallbacks.push(callback);
    if (this.currentRoute) {
      callback(this.currentRoute);
    }
  }

  public getCurrentRoute(): Route | undefined {
    return this.currentRoute;
  }

  private setCurrentRoute(route: Route) {
    // Lets check if the route actually changed
    if (this.currentRoute && route.url === this.currentRoute.url) {
      return;
    }

    history.replaceState(null, route.title, route.url);

    this.currentRoute = route;

    this.registeredChangedCallbacks.forEach((c) => {
      c(route);
    });

    if (route.isRoomRoute) {
      this.view.showRoom();
    } else {
      this.view.showLobby();
    }
  }
}
