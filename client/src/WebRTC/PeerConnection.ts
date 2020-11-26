import {WebSocketServer} from '../WebSocket/WebSocketServer';
import {User} from '../../../shared/User';
import {
  PeerConnectionMessage,
  PeerConnectionNewICECandidateMessage,
  PeerConnectionSdpMessage,
  PeerConnectionSdpMessageType,
  WebSocketMessageType,
} from '../../../shared/Messages';
import {Log} from '../../../shared/Util/Log';

export interface VideoCallResult {
  isEndedByUser: boolean;
  message: string;
}

export interface LocalMediaStreamProvider {
  requestLocalMediaStream(): Promise<MediaStream>;
}

export interface TrackListener {
  onTrack(evt: RTCTrackEvent): void;
}

export interface CloseVideoCallListener {
  onCloseVideoCall(e: VideoCallResult): void;
}

/*
 https://media.prod.mdn.mozit.cloud/attachments/2018/08/22/16137/06b5fa4f9b25f5613dae3ce17b0185c5/WebRTC_-_Signaling_Diagram.svg
 */
export class PeerConnection {
  private readonly rtcPeerConnection: RTCPeerConnection;
  private targetUserName?: string;
  private webcamStream?: MediaStream;

  constructor(
    private readonly socketServer: WebSocketServer,
    private readonly sourceUser: User,
    private readonly localMediaStreamProvider: LocalMediaStreamProvider,
    trackListener: TrackListener,
    private readonly closeVideoCallListener: CloseVideoCallListener,
  ) {
    if (!process.env.STUN_SERVER_URL) {
      throw Error('STUN_SERVER_URL not defined in .env!');
    }

    this.rtcPeerConnection = new RTCPeerConnection({
      iceServers: [{urls: process.env.STUN_SERVER_URL, username: 'webrtc', credential: 'turnserver'}],
    });
    this.rtcPeerConnection.onicecandidate = (event) => this.handleICECandidateEvent(event);
    this.rtcPeerConnection.oniceconnectionstatechange = () => this.handleICEConnectionStateChangeEvent();
    this.rtcPeerConnection.onsignalingstatechange = () => this.handleSignalingStateChangeEvent();
    this.rtcPeerConnection.onnegotiationneeded = () => this.handleNegotiationNeededEvent();

    this.rtcPeerConnection.onsignalingstatechange = () => Log.info("signaling state changed to ", this.rtcPeerConnection.signalingState);
    this.rtcPeerConnection.onicegatheringstatechange = () => Log.info('gathering state changed to ', this.rtcPeerConnection.iceGatheringState);
    this.rtcPeerConnection.ontrack = (event) => trackListener.onTrack(event);
  }

  async call(targetUser: User) {
    this.targetUserName = targetUser.name;
    await this.setStreamOnRtcPeerConnection();
  }

  private async setStreamOnRtcPeerConnection() {
    if (this.webcamStream) {
      return;
    }
    try {
      this.webcamStream = await this.localMediaStreamProvider.requestLocalMediaStream();
      this.webcamStream.getTracks().forEach((track) =>
        this.rtcPeerConnection.addTransceiver(track, {
          streams: [this.webcamStream as MediaStream],
        }),
      );
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
      }
    } catch (e) {
      this.closeVideoCall(e);
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
    this.targetUserName = message.name;
    const remoteDescription = new RTCSessionDescription(message.sdp);
    if (this.rtcPeerConnection.signalingState !== 'stable') {
      Log.warn('Signaling state is not stable, so triggering rollback');
      await Promise.all([
        this.rtcPeerConnection.setLocalDescription({type: 'rollback'}),
        this.rtcPeerConnection.setRemoteDescription(remoteDescription),
      ]);
      return;
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
    this.socketServer.send(new PeerConnectionNewICECandidateMessage(this.targetUserName!, event.candidate));
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
    // TODO: clean up events like MDN example does, especially reset member variables like webcamStream, targetUser etc.!
    Log.warn('closeVideoCall() called!');
    this.closeVideoCallListener.onCloseVideoCall(e);
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
