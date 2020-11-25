type Id = 'attendees' | 'user-greeting-name'
  | 'chat-form' | 'chat-history' | 'chat-message'
  | 'lobby-form' | 'lobby-root'
  | 'local-video'
  | 'received-video'
  | 'room-root' | 'roomname'
  | 'username'

export enum ClassName {
  hidden = 'hidden',
}

export class Dom {
  readonly attendeesList = this.getElementById('ul', 'attendees');
  readonly userGreetingName = this.getElementById('span', 'user-greeting-name');
  readonly chatForm = this.getElementById('form', 'chat-form');
  readonly chatHistoryList = this.getElementById('ul', 'chat-history');
  readonly chatMessageInput = this.getElementById('input', 'chat-message');
  readonly lobbyForm = this.getElementById('form', 'lobby-form');
  readonly lobbyRoot = this.getElementById('div', 'lobby-root');
  readonly localVideo = this.getElementById('video', 'local-video');
  readonly receivedVideo = this.getElementById('video', 'received-video');
  readonly roomRoot = this.getElementById('div', 'room-root');
  readonly roomNameInput = this.getElementById('input', 'roomname');
  readonly usernameInput = this.getElementById('input', 'username');

  constructor(private readonly root: Document) {
  }

  private getElementById<K extends keyof HTMLElementTagNameMap>(tagName: K, id: Id): HTMLElementTagNameMap[K]
  private getElementById(tagName: keyof HTMLElementTagNameMap, id: Id): HTMLElement {
    const element = this.root.getElementById(id);
    if (element === null) {
      throw Error(`Element with id '${id}' not found.`);
    }
    if (element.tagName.toLowerCase() !== tagName) {
      throw Error(`Element with id '${id}' has unexpected tag name '${element.tagName}' instead of '${tagName}'.`);
    }
    return element;
  }
}
