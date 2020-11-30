import { RouterController } from "../Router/RouterController";
import { LobbyView } from "./LobbyView";
import { ErrorController } from "../Error/ErrorController";
import { Injectable } from "../injection";
import { UsernameController } from "./UsernameController";

@Injectable()
export class LobbyController {
  constructor(
    private view: LobbyView,
    private readonly errorController: ErrorController,
    private router: RouterController,
    private usernameService: UsernameController
  ) {
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
        this.router.goToRoom(this.view.roomName);
        this.view.roomName = "";
      } catch (error) {
        this.errorController.handleError(error);
      }
    };
  }
}
