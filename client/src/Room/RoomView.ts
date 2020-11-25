import {Dom} from '../View/Dom';
import {User} from "../../../shared/User";

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
    this.chatForm.addEventListener('submit', (event) => event.preventDefault());
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
    this.chatForm.addEventListener('submit', value);
  }

  get chatMessage(): string {
    return this.chatMessageInput.value;
  }

  set chatMessage(value: string) {
    this.chatMessageInput.value = value;
  }

  appendChatMessage(message: string): void {
    const el = document.createElement('li');
    el.innerText = message;
    this.chatHistoryList.appendChild(el);
  }

  updateUserList(userNames: string[]): void {
    this.attendeesList.innerHTML = '';
    userNames.forEach((userName) => {
      const el = document.createElement('li');
      el.innerText = this.currentUser?.name === userName ? `${userName} (This is you)` : userName;
      el.onclick = () => {
        this.onAttendeeClick?.(userName);
      };
      this.attendeesList.appendChild(el);
    });
  }

  set receivedVideoSrc(value: MediaProvider | null) {
    this.receivedVideo.srcObject = value;
  }

  set localVideoSrc(value: MediaProvider | null) {
    this.localVideo.srcObject = value;
  }
}
