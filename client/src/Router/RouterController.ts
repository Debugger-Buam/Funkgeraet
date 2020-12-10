import { Injectable } from "../injection";
import { Routable } from "./Routable";

@Injectable()
export class RouterController {
  private currentRoute?: Routable<unknown>;
  private registeredRoutables: Routable<unknown>[] = [];

  constructor() {}

  public initRouting(): void {
    this.updateCurrentRoute();
  }

  public registerRoute<T>(routable: Routable<T>) {
    this.registeredRoutables.push(routable);
  }

  public navigateTo(path: string, params?: unknown) {
    // TODO: could even name routes in Routable and go there (not only by path)
    this.updateCurrentRoute(path, params);
  }

  private updateCurrentRoute(path?: string, params?: unknown) {
    if (!path) {
      path = document.location.pathname;
    }

    const [matchedRoute, matchResult] = this.findMatchingRoutable(path);

    if (matchedRoute === null) {
      throw Error(`No routable registered that matches path ${path}`);
    }

    if (this.currentRoute === matchedRoute) {
      return true;
    }

    this.currentRoute?.onRouteLeft();
    this.currentRoute = matchedRoute;
    history.replaceState(null, this.currentRoute.getTitle(), path);
    this.currentRoute.onRouteVisited(matchResult!, params);
  }

  private findMatchingRoutable(
    path: string
  ): [Routable<unknown> | null, RegExpMatchArray | null] {
    let matchResult: RegExpMatchArray | null = null;
    let matchedRoute: Routable<unknown> | null = null;

    for (let i = 0; i < this.registeredRoutables.length; i++) {
      const route = this.registeredRoutables[i];
      matchResult = path.match(route.getRouteRegex());
      if (matchResult !== null) {
        matchedRoute = route;
        break;
      }
    }

    return [matchedRoute, matchResult];
  }
}
