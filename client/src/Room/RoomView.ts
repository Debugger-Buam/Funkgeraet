import "./room.scss";
import { ClassName, Dom } from "../View/Dom";
import { User } from "../../../shared/User";
import { Injectable } from "../injection";
import { addClickStopPropagation } from "../View/ViewUtil";

@Injectable()
export class RoomView {
  private currentUser: User | undefined;
  private onAttendeeClick: ((userName: string) => any) | undefined;

  constructor(private readonly dom: Dom) {
    this.dom.chatForm.addEventListener("submit", (event) =>
      event.preventDefault()
    );
    if (typeof navigator.share === "undefined") {
      this.dom.shareRoomButton.classList.add(ClassName.hidden);
    } else {
      this.dom.copyRoomButton.classList.add(ClassName.hidden);
    }
    this.setupAttendeeHorizontalScroll();
    this.setupToggleButtons();
  }

  private setupAttendeeHorizontalScroll() {
    const container = this.dom.attendeesOthersContainer;
    container.addEventListener("wheel", (event) => {
      container.scrollLeft -= event.deltaY * 5;
    });
    let initialMousePosition: number | null = null;
    container.addEventListener("mousedown", (event) => {
      initialMousePosition = event.pageX + container.scrollLeft;
    });
    document.addEventListener("mousemove", (event) => {
      if (initialMousePosition === null) {
        return;
      }
      container.scrollLeft = initialMousePosition - event.pageX;
    });
    document.addEventListener("mouseup", () => (initialMousePosition = null));
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
    addClickStopPropagation(this.dom.openChatButton, () => {
      // only exists for mobile
      this.dom.roomRoot.classList.remove(ClassName.whiteBoardActive);
      this.dom.roomRoot.classList.remove(ClassName.callFullscreen);
    });
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
    this.dom.chatForm.addEventListener("submit", value);
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
    return this.dom.chatMessageInput.value;
  }

  set chatMessage(value: string) {
    this.dom.chatMessageInput.value = value;
  }

  scrollChatHistoryToBottom() {
    this.dom.chatHistoryList.scrollTop = this.dom.chatHistoryList.scrollHeight;
  }

  clearChatlist() {
    this.dom.chatHistoryList.innerHTML = "";
  }

  appendChatMessage(
    username: string,
    message: string,
    timestamp: string,
    colorNumber: number
  ): void {
    // using flex-flow: column and justify-content: flex-end will not allow vertical scrolling, appears to be a bug
    // https://stackoverflow.com/a/36776769/2306363, therefore we use flex-direction: column-reverse and insert
    // the chat messages in reversed order

    const element = document.createElement("div");
    const coalescedUsername = RoomView.getCoalescedUsername(username);
    element.className = "chat-entry";
    element.innerHTML = `<div class="avatar small-circle color-${colorNumber}" title="${coalescedUsername}">${
      coalescedUsername[0]
    }</div>
      <div class="name">${coalescedUsername} <span class="time-stamp">${this.timestampToString(
      timestamp
    )}</span></div>
      <div class="content">${this.getProcessedChatMessage(message)}</div>`;

    this.dom.chatHistoryList.prepend(element);
  }

  private static getCoalescedUsername(username: string) {
    return username.length < 1 ? "? Unknown" : username;
  }

  private getProcessedChatMessage(message: string) {
    var linkUrlRegex = /(\b(((https?|ftp|file):\/\/)|(www.))[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
    return message.replace(linkUrlRegex, function (url) {
      return '<a target="_blank" href="' + url + '">' + url + "</a>";
    });
  }

  private timestampToString(timestamp: string): string {
    const time = new Date(timestamp);
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  private static createAttendeeElement(user: User): HTMLDivElement {
    const coalescedUsername = RoomView.getCoalescedUsername(user.name);
    const element = document.createElement("div");
    element.className = `attendee avatar small-circle color-${user.color}`;
    user.inCallWith !== undefined && element.classList.add("in-call");
    element.title = coalescedUsername;
    element.innerHTML = `${coalescedUsername[0]}<div></div>`;
    return element;
  }

  updateUserList(users: User[]): void {
    this.dom.attendeesSelfContainer.innerHTML = "";
    this.dom.attendeesOthersContainer.innerHTML = "";

    const currentUserElement = RoomView.createAttendeeElement(
      this.currentUser!
    );
    currentUserElement.title += " (you)";
    this.dom.attendeesSelfContainer.appendChild(currentUserElement);
    users
      .filter((user) => this.currentUser?.name !== user.name)
      .forEach((user) => {
        const element = RoomView.createAttendeeElement(user);
        if (user.inCallWith === undefined) {
          addClickStopPropagation(element, () =>
            this.onAttendeeClick?.(user.name)
          );
        }
        this.dom.attendeesOthersContainer.appendChild(element);
      });
  }

  public show() {
    this.dom.roomRoot.classList.remove(ClassName.hidden);
  }

  public hide() {
    this.dom.roomRoot.classList.add(ClassName.hidden);
  }

  public startCall(localStream: MediaStream, receivedStream: MediaStream) {
    this.dom.receivedVideo.srcObject = receivedStream;
    this.dom.localVideo.srcObject = localStream;
    this.dom.roomRoot.classList.add(ClassName.callActive);
    this.dom.roomRoot.classList.add(ClassName.callFullscreen);
  }

  public endCall() {
    this.dom.receivedVideo.srcObject = null;
    this.dom.localVideo.srcObject = null;
    this.dom.roomRoot.classList.remove(ClassName.callActive);
    this.dom.roomRoot.classList.remove(ClassName.callFullscreen);
  }
}
