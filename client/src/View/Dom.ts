type Id = 'login' | 'username' | 'roomname' | 'lobby' | 'lobby-form' | 'room'

function getElementById(tagName: 'button', id: Id): HTMLButtonElement
function getElementById(tagName: 'div', id: Id): HTMLDivElement
function getElementById(tagName: 'form', id: Id): HTMLFormElement
function getElementById(tagName: 'input', id: Id): HTMLInputElement

function getElementById(tagName: string, id: Id): HTMLElement {
  const element = document.getElementById(id);
  if (element === null) {
    throw Error(`Element with id '${id}' not found.`);
  }
  if (element.tagName.toLowerCase() !== tagName) {
    throw Error(`Element with id '${id}' has unexpected tag name '${element.tagName}' instead of '${tagName}'.`);
  }
  return element;
}

export const elements = {
  lobbyForm: getElementById('form', 'lobby-form'),
  usernameInput: getElementById('input', 'username'),
  roomNameInput: getElementById('input', 'roomname'),
  lobbyRoot: getElementById('div', 'lobby'),
  roomRoot: getElementById('div', 'room'),
};

export enum ClassName {
  hidden = 'hidden',
}
