import {WebSocketServer} from "../WebSocket/WebSocketServer";
import {PeerConnection} from "../WebRTC/PeerConnection";
import {User} from "../User/User";
import {Optional} from "typescript-optional";

export class MainRoom {
    private static readonly mediaConstraints = { // TODO: this was copy pasted, maybe improve
        audio: true,            // We want an audio track
        video: {
            aspectRatio: {
                ideal: 1.333333     // 3:2 aspect is preferred
            }
        }
    };
    private socketServer: Optional<WebSocketServer> = Optional.empty();
    private peerConnection: Optional<PeerConnection> = Optional.empty();

    // this is the initial call when entering a username
    public async login(currentUser: User) {
        const stream = await navigator.mediaDevices.getUserMedia(MainRoom.mediaConstraints);
        // TODO: set local stream somewhere
        // document.getElementById("local_video").srcObject = stream;
        this.socketServer = Optional.of(new WebSocketServer());
        this.peerConnection = Optional.of(new PeerConnection(this.socketServer.get(), currentUser, stream));
        this.peerConnection.get().addOnTrackEventListener(this.handleOnTrackEvent);
    }

    // This is the click on the user name should start the call
    public async onClickUser(clickedUser: User) {
        this.peerConnection.get().initialize(clickedUser);
    }

    private handleOnTrackEvent(event: RTCTrackEvent) {
        // TODO: set remote stream somewhere
        // document.getElementById("received_video").srcObject = event.streams[0];
    }

}
