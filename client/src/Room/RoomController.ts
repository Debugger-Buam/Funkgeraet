import { MessageListener, WebSocketServer } from "../WebSocket/WebSocketServer";
import {
  PeerConnection,
  PeerConnectionListener,
  VideoCallResult,
} from "../WebRTC/PeerConnection";
import { User } from "../../../shared/User";
import { Log } from "../../../shared/Util";
import { UserError } from "./UserError";
import { RoomView } from "./RoomView";
import {
  CallRequestMessage,
  CallRevokedMessage,
  ChatMessage,
  PeerConnectionMessage,
  UserListChangedMessage,
  WhiteboardUpdateMessage,
} from "../../../shared/Messages";
import { ErrorController } from "../Error/ErrorController";
import { Injectable } from "../injection";
import { RouterController } from "../Router/RouterController";
import { UsernameController } from "../Lobby/UsernameController";
import { Routable } from "../Router/Routable";
import { ModalController, ModalType } from "../Modal/ModalController";
import { WhiteboardController } from "../Whiteboard/WhiteboardController";
import { LobbyParams } from "../Lobby/LobbyController";
import {ToastController} from '../Toast/ToastController';

@Injectable()
export class RoomController
  implements MessageListener, PeerConnectionListener, Routable<void> {
  private static readonly MAXIMUM_COLOR_HASH_LENGTH = 5;
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
  private roomName?: string;
  private hasCallPending = false;
  private readonly audio = new Audio("./music/ringtone.mp3");

  private currentCallRequest?: CallRequestMessage = undefined;

  constructor(
    private readonly view: RoomView,
    readonly errorController: ErrorController,
    private router: RouterController,
    private usernameStorage: UsernameController,
    private modalController: ModalController,
    private toastController: ToastController,
    private whiteboardController: WhiteboardController
  ) {
    // TODO: register controller on route?
    router.registerRoute(this);

    // TODO: those are mandatory listeners, should be supplied via constructor?
    view.onChatFormSubmit = () => {
      this.socketServer!.sendChatMessage(view.chatMessage);
      view.chatMessage = "";
      view.scrollChatHistoryToBottom();
    };

    view.setOnAttendeeClick((userName) => {
      this.requestCall(userName);
    });

    view.onHangupButton = () => {
      this.hangUp();
    };

    view.onLogoutButton = () => {
      if (this.peerConnection) {
        this.hangUp();
      }
      this.router.navigateTo("/");
    };

    view.onCopyRoomIconClicked = () => {
      if (!navigator.clipboard) {
        return;
      }
      navigator.clipboard.writeText(window.location.href)
        .then(() => toastController.showToast("Copied room link to clipboard"));
    };

    view.onShareRoomIconClicked = () => {
      if (!navigator.share) {
        return;
      }
      navigator.share({
        title: "Funkgerät",
        text: `Servus! Join me at Funkgerät in my room ${this.roomName} under`,
        url: window.location.href,
      });
    };

    this.audio.loop = true;

    this.whiteboardController.onWhiteboardUpdate = (data) => {
      this.socketServer?.sendWhiteboardUpdate(data);
    };

    this.whiteboardController.onWhiteboardClear = () => {
      toastController.showToast("Whiteboard cleared");
      this.socketServer?.sendClearWhiteBoard();
    };
  }

  // This must not be async! onPeerConnectionMsg will be called multiple times (e.g. for NEW_ICE_CANDIDATE) and
  // would therefore instantiate PeerConnection multiple times!
  private createPeerConnection() {
    return new PeerConnection(
      this.socketServer!,
      this.currentUser!,
      this,
      RoomController.getLocalWebcamStreamPromise()
    );
  }

  public onPeerConnectionMsg(message: PeerConnectionMessage) {
    if (!this.peerConnection) {
      this.peerConnection = this.createPeerConnection();
    }
    this.peerConnection.handleSocketOnMessageEvent(message);
  }

  public onChatMessageReceived(message: ChatMessage): void {
    this.view.appendChatMessage(
      message.username,
      message.message,
      message.timestamp,
      RoomController.hashUsername(
        message.username,
        RoomController.MAXIMUM_COLOR_HASH_LENGTH
      )
    );
  }

  public onWhiteboardMessageReceived(message: WhiteboardUpdateMessage): void {
    if (message.clearAll) {
      this.whiteboardController.clearWhiteBoard();
    }
    this.whiteboardController.addWhiteboardUpdate(message.data);
  }

  public onUserListChanged(message: UserListChangedMessage): void {
    this.view.updateUserList(message.users);
  }

  // this is the initial call when entering a username
  public async joinRoom(username: string, roomName: string) {
    this.view.hide();

    Log.info(`Joining room ${roomName} with name ${username}`);

    const user = new User(
      username,
      RoomController.hashUsername(
        username,
        RoomController.MAXIMUM_COLOR_HASH_LENGTH
      )
    );
    this.currentUser = user;
    this.view.setCurrentUser(user);

    try {
      this.socketServer = new WebSocketServer(this);
      await this.socketServer.connect(user, roomName);
      this.roomName = roomName;
      this.view.roomName = roomName;
      this.view.show();
    } catch (e) {
      this.view.hide();

      const errorText = typeof e === "string" ? e : "Unknown error occured";

      const params: LobbyParams = {
        error: errorText,
        prefilledRoomName: roomName,
      };

      this.router.navigateTo("/", params);
    }
  }

  private static hashUsername(username: string, max: number): number {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash += username.charCodeAt(i);
      hash = hash % max;
    }
    return hash;
  }

  public leaveRoom(): Promise<void> {
    return Promise.resolve(this.socketServer?.disconnect());
  }

  public async onIncomingCallReceived(message: CallRequestMessage) {
    this.audio.currentTime = 0;
    this.audio.play();

    this.currentCallRequest = message;

    const accepted = await this.modalController.showModal(
      "Incoming Call",
      `You are receiving an incoming call from <strong>${message.callerName}</strong>.<br>Do you want to accept?`
    );
    this.audio.pause();

    this.socketServer?.answerCall(message.callerName, accepted);
    this.currentCallRequest = undefined;
  }

  public onIncomingCallRevoked(message: CallRevokedMessage): Promise<void> {
    if (this.currentCallRequest?.callerName == message.callerName) {
      this.modalController.close(false);
    }

    return Promise.resolve();
  }

  // This is the click on the user name should start the call
  private async requestCall(clickedUserName: string) {
    if (this.hasCallPending) {
      throw new UserError("Cannot call while call is pending");
    }
    if (!this.currentUser) {
      throw new UserError("You are not logged in!");
    }
    if (this.currentUser.name === clickedUserName) {
      throw new UserError("Can't call yourself!");
    }
    if (!this.socketServer) {
      throw new UserError("Cannot call without having a server connection");
    }

    Log.info("user", this.currentUser.name, "calls", clickedUserName);

    this.hasCallPending = true;
    try {
      this.modalController
        .showModal(
          `Calling ${clickedUserName}`,
          `Waiting for <strong>${clickedUserName}</strong> to accept or decline the call.`,
          { type: ModalType.CancelButtonOnly }
        )
        .then((canceled) => {
          if (!canceled) {
            this.socketServer?.revokeCall(clickedUserName);
          }
        });

      const accepted = await this.socketServer.requestCall(clickedUserName);

      this.modalController.close();

      if (accepted) {
        this.onCallAccepted(clickedUserName);
      }
    } catch (e) {
      // Something happend and we treat it as a decline ...
      console.error(e);
    } finally {
      this.hasCallPending = false;
    }
  }

  private async onCallAccepted(withUserName: string) {
    if (this.peerConnection) {
      await this.hangUp(); // hang up current call to initiate new call
    }
    this.peerConnection = this.createPeerConnection();
    await this.peerConnection.call(withUserName);
    Log.info("Call initialized.");
  }

  private async hangUp() {
    if (!this.peerConnection) {
      throw new UserError("No call to hang up!");
    }
    await this.peerConnection.hangUp();
  }

  private static getLocalWebcamStreamPromise(): Promise<MediaStream> {
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

  getRouteRegex(): RegExp {
    return /\w+/g;
  }

  onRouteLeft(): void {
    this.leaveRoom();
    this.whiteboardController.clearWhiteBoard();
    this.view.clearChatlist();
    this.view.hide();
  }

  onRouteVisited(matchResult: RegExpMatchArray): void {
    this.changeToRoom(matchResult[0]);
    this.view.show();
  }

  getTitle(): string {
    return "Funkgerät - Room";
  }

  private async changeToRoom(roomName: string) {
    const username = await this.usernameStorage.loadUsername();

    if (!username || !roomName) {
      const params: LobbyParams = {
        error: null,
        prefilledRoomName: roomName,
      };

      this.router.navigateTo("/", params);
      return;
    }

    this.joinRoom(username, roomName);
  }
}
