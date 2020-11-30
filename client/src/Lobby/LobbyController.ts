import { RouterController } from "../Router/RouterController";
import { LobbyView } from "./LobbyView";
import { ErrorController } from "../Error/ErrorController";
import { Injectable } from "../injection";
import { UsernameController } from "./UsernameController";
import {Routable} from "../Router/Routable";

@Injectable()
export class LobbyController implements Routable {
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

    this.view.onUsernameChanged = async () => {
      const username = this.view.username;
      this.usernameService.saveUsername(username);
    };

    this.view.onLobbyFormSubmit = async () => {
      try {
        this.router.changeUrl(this.view.roomName);
        this.view.roomName = "";
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
  onRouteVisited(matchResult: RegExpMatchArray): void {
    console.log('visited lobby route', matchResult);
    this.view.show();
  }
  onRouteLeft(): void {
    this.view.hide();
  }
}
