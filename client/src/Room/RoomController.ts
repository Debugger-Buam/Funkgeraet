import { WebSocketServer } from "../WebSocket/WebSocketServer";
import { PeerConnection } from "../WebRTC/PeerConnection";
import { User } from "../../../shared/User";
import { Optional } from "typescript-optional";
import { Log } from "../../../shared/Util/Log";
import { UserError } from "./UserError";
import {JoinRoomMessage} from '../../../shared/Messages';
import {RoomView} from '../View/RoomView';

export class RoomController {
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

  constructor(readonly view: RoomView) {
    view.onCallButton = () => {
      if (this.currentUser.isEmpty()) {
        throw new UserError('You are not logged in!');
      }
      // now restricted to login with 2 browser, named test1 and test2
      const targetUserName =
        this.currentUser.get().name === 'test1' ? 'test2' : 'test1';
      this.call(new User(targetUserName));
    };

    view.onSentChatButtonClicked = () => {
      this.socketServer.get().sendChatMessage(view.chatMessage);
      view.chatMessage = '';
    };
  }

  // this is the initial call when entering a username
  public async joinRoom(username: string, roomname: string) {
    Log.info(`Joining room ${roomname} with name ${username}`);

    const user = new User(username);
    this.currentUser = Optional.of(user);
    this.socketServer = Optional.of(new WebSocketServer(this.view));
    await this.socketServer.get().connect(user, roomname);


    // TODO: this object is only needed until the currentUser clicks call() or another user calls the currentUser
    // But it contains the necessary event listeners for SDP handling on websocket. So maybe move the event listeners
    // to a better location and construct a PeerConnection only on demand
    this.peerConnection = Optional.of(
      new PeerConnection(
        this.socketServer.get(),
        this.currentUser.get(),
        this.requestLocalMediaStream
      )
    );
    this.peerConnection.get().addOnTrackEventListener(this.handleOnTrackEvent);
  }

  // This is the click on the user name should start the call
  public async call(clickedUser: User) {
    Log.info("user", this.currentUser.get().name, "calls", clickedUser.name);
    await this.peerConnection.get().call(clickedUser);
    Log.info("Call initialized.");
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
