import {WebSocketServer} from "../WebSocket/WebSocketServer";
import {User} from '../../../shared/User';
import {
  PeerConnectionMessage,
  PeerConnectionNewICECandidateMessage,
  PeerConnectionSdpMessage,
  PeerConnectionSdpMessageType,
  WebSocketMessageType,
} from '../../../shared/Messages';
import {Optional} from 'typescript-optional';
import {Log} from "../../../shared/Util/Log";

/*
 https://media.prod.mdn.mozit.cloud/attachments/2018/08/22/16137/06b5fa4f9b25f5613dae3ce17b0185c5/WebRTC_-_Signaling_Diagram.svg
 */
export class PeerConnection {
  private readonly rtcPeerConnection: RTCPeerConnection;
  private targetUserName: Optional<string> = Optional.empty();
  private webcamStream: Optional<MediaStream> = Optional.empty();

  constructor(
    private readonly socketServer: WebSocketServer,
    private readonly sourceUser: User,
    private readonly requestLocalMediaStream: () => Promise<MediaStream>,
    onTrackListener: (evt: RTCTrackEvent) => any) {
    if (!process.env.STUN_SERVER_URL) {
      throw Error('STUN_SERVER_URL not defined in .env!');
    }

    this.rtcPeerConnection = new RTCPeerConnection({
      iceServers: [{urls: process.env.STUN_SERVER_URL, username: 'webrtc', credential: 'turnserver'}],
    });
    this.rtcPeerConnection.onicecandidate = event => this.handleICECandidateEvent(event);
    this.rtcPeerConnection.oniceconnectionstatechange = () => this.handleICEConnectionStateChangeEvent();
    this.rtcPeerConnection.onsignalingstatechange = () => this.handleSignalingStateChangeEvent();
    this.rtcPeerConnection.onnegotiationneeded = () => this.handleNegotiationNeededEvent();

    this.rtcPeerConnection.onsignalingstatechange = () => Log.info("signaling state changed to ", this.rtcPeerConnection.signalingState);
    this.rtcPeerConnection.onicegatheringstatechange = () => Log.info('gathering state changed to ', this.rtcPeerConnection.iceGatheringState);
    this.rtcPeerConnection.ontrack = (event) => onTrackListener(event);
  }

  async call(targetUser: User) {
    this.targetUserName = Optional.of(targetUser.name);
    await this.setStreamOnRtcPeerConnection();
  }

  private async setStreamOnRtcPeerConnection() {
    if (this.webcamStream.isPresent()) {
      return;
    }
    this.webcamStream = Optional.of(await this.requestLocalMediaStream());
    this.webcamStream.get().getTracks().forEach((track) =>
        this.rtcPeerConnection.addTransceiver(track, {
          streams: [this.webcamStream.get() as MediaStream],
        })
    );
  }

  private async setAndSendLocalDescription(
      type: PeerConnectionSdpMessageType,
      description: RTCSessionDescriptionInit
  ) {
    await this.rtcPeerConnection.setLocalDescription(description);
    if (this.rtcPeerConnection.localDescription === null) {
      throw Error("Local Description was not set!");
    }
    this.socketServer.send(new PeerConnectionSdpMessage(type, this.sourceUser.name,
        this.targetUserName.get(),
        this.rtcPeerConnection.localDescription));
  }

  public async handleSocketOnMessageEvent(message: PeerConnectionMessage) {
    switch (message.type) {
      case WebSocketMessageType.VIDEO_OFFER: {
        await this.handleVideoOfferMsg(
          message as PeerConnectionSdpMessage,
        );
        break;
      }
      case WebSocketMessageType.VIDEO_ANSWER: {
        await this.handleVideoAnswerMsg(
          message as PeerConnectionSdpMessage,
        );
        break;
      }
      case WebSocketMessageType.NEW_ICE_CANDIDATE: {
        await this.handleNewICECandidateMsg(
            message as PeerConnectionNewICECandidateMessage
        );
        break;
      }
    }
  }

  private async handleNewICECandidateMsg(message: PeerConnectionNewICECandidateMessage) {
    const candidate = new RTCIceCandidate(message.candidate);
    try {
      await this.rtcPeerConnection.addIceCandidate(candidate);
    } catch (error) {
      Log.error("Error occured in handleNewICECandidateMsg!", error);
      throw Error("Error occured in handleNewICECandidateMsg!");
    }
  }

  private async handleVideoAnswerMsg(
      message: PeerConnectionSdpMessage
  ) {
    const remoteDescription = new RTCSessionDescription(message.sdp);
    await this.rtcPeerConnection.setRemoteDescription(remoteDescription);
  }

  private async handleVideoOfferMsg(
      message: PeerConnectionSdpMessage
  ) {
    this.targetUserName = Optional.of(message.name);
    const remoteDescription = new RTCSessionDescription(message.sdp);
    if (this.rtcPeerConnection.signalingState !== "stable") {
      throw Error("Signaling state is not stable during handleVideoOfferMsg!");
    }
    await this.rtcPeerConnection.setRemoteDescription(remoteDescription);
    await this.setStreamOnRtcPeerConnection();
    const answer = await this.rtcPeerConnection.createAnswer();
    await this.setAndSendLocalDescription(
        WebSocketMessageType.VIDEO_ANSWER,
        answer
    );
  }

  private handleICECandidateEvent(event: RTCPeerConnectionIceEvent) {
    if (!event.candidate) {
      return;
    }
    if (this.targetUserName.isEmpty()) {
      throw Error("Can't handle ICE candidate, targetUserName is empty!");
    }
    this.socketServer.send(new PeerConnectionNewICECandidateMessage(this.targetUserName.get(), event.candidate));
  }

  private handleICEConnectionStateChangeEvent() {
    switch (this.rtcPeerConnection.iceConnectionState) {
      case "closed":
      case "failed":
      case "disconnected":
        this.closeVideoCall();
        break;
    }

  }

  private handleSignalingStateChangeEvent() {
    switch (this.rtcPeerConnection.signalingState) {
      case "closed":
        this.closeVideoCall();
        break;
    }
  }

  private closeVideoCall() {
    // TODO: clean up events like MDN example does, especially reset member variables like webcamStream, targetUser etc.!
    Log.warn("closeVideoCall() called!");
  }

  private async handleNegotiationNeededEvent() {
    if (this.targetUserName.isEmpty()) {
      throw Error("Negotiation needed, but no target user yet set!");
    }
    const offer = await this.rtcPeerConnection.createOffer();

    if (this.rtcPeerConnection.signalingState !== "stable") {
      Log.warn("Signaling state is not stable handleNegotiationNeededEvent. Postponing...");
      return;
    }
    await this.setAndSendLocalDescription(
        WebSocketMessageType.VIDEO_OFFER,
        offer
    );
  }
}
