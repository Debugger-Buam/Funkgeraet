import "./room.scss";
import { ClassName, Dom } from "../View/Dom";
import { User } from "../../../shared/User";
import { Injectable } from "../injection";

@Injectable()
export class RoomView {
  private readonly chatHistoryList = this.dom.chatHistoryList;
  private readonly attendeesList = this.dom.attendeesList;
  private readonly receivedVideo = this.dom.receivedVideo;
  private readonly localVideo = this.dom.localVideo;
  private readonly chatMessageInput = this.dom.chatMessageInput;
  private readonly chatForm = this.dom.chatForm;
  private currentUser: User | undefined;
  private onAttendeeClick: ((userName: string) => any) | undefined;

  constructor(private readonly dom: Dom) {
    this.chatForm.addEventListener("submit", (event) => event.preventDefault());
  }

  // TODO: I don't know how this would be implemented with JS setter
  public setCurrentUser(user: User) {
    this.currentUser = user;
    this.dom.userGreetingName.innerText = user.name;
  }

  public setOnAttendeeClick(value: (userName: string) => any) {
    this.onAttendeeClick = value;
  }

  set onChatFormSubmit(value: () => void) {
    this.chatForm.addEventListener("submit", value);
  }

  set onHangupButton(value: () => void) {
    this.dom.hangupButton.addEventListener("click", value);
  }

  set onLogoutButton(value: () => void) {
    this.dom.logoutButton.addEventListener("click", value);
  }

  set onCopyRoomIconClicked(value: () => void) {
    this.dom.copyRoomIcon.addEventListener("click", value);
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
    const el = document.createElement("li");
    el.innerText = message;
    this.chatHistoryList.appendChild(el);
  }

  updateUserList(users: User[]): void {
    this.attendeesList.innerHTML = "";
    users.forEach((user) => {
      const el = document.createElement("li");
      el.innerText = user.name;
      if (user.isInCall) {
        el.innerText += " is in Call";
      }
      if (this.currentUser?.name === user.name) {
        el.innerText += " (You)";
      } else {
        el.onclick = () => {
          this.onAttendeeClick?.(user.name);
        };
      }
      this.attendeesList.appendChild(el);
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
    this.dom.roomRoot.classList.add(ClassName.activeCall);
    this.dom.roomRoot.classList.remove(ClassName.noCall);
  }

  public endCall() {
    this.receivedVideo.srcObject = null;
    this.localVideo.srcObject = null;
    this.dom.roomRoot.classList.add(ClassName.noCall);
    this.dom.roomRoot.classList.remove(ClassName.activeCall);
  }
}
