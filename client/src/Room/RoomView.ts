import "./room.scss";
import { ClassName, Dom } from "../View/Dom";
import { User } from "../../../shared/User";
import { Injectable } from "../injection";
import {addClickStopPropagation} from "../View/ViewUtil";

@Injectable()
export class RoomView {
  private readonly chatHistoryList = this.dom.chatHistoryList;
  private readonly receivedVideo = this.dom.receivedVideo;
  private readonly localVideo = this.dom.localVideo;
  private readonly chatMessageInput = this.dom.chatMessageInput;
  private readonly chatForm = this.dom.chatForm;
  private currentUser: User | undefined;
  private onAttendeeClick: ((userName: string) => any) | undefined;

  constructor(private readonly dom: Dom) {
    this.chatForm.addEventListener("submit", (event) => event.preventDefault());
    if (typeof navigator.share === "undefined") {
      this.dom.shareRoomButton.classList.add(ClassName.hidden);
    } else {
      this.dom.copyRoomButton.classList.add(ClassName.hidden);
    }
    this.setupToggleButtons();
  }

  private setupToggleButtons() {
    /*
   Mobil
     links: .call-active.call-fullscreen
     mitte: NO_CLASS OR .call-active
     rechts: .whiteboard-active OR .whiteboard-active.call-active
   Desktop
     links: .call-active.call-fullscreen
     rechts: NO_CLASS OR .call-active
   */

    addClickStopPropagation(this.dom.openWhiteBoardButton, () => {
      // whiteBoardButton only clickable when whiteBoardActive class is not set (it's hidden by room.scss otherwise)
      this.dom.roomRoot.classList.add(ClassName.whiteBoardActive);
      this.dom.roomRoot.classList.remove(ClassName.callFullscreen); // only for desktop relevant
    });
    addClickStopPropagation(this.dom.openChatButton, () => { // only exists for mobile
      this.dom.roomRoot.classList.remove(ClassName.whiteBoardActive);
      this.dom.roomRoot.classList.remove(ClassName.callFullscreen);
    })
    addClickStopPropagation(this.dom.receivedVideoContainer, () => {
      this.dom.roomRoot.classList.add(ClassName.callFullscreen);
      this.dom.roomRoot.classList.remove(ClassName.whiteBoardActive);
    });
    addClickStopPropagation(this.dom.openVideoButton, () => {
      this.dom.roomRoot.classList.add(ClassName.callFullscreen);
      this.dom.roomRoot.classList.remove(ClassName.whiteBoardActive);
    });
  }

  public setCurrentUser(user: User) {
    this.currentUser = user;
  }

  public setOnAttendeeClick(value: (userName: string) => any) {
    this.onAttendeeClick = value;
  }

  set onChatFormSubmit(value: () => void) {
    this.chatForm.addEventListener("submit", value);
  }

  set onHangupButton(value: () => void) {
    addClickStopPropagation(this.dom.hangupButton, value);
  }

  set onLogoutButton(value: () => void) {
    addClickStopPropagation(this.dom.logoutButton, value);
  }

  set onCopyRoomIconClicked(value: () => void) {
    addClickStopPropagation(this.dom.copyRoomButton, value);
  }

  set onShareRoomIconClicked(value: () => void) {
    addClickStopPropagation(this.dom.shareRoomButton, value);
  }

  set roomName(value: string) {
    this.dom.roomNameDisplay.innerText = value;
  }

  get chatMessage(): string {
    return this.chatMessageInput.value;
  }

  set chatMessage(value: string) {
    this.chatMessageInput.value = value;
  }

  clearChatlist() {
    this.chatHistoryList.innerHTML = "";
  }

  appendChatMessage(message: string): void {
    const el = document.createElement("div");
    el.innerText = message;
    this.chatHistoryList.appendChild(el);
  }

  updateUserList(users: User[]): void {
    this.dom.attendeesContainer.innerHTML = "";
    users.filter((user) => this.currentUser?.name !== user.name).forEach((user) => {
      const userName = user.name.length < 1 ? "? Unknown" : user.name;
      const element = document.createElement("div");
      element.className = `attendee icon-button color-${user.color}`;
      user.inCallWith !== undefined && element.classList.add("in-call");
      element.title = userName;
      element.innerHTML = `${userName[0]}<div></div>`;

      if(user.inCallWith === undefined) {
        addClickStopPropagation(element, () => this.onAttendeeClick?.(user.name));
      }

      this.dom.attendeesContainer.appendChild(element);
    });
  }

  public show() {
    this.dom.roomRoot.classList.remove(ClassName.hidden);
  }

  public hide() {
    this.dom.roomRoot.classList.add(ClassName.hidden);
  }

  public startCall(localStream: MediaStream, receivedStream: MediaStream) {
    this.receivedVideo.srcObject = receivedStream;
    this.localVideo.srcObject = localStream;
    this.dom.roomRoot.classList.add(ClassName.callActive);
    this.dom.roomRoot.classList.add(ClassName.callFullscreen);
  }

  public endCall() {
    this.receivedVideo.srcObject = null;
    this.localVideo.srcObject = null;
    this.dom.roomRoot.classList.remove(ClassName.callActive);
    this.dom.roomRoot.classList.remove(ClassName.callFullscreen);
  }
}
