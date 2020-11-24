type Id = 'attendees' | 'call'
  | 'chat' | 'chat-message'
  | 'lobby' | 'lobby-form'
  | 'local-video'
  | 'login'
  | 'received-video'
  | 'room' | 'roomname'
  | 'sent-chat'
  | 'username'

export enum ClassName {
  hidden = 'hidden',
}

export class Dom {
  readonly lobbyForm = this.getElementById('form', 'lobby-form');
  readonly usernameInput = this.getElementById('input', 'username');
  readonly roomNameInput = this.getElementById('input', 'roomname');
  readonly lobbyRoot = this.getElementById('div', 'lobby');
  readonly roomRoot = this.getElementById('div', 'room');
  readonly chatList = this.getElementById('ul', 'chat');
  readonly attendeesList = this.getElementById('ul', 'attendees');
  readonly receivedVideo = this.getElementById('video', 'received-video');
  readonly localVideo = this.getElementById('video', 'local-video');
  readonly chatMessageInput = this.getElementById('input', 'chat-message');
  readonly sentChatButton = this.getElementById('button', 'sent-chat');
  readonly callButton = this.getElementById('button', 'call');

  constructor(private readonly root: Document) {
  }

  private getElementById<K extends keyof HTMLElementTagNameMap>(tagName: K, id: Id): HTMLElementTagNameMap[K] {
    const element = this.root.getElementById(id);
    if (element === null) {
      throw Error(`Element with id '${id}' not found.`);
    }
    if (element.tagName.toLowerCase() !== tagName) {
      throw Error(`Element with id '${id}' has unexpected tag name '${element.tagName}' instead of '${tagName}'.`);
    }
    return element as any;
  }
}
