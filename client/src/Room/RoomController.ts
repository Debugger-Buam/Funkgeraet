import {MessageListener, WebSocketServer} from '../WebSocket/WebSocketServer';
import {PeerConnection} from '../WebRTC/PeerConnection';
import { User } from "../../../shared/User";
import { Optional } from "typescript-optional";
import { Log } from "../../../shared/Util/Log";
import { UserError } from "./UserError";
import {RoomView} from './RoomView';
import {
  BaseMessage,
  ChatMessage,
  PeerConnectionMessage,
  UserListChangedMessage,
  WebSocketMessageType,
} from '../../../shared/Messages';

export class RoomController implements MessageListener {
  private static readonly mediaConstraints = {
    // TODO: this was copy pasted, maybe improve
    audio: true, // We want an audio track
    video: {
      aspectRatio: {
        ideal: 1.333333, // 3:2 aspect is preferred
      },
    },
  };
  private socketServer: Optional<WebSocketServer> = Optional.empty();
  private peerConnection: Optional<PeerConnection> = Optional.empty();
  private currentUser: Optional<User> = Optional.empty();

  constructor(private readonly view: RoomView) {
    // TODO: those are mandatory listeners, should be supplied via constructor?
    view.onChatFormSubmit = () => {
      this.socketServer.get().sendChatMessage(view.chatMessage);
      view.chatMessage = '';
    };

    view.setOnAttendeeClick(userName => {
      if (this.currentUser.isEmpty()) {
        throw new UserError('You are not logged in!');
      }
      if (this.currentUser.get().name === userName) {
        throw new UserError('Du bist ah net die hellste Kerzn auf da Tortn');
      }
      this.call(new User(userName));
    });
  }

  private createPeerConnection(): Optional<PeerConnection> {
    return Optional.of(
      new PeerConnection(
        this.socketServer.get(),
        this.currentUser.get(),
        this.requestLocalMediaStream.bind(this),
        this.handleOnTrackEvent.bind(this),
      ),
    );
  }

  public onPeerConnectionMsg(message: PeerConnectionMessage): void {
    if (this.peerConnection.isEmpty()) {
      this.peerConnection = this.createPeerConnection();
    }
    this.peerConnection.get().handleSocketOnMessageEvent(message);
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
    this.currentUser = Optional.of(user);
    this.view.setCurrentUser(user);
    this.socketServer = Optional.of(new WebSocketServer(this));
    await this.socketServer.get().connect(user, roomname);
  }

  // This is the click on the user name should start the call
  public async call(clickedUser: User) {
    Log.info('user', this.currentUser.get().name, 'calls', clickedUser.name);
    if (this.peerConnection.isPresent()) {
      Log.error(this.peerConnection);
      throw Error('Impossible state'); // TODO better error handling
    }
    this.peerConnection = this.createPeerConnection();
    await this.peerConnection.get().call(clickedUser);
    Log.info('Call initialized.');
  }

  private async requestLocalMediaStream(): Promise<MediaStream> {
    // TODO: error handling when stream not found
    const stream = await navigator.mediaDevices.getUserMedia(
      RoomController.mediaConstraints,
    );
    this.view.localVideoSrc = stream;
    return stream;
  }

  private handleOnTrackEvent(event: RTCTrackEvent) {
    Log.info('handleOnTrackEvent', event.streams);
    this.view.receivedVideoSrc = event.streams[0];
  }
}
