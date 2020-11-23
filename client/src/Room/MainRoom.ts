import { WebSocketServer } from "../WebSocket/WebSocketServer";
import { PeerConnection } from "../WebRTC/PeerConnection";
import { User } from "../../../shared/User";
import { Optional } from "typescript-optional";
import { Log } from "../../../shared/Util/Log";
import { UserError } from "./UserError";
import { GuiStructureError } from "./GuiStructureError";
import { JoinRoomMessage } from "../../../shared/Messages";

export class MainRoom {
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

  constructor() {
    const joinBtn = document.getElementById("join-room");
    const callBtn = document.getElementById("call");
    const sendBtn = document.getElementById("sent-chat");
    if (joinBtn === null || callBtn === null || sendBtn === null)
      throw new GuiStructureError("Buttons not found.");

    joinBtn.onclick = () => {
      const username = (document.getElementById("username") as HTMLInputElement)
        .value;
      const roomname = (document.getElementById("roomname") as HTMLInputElement)
        .value;
      this.joinRoom(username, roomname);
    };

    callBtn.onclick = () => {
      if (this.currentUser.isEmpty()) {
        throw new UserError("You are not logged in!");
      }
      // now restricted to login with 2 browser, named test1 and test2
      const targetUserName =
        this.currentUser.get().name === "test1" ? "test2" : "test1";
      this.call(new User(targetUserName));
    };

    sendBtn.onclick = () => {
      const message = (document.getElementById(
        "chat-message"
      ) as HTMLInputElement).value;
      this.socketServer.get().sendChatMessage(message);
    };
  }

  // this is the initial call when entering a username
  public async joinRoom(username: string, roomname: string) {
    Log.info(`Joining room ${roomname} with name ${username}`);

    const user = new User(username);
    this.currentUser = Optional.of(user);
    this.socketServer = Optional.of(new WebSocketServer());
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
    const localVideo = document.getElementById(
      "local_video"
    ) as HTMLMediaElement;
    if (!localVideo) throw new GuiStructureError("local_video not found!");

    // TODO: error handling when stream not found
    const stream = await navigator.mediaDevices.getUserMedia(
      MainRoom.mediaConstraints
    );
    localVideo.srcObject = stream;
    return stream;
  }

  private handleOnTrackEvent(event: RTCTrackEvent) {
    Log.info("handleOnTrackEvent", event.streams);
    const receivedVideo = document.getElementById(
      "received_video"
    ) as HTMLMediaElement;
    if (!receivedVideo)
      throw new GuiStructureError("received_video not found!");
    receivedVideo.srcObject = event.streams[0];
  }
}
