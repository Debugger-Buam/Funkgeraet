import {MessageListener, WebSocketServer} from '../WebSocket/WebSocketServer';
import {
  LocalMediaStreamProvider,
  PeerConnection,
  PeerConnectionListener,
  VideoCallResult,
} from '../WebRTC/PeerConnection';
import {User} from '../../../shared/User';
import { Log } from "../../../shared/Util/Log";
import { UserError } from "./UserError";
import {RoomView} from './RoomView';
import {
  ChatMessage,
  PeerConnectionMessage,
  UserListChangedMessage,
} from '../../../shared/Messages';
import {ErrorController} from '../Error/ErrorController';

export class RoomController implements MessageListener, LocalMediaStreamProvider, PeerConnectionListener {
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

  constructor(private readonly view: RoomView, readonly errorController: ErrorController) {
    // TODO: those are mandatory listeners, should be supplied via constructor?
    view.onChatFormSubmit = () => {
      this.socketServer!.sendChatMessage(view.chatMessage);
      view.chatMessage = '';
    };

    view.setOnAttendeeClick(userName => {
      this.call(new User(userName));
    });

    view.onHangupButton = () => {
      this.hangUp();
    }
  }

  private createPeerConnection(): PeerConnection {
    return new PeerConnection(
      this.socketServer!,
      this.currentUser!,
      this, this,
    );
  }

  public async onPeerConnectionMsg(message: PeerConnectionMessage): Promise<void> {
    if (!this.peerConnection) {
      this.peerConnection = this.createPeerConnection();
    }
    await this.peerConnection.handleSocketOnMessageEvent(message);
  }

  public onCloseVideoCall(result: VideoCallResult): void {
    this.peerConnection = undefined;
    if (result.isEndedByUser) {
      Log.info('User ended call');
    } else {
      this.errorController.handleError(result);
    }
    this.view.receivedVideoSrc = null;
    this.view.localVideoSrc = null;
  }

  public onChatMessageReceived(message: ChatMessage): void {
    this.view.appendChatMessage(`${message.username} - ${message.message}`);
  }

  public onUserListChanged(message: UserListChangedMessage): void {
    this.view.updateUserList(message.users);
  }

  // this is the initial call when entering a username
  public async joinRoom(username: string, roomname: string) {
    Log.info(`Joining room ${roomname} with name ${username}`);

    const user = new User(username);
    this.currentUser = user;
    this.view.setCurrentUser(user);
    this.socketServer = new WebSocketServer(this);
    await this.socketServer.connect(user, roomname);
  }

  // This is the click on the user name should start the call
  private async call(clickedUser: User) {
    if (!this.currentUser) {
      throw new UserError('You are not logged in!');
    }
    if (this.currentUser.name === clickedUser.name) {
      throw new UserError('Can\'t call yourself stupid');
    }

    Log.info('user', this.currentUser.name, 'calls', clickedUser.name);
    if (this.peerConnection) {
      await this.hangUp(); // hang up current call to initiate new call
    }
    this.peerConnection = this.createPeerConnection();
    await this.peerConnection.call(clickedUser);
    Log.info('Call initialized.');
  }

  private async hangUp() {
    if(!this.peerConnection) {
      throw new UserError('No call to hang up idiot');
    }
    await this.peerConnection.hangUp();
  }

  public async requestLocalMediaStream(): Promise<MediaStream> {
    // TODO: error handling when stream not found
    const stream = await navigator.mediaDevices.getUserMedia(
      RoomController.mediaConstraints,
    );
    this.view.localVideoSrc = stream;
    return stream;
  }

  public onTrack(event: RTCTrackEvent) {
    Log.info('onTrack', event.streams);
    this.view.receivedVideoSrc = event.streams[0];
  }
}
