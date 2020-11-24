import {Dom} from './Dom';

export class RoomView {
  private readonly chatList = this.dom.chatList;
  private readonly attendeesList = this.dom.attendeesList;
  private readonly receivedVideo = this.dom.receivedVideo;
  private readonly localVideo = this.dom.localVideo;
  private readonly chatMessageInput = this.dom.chatMessageInput;
  private readonly sentChatButton = this.dom.sentChatButton;
  private readonly callButton = this.dom.callButton;

  constructor(private readonly dom: Dom) {
  }

  set onSentChatButtonClicked(value: () => void) {
    this.sentChatButton.addEventListener('click', value);
  }

  set onCallButton(value: () => void) {
    this.callButton.addEventListener('click', value);
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
    this.chatList.appendChild(el);
  }

  updateUserList(users: string[]): void {
    this.attendeesList.innerHTML = '';
    users.forEach((user) => {
      const el = document.createElement('li');
      el.innerText = `${user}`;
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
