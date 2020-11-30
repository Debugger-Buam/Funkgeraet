import { Injectable } from "../injection";
import { Routable } from "./Routable";

@Injectable()
export class RouterController {
  private currentRoute?: Routable;
  private registeredRoutables: Routable[] = [];

  constructor() {}

  public initRouting(): void {
    this.updateCurrentRoute();
  }

  public registerRoute(routable: Routable) {
    this.registeredRoutables.push(routable);
  }

  public navigateTo(path: string) {
    // TODO: could even name routes in Routable and go there (not only by path)
    this.updateCurrentRoute(path);
  }

  private updateCurrentRoute(path?: string) {
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
    this.currentRoute.onRouteVisited(matchResult!);
  }

  private findMatchingRoutable(
    path: string
  ): [Routable | null, RegExpMatchArray | null] {
    let matchResult: RegExpMatchArray | null = null;
    let matchedRoute: Routable | null = null;

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
