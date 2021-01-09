import {WebSocketServer} from '../WebSocket/WebSocketServer';
import {User} from '../../../shared/User';
import {
  PeerConnectionHangUpMessage,
  PeerConnectionMessage,
  PeerConnectionNewICECandidateMessage,
  PeerConnectionSdpMessage,
  PeerConnectionSdpMessageType, UserCallStateMessage, WebSocketMessageType,
} from '../../../shared/Messages';
import {Log} from '../../../shared/Util';

export interface VideoCallResult {
  isEndedByUser: boolean;
  message: string;
}

export interface PeerConnectionListener {
  onVideoCallStarted(localStream: MediaStream, receivedStream: MediaStream): void;
  onVideoCallEnded(e: VideoCallResult): void;
}

/*
 https://media.prod.mdn.mozit.cloud/attachments/2018/08/22/16137/06b5fa4f9b25f5613dae3ce17b0185c5/WebRTC_-_Signaling_Diagram.svg
 */
export class PeerConnection {
  private readonly rtcPeerConnection: RTCPeerConnection;
  private targetUserName?: string;
  private isTransceiverSet: boolean = false;

  constructor(
    iceServers: RTCIceServer[],
    private readonly socketServer: WebSocketServer,
    private readonly sourceUser: User,
    private readonly peerConnectionListener: PeerConnectionListener,
    private readonly localWebcamStreamPromise: Promise<MediaStream>
  ) {
    this.rtcPeerConnection = new RTCPeerConnection({
      iceServers,
    });
    this.rtcPeerConnection.onicecandidate = (event) => this.handleICECandidateEvent(event);
    this.rtcPeerConnection.oniceconnectionstatechange = () => this.handleICEConnectionStateChangeEvent();
    this.rtcPeerConnection.onsignalingstatechange = () => this.handleSignalingStateChangeEvent();
    this.rtcPeerConnection.onnegotiationneeded = () => this.handleNegotiationNeededEvent();
    this.rtcPeerConnection.onsignalingstatechange = () => Log.info("signaling state changed to ", this.rtcPeerConnection.signalingState);
    this.rtcPeerConnection.onicegatheringstatechange = () => Log.info('gathering state changed to ', this.rtcPeerConnection.iceGatheringState);
    this.rtcPeerConnection.ontrack = async (event) => {
      this.peerConnectionListener.onVideoCallStarted(await this.localWebcamStreamPromise, event.streams[0]);
      this.sourceUser.inCallWith = this.targetUserName;
      this.socketServer.send(new UserCallStateMessage(this.sourceUser))
      Log.info("User", sourceUser.name, "is in call with", this.sourceUser.inCallWith)
    };
  }

  async call(targetUserName: string) {
    this.targetUserName = targetUserName;
    await this.setStreamOnRtcPeerConnection();
  }

  async hangUp() {
    this.socketServer.send(new PeerConnectionHangUpMessage(this.sourceUser.name, this.targetUserName!));
    this.closeVideoCall({isEndedByUser: true, message: "You hang up."});
  }

  private async setStreamOnRtcPeerConnection() {
    if (this.isTransceiverSet) {
      return;
    }
    try {
      const stream = await this.localWebcamStreamPromise;
      stream.getTracks().forEach((track) =>
        this.rtcPeerConnection.addTransceiver(track, {
          streams: [stream],
        }),
      );
      this.isTransceiverSet = true;
    } catch (e) {
      this.handleLocalUserMediaError(e);
    }
  }

  private async setAndSendLocalDescription(
      type: PeerConnectionSdpMessageType,
      description: RTCSessionDescriptionInit
  ) {
    await this.rtcPeerConnection.setLocalDescription(description);
    this.socketServer.send(new PeerConnectionSdpMessage(type, this.sourceUser.name,
      this.targetUserName!,
      this.rtcPeerConnection.localDescription!));
  }

  public async handleSocketOnMessageEvent(message: PeerConnectionMessage) {
    if(this.targetUserName && message.sender !== this.targetUserName) {
      Log.info(`handleSocketOnMessageEvent - rejected ${message.type} from ${message.sender} because we are in a call with ${this.targetUserName}`);
      return;
    }
    try {
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
            message as PeerConnectionNewICECandidateMessage,
          );
          break;
        }
        case WebSocketMessageType.HANG_UP: {
          this.closeVideoCall({isEndedByUser: true, message: "Your partner hang up."});
          break;
        }
      }
    } catch (e) {
      Log.error(e);
      this.closeVideoCall({isEndedByUser: false, message: "During handling the socket message an unexpected exception occurred"});
    }
  }

  private async handleNewICECandidateMsg(message: PeerConnectionNewICECandidateMessage) {
    const candidate = new RTCIceCandidate(message.candidate);
    try {
      await this.rtcPeerConnection.addIceCandidate(candidate);
    } catch (error) {
      Log.error(error);
    }
  }

  private async handleVideoAnswerMsg(message: PeerConnectionSdpMessage) {
    const remoteDescription = new RTCSessionDescription(message.sdp);
    await this.rtcPeerConnection.setRemoteDescription(remoteDescription);
  }

  private async handleVideoOfferMsg(message: PeerConnectionSdpMessage) {
    this.targetUserName = message.sender;
    const remoteDescription = new RTCSessionDescription(message.sdp);
    if (this.rtcPeerConnection.signalingState !== 'stable') {
      Log.warn(`Signaling state is not stable, it is ${this.rtcPeerConnection.signalingState}. Probably rollback needed, see https://github.com/Debugger-Buam/Funkgeraet/issues/26`);
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
    this.socketServer.send(new PeerConnectionNewICECandidateMessage(this.sourceUser.name, this.targetUserName!, event.candidate));
  }

  private handleICEConnectionStateChangeEvent() {
    switch (this.rtcPeerConnection.iceConnectionState) {
      case "closed":
      case "failed":
      case "disconnected":
        this.closeVideoCall({
          isEndedByUser: false,
          message: `ICE connection state changed to ${this.rtcPeerConnection.iceConnectionState}`,
        });
        break;
    }
  }

  private handleSignalingStateChangeEvent() {
    if (this.rtcPeerConnection.signalingState === 'closed') {
      this.closeVideoCall({isEndedByUser: false, message: 'Signaling state changed to closed.'});
    }
  }

  private closeVideoCall(e: VideoCallResult) {
    this.rtcPeerConnection.onicecandidate = null;
    this.rtcPeerConnection.oniceconnectionstatechange = null;
    this.rtcPeerConnection.onsignalingstatechange = null;
    this.rtcPeerConnection.onnegotiationneeded = null;
    this.rtcPeerConnection.onsignalingstatechange = null;
    this.rtcPeerConnection.onicegatheringstatechange = null;
    this.rtcPeerConnection.ontrack = null
    this.rtcPeerConnection.getTransceivers().forEach(transceiver => transceiver.receiver.track.stop());
    this.rtcPeerConnection.close();
    this.isTransceiverSet = false;
    this.targetUserName = undefined;

    this.peerConnectionListener.onVideoCallEnded(e);

    this.sourceUser.inCallWith = undefined;
    Log.info("User", this.sourceUser.name, "is not in a call anymore")
    this.socketServer.send(new UserCallStateMessage(this.sourceUser));
    this.localWebcamStreamPromise.then((stream) => stream.getTracks().forEach((track) => track.stop()));
  }

  private async handleNegotiationNeededEvent() {
    if (!this.targetUserName) {
      throw Error('Negotiation needed, but no target user yet set!');
    }
    const offer = await this.rtcPeerConnection.createOffer();

    if (this.rtcPeerConnection.signalingState !== 'stable') {
      Log.warn('Signaling state is not stable handleNegotiationNeededEvent. Postponing...');
      return;
    }
    await this.setAndSendLocalDescription(
      WebSocketMessageType.VIDEO_OFFER,
      offer,
    );
  }

  private handleLocalUserMediaError(exception: DOMException) {
    Log.error(exception);
    const result: VideoCallResult = {isEndedByUser: false, message: ''};
    switch (exception.name) {
      case 'NotAllowedError': {
        result.message = 'Please allow webcam/microphone access.';
        break;
      }
      case 'NotFoundError': {
        result.message = 'No webcam/microphone found.';
        break;
      }
      case 'NotReadableError': {
        result.message = 'A hardware error has occurred when accessing your webcam/microphone.';
        break;
      }
      default: {
        result.message = `A ${exception.name} has occurred when accessing your webcam/microphone.`;
      }
    }
    this.closeVideoCall(result);
  }
}
