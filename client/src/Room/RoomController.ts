import { MessageListener, WebSocketServer } from "../WebSocket/WebSocketServer";
import {
  PeerConnection,
  PeerConnectionListener,
  VideoCallResult,
} from "../WebRTC/PeerConnection";
import { User } from "../../../shared/User";
import { Log } from "../../../shared/Util/Log";
import { UserError } from "./UserError";
import { RoomView } from "./RoomView";
import {
  ChatMessage,
  PeerConnectionMessage,
  UserListChangedMessage,
} from "../../../shared/Messages";
import { ErrorController } from "../Error/ErrorController";
import { Injectable } from "../injection";
import { RouterController } from "../Router/RouterController";
import { Route } from "../Router/Route";
import { UsernameController } from "../Lobby/UsernameController";

@Injectable()
export class RoomController implements MessageListener, PeerConnectionListener {
  private static readonly mediaConstraints = {
    // TODO: this was copy pasted, maybe improve
    audio: true, // We want an audio track
    video: {
      aspectRatio: {
        ideal: 1.333333, // 3:2 aspect is preferred
      },
    },
  };
  private socketServer?: WebSocketServer;
  private peerConnection?: PeerConnection;
  private currentUser?: User;

  constructor(
    private readonly view: RoomView,
    readonly errorController: ErrorController,
    private router: RouterController,
    private usernameStorage: UsernameController
  ) {
    // TODO: those are mandatory listeners, should be supplied via constructor?
    view.onChatFormSubmit = () => {
      this.socketServer!.sendChatMessage(view.chatMessage);
      view.chatMessage = "";
    };

    view.setOnAttendeeClick((userName) => {
      this.call(new User(userName));
    });

    view.onHangupButton = () => {
      this.hangUp();
    };

    view.onLogoutButton = () => {
      this.router.goToLobby();
    };

    view.onCopyRoomIconClicked = () => {
      if (navigator.clipboard) {
        const url = window.location.host + window.location.pathname;
        navigator.clipboard.writeText(url);
      }
    };

    router.onRouteChanged = (route: Route) => this.onRouteChanged(route);
  }

  private async onRouteChanged(route: Route) {
    if (route.isRoomRoute) {
      const username = await this.usernameStorage.loadUsername();
      const roomName = route.params?.get("roomname") as string;

      if (!username || !roomName) {
        this.router.goToLobby();
        return;
      }

      this.joinRoom(username, roomName);
    } else {
      this.leaveRoom();
    }
  }

  // This must not be async! onPeerConnectionMsg will be called multiple times (e.g. for NEW_ICE_CANDIDATE) and
  // would therefore instantiate PeerConnection multiple times!
  private createPeerConnection() {
    return new PeerConnection(
      this.socketServer!,
      this.currentUser!,
      this,
      this.getLocalWebcamStreamPromise()
    );
  }

  public onPeerConnectionMsg(message: PeerConnectionMessage) {
    if (!this.peerConnection) {
      this.peerConnection = this.createPeerConnection();
    }
    this.peerConnection.handleSocketOnMessageEvent(message);
  }

  public onChatMessageReceived(message: ChatMessage): void {
    this.view.appendChatMessage(`${message.username} - ${message.message}`);
  }

  public onUserListChanged(message: UserListChangedMessage): void {
    this.view.updateUserList(message.users);
  }

  // this is the initial call when entering a username
  public async joinRoom(username: string, roomname: string): Promise<void> {
    Log.info(`Joining room ${roomname} with name ${username}`);

    const user = new User(username);
    this.currentUser = user;
    this.view.setCurrentUser(user);
    this.view.roomName = roomname;

    this.socketServer = new WebSocketServer(this);
    await this.socketServer.connect(user, roomname);
  }

  public leaveRoom(): Promise<void> {
    return Promise.resolve(this.socketServer?.disconnect());
  }

  // This is the click on the user name should start the call
  private async call(clickedUser: User) {
    if (!this.currentUser) {
      throw new UserError("You are not logged in!");
    }
    if (this.currentUser.name === clickedUser.name) {
      throw new UserError("Can't call yourself stupid");
    }

    Log.info("user", this.currentUser.name, "calls", clickedUser.name);
    if (this.peerConnection) {
      await this.hangUp(); // hang up current call to initiate new call
    }
    this.peerConnection = this.createPeerConnection();
    await this.peerConnection.call(clickedUser);
    Log.info("Call initialized.");
  }

  private async hangUp() {
    if (!this.peerConnection) {
      throw new UserError("No call to hang up idiot");
    }
    await this.peerConnection.hangUp();
  }

  private getLocalWebcamStreamPromise(): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia(RoomController.mediaConstraints);
  }

  public onVideoCallStarted(
    localStream: MediaStream,
    receivedStream: MediaStream
  ) {
    this.view.startCall(localStream, receivedStream);
  }

  public onVideoCallEnded(result: VideoCallResult): void {
    this.peerConnection = undefined;
    if (result.isEndedByUser) {
      Log.info("User ended call");
    } else {
      this.errorController.handleError(result);
    }
    this.view.endCall();
  }
}
