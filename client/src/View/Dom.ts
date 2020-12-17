export enum ClassName {
  hidden = "hidden",
  callActive = "call-active",
}

export class Dom {
  readonly attendeesList = this.getElementById("attendees");
  readonly hangupButton = this.getElementById("hang-up-button");
  readonly logoutButton = this.getElementById("logout-button");
  readonly chatForm = this.getElementById("chat-form", "form");
  readonly chatHistoryList = this.getElementById("chat-history");
  readonly chatMessageInput = this.getElementById("chat-message", "input");
  readonly lobbyForm = this.getElementById("lobby-form", "form");
  readonly lobbyRoot = this.getElementById("lobby-root");
  readonly localVideo = this.getElementById("local-video", "video");
  readonly receivedVideo = this.getElementById("received-video", "video");
  readonly roomRoot = this.getElementById("room-root");
  readonly roomNameInput = this.getElementById("roomname", "input");
  readonly usernameInput = this.getElementById("username", "input");
  readonly roomNameDisplay = this.getElementById("room-name-display");
  readonly copyRoomButton = this.getElementById("copy-room-button");
  readonly shareRoomButton = this.getElementById("share-room-button");
  readonly errorSpan = this.getElementById("error-span");

  constructor(private readonly root: Document) {}

  private getElementById(id: string): HTMLElement;
  private getElementById<K extends keyof HTMLElementTagNameMap>(
    id: string,
    tagName: K
  ): HTMLElementTagNameMap[K];
  private getElementById(
    id: string,
    tagName?: keyof HTMLElementTagNameMap
  ): HTMLElement {
    const element = this.root.getElementById(id);
    if (element === null) {
      throw Error(`Element with id '${id}' not found.`);
    }
    if (tagName !== undefined && element.tagName.toLowerCase() !== tagName) {
      throw Error(
        `Element with id '${id}' has unexpected tag name '${element.tagName}' instead of '${tagName}'.`
      );
    }
    return element;
  }
}
