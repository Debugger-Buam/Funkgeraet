import {WebSocketServer} from "../WebSocket/WebSocketServer";
import {User} from "../../../shared/User";
import {
  BaseMessage,
  WebSocketMessageType,
  WebSocketPeerConnectionSdpMessage,
} from "../../../shared/Messages";
import {Optional} from "typescript-optional";

/*
 https://media.prod.mdn.mozit.cloud/attachments/2018/08/22/16137/06b5fa4f9b25f5613dae3ce17b0185c5/WebRTC_-_Signaling_Diagram.svg
 */
export class PeerConnection {
  private readonly rtcPeerConnection: RTCPeerConnection;
  private readonly socketServer: WebSocketServer;
  private readonly sourceUser: User;
  private readonly webcamStream?: MediaStream | null;
  private targetUserName: Optional<string> = Optional.empty();

  constructor(
    socketServer: WebSocketServer,
    sourceUser: User,
    webcamStream: MediaStream | null
  ) {
    if (!process.env.STUN_SERVER_URL) {
      throw Error("STUN_SERVER_URL not defined in .env!");
    }
    this.sourceUser = sourceUser;
    this.socketServer = socketServer;

    if (webcamStream != null) {
      this.webcamStream = webcamStream;
    }

    this.rtcPeerConnection = new RTCPeerConnection({
      iceServers: [{ urls: process.env.STUN_SERVER_URL }],
    });
    this.rtcPeerConnection.onnegotiationneeded = () =>
      this.handleNegotiationNeededEvent();
    // TODO: handle other events of rtcpeer connection too (especially ICE candidate handling!)
    this.socketServer.addOnMessageEventListener((event) =>
      this.handleSocketOnMessageEvent(event)
    );
  }

  initialize(targetUser: User) {
    this.targetUserName = Optional.of(targetUser.name);
    this.setStreamOnRtcPeerConnection();
  }

  addOnTrackEventListener(listener: (evt: RTCTrackEvent) => any) {
    this.rtcPeerConnection.addEventListener("track", listener);
  }

  private setStreamOnRtcPeerConnection() {
    if (this.webcamStream != null) {
      this.webcamStream.getTracks().forEach((track) =>
        this.rtcPeerConnection.addTransceiver(track, {
          streams: [this.webcamStream as MediaStream],
        })
      );
    }
  }

  private async setAndSendLocalDescription(
    type: WebSocketMessageType,
    description: RTCSessionDescriptionInit
  ) {
    await this.rtcPeerConnection.setLocalDescription(description);
    if (this.rtcPeerConnection.localDescription === null) {
      throw Error("Local Description was not set!");
    }
    this.socketServer.send(new WebSocketPeerConnectionSdpMessage(type, this.sourceUser.name,
        this.targetUserName.get(),
        this.rtcPeerConnection.localDescription));
  }

  private async handleSocketOnMessageEvent(event: MessageEvent) {
    const message: BaseMessage = JSON.parse(event.data);
    switch (message.type) {
      case WebSocketMessageType.VIDEO_OFFER: {
        await this.handleVideoOfferMsg(
          message as WebSocketPeerConnectionSdpMessage
        );
        break;
      }
      case WebSocketMessageType.VIDEO_ANSWER: {
        await this.handleVideoAnswerMsg(
          message as WebSocketPeerConnectionSdpMessage
        );
        break;
      }
    }
  }

  private async handleVideoAnswerMsg(
    message: WebSocketPeerConnectionSdpMessage
  ) {
    const remoteDescription = new RTCSessionDescription(message.sdp);
    await this.rtcPeerConnection.setRemoteDescription(remoteDescription);
  }

  private async handleVideoOfferMsg(
    message: WebSocketPeerConnectionSdpMessage
  ) {
    this.targetUserName = Optional.of(message.name);
    const remoteDescription = new RTCSessionDescription(message.sdp);
    if (this.rtcPeerConnection.signalingState !== "stable") {
      throw Error("Signaling state is not stable during handleVideoOfferMsg!");
    }
    await this.rtcPeerConnection.setRemoteDescription(remoteDescription);

    this.setStreamOnRtcPeerConnection();
    const answer = await this.rtcPeerConnection.createAnswer();
    await this.setAndSendLocalDescription(
      WebSocketMessageType.VIDEO_ANSWER,
      answer
    );
  }

  private async handleNegotiationNeededEvent() {
    if (this.targetUserName.isEmpty()) {
      throw Error("Negotiation needed, but no target user yet set!");
    }
    const offer = await this.rtcPeerConnection.createOffer();

    if (this.rtcPeerConnection.signalingState !== "stable") {
      throw Error(
        "Signaling state is not stable handleNegotiationNeededEvent!"
      );
    }
    await this.setAndSendLocalDescription(
      WebSocketMessageType.VIDEO_OFFER,
      offer
    );
  }
}
