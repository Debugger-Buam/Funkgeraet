import { Injectable } from "../injection";
import {Routable} from "./Routable";
import {Log} from "../../../shared/Util/Log";

@Injectable()
export class RouterController {
  private currentRoute?: Routable;
  private routableRoutes: Routable[] = [];

  constructor(
  ) {
    this.updateCurrentRoute();
  }

  public registerRoute(routable: Routable) {
    this.routableRoutes.push(routable);
    this.updateCurrentRoute(); // TODO: not optimal will be called for every register
  }

  private updateCurrentRoute(path?: string) {
    if(!path) {
      path = document.location.pathname;
    }
    let matchResult: RegExpMatchArray | null;
    let matchedRoute: Routable | null = null;
    for (let i = 0; i < this.routableRoutes.length; i++) {
      const route = this.routableRoutes[i];
      matchResult = path.match(route.getRouteRegex());
      if (matchResult !== null) {
        matchedRoute = route;
        break;
      }
    }
    if(matchedRoute === null) {
      // TODO: throw when not called for every register
      //throw new RoutingError(`No route found for path ${path}`);
      Log.warn(`No route found for path ${path}`);
      return;
    }

    this.currentRoute?.onRouteLeft();
    this.currentRoute = matchedRoute;
    history.replaceState(null, this.currentRoute.getTitle(), path);
    this.currentRoute.onRouteVisited(matchResult!);
  }

  public changeUrl(path: string) {
    // TODO: could even name routes in Routable and go there (not only by path)
    this.updateCurrentRoute(path);
  }
}
