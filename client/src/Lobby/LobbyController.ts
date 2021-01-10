import { RouterController } from "../Router/RouterController";
import { LobbyView } from "./LobbyView";
import { ErrorController } from "../Error/ErrorController";
import { Injectable } from "../injection";
import { UsernameController } from "./UsernameController";
import { Routable } from "../Router/Routable";

export interface LobbyParams {
  error: string | null;
  prefilledRoomName: string | null;
}

@Injectable()
export class LobbyController implements Routable<LobbyParams> {
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
        this.view.reset();
      } catch (error) {
        this.errorController.handleError(error);
      }
    };
  }

  getRouteRegex(): RegExp {
    return /(.*?)/g;
  }

  getTitle(): string {
    return "Funkgerät";
  }

  onRouteVisited(matchResult: RegExpMatchArray, params?: LobbyParams): void {
    this.view.error = params?.error ?? "";

    if (params?.prefilledRoomName) {
      this.view.showPrefilled(params.prefilledRoomName);
    }

    this.view.show();
  }

  onRouteLeft(): void {
    this.view.hide();
  }
}
