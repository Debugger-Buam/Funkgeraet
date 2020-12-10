import { RouterController } from "../Router/RouterController";
import { LobbyView } from "./LobbyView";
import { ErrorController } from "../Error/ErrorController";
import { Injectable } from "../injection";
import { UsernameController } from "./UsernameController";
import { Routable } from "../Router/Routable";

@Injectable()
export class LobbyController implements Routable<string> {
  constructor(
    private view: LobbyView,
    private readonly errorController: ErrorController,
    private router: RouterController,
    private usernameService: UsernameController
  ) {
    this.router.registerRoute(this);
    this.init();
  }

  async init() {
    const storedName = await this.usernameService.loadUsername();
    if (storedName) {
      this.view.username = storedName;
      this.view.focusRoomInput();
    }

    this.view.onLobbyFormSubmit = async () => {
      try {
        await this.usernameService.saveUsername(this.view.username);
        this.router.navigateTo(this.view.roomName);
      } catch (error) {
        this.errorController.handleError(error);
      }
    };
  }

  getRouteRegex(): RegExp {
    return /(.*?)/g;
  }
  getTitle(): string {
    return "Funkgerät - Lobby";
  }
  onRouteVisited(matchResult: RegExpMatchArray, error?: string): void {
    this.view.error = error ?? "";
    this.view.show();
  }
  onRouteLeft(): void {
    this.view.hide();
  }
}
