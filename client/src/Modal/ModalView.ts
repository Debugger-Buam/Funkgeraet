import "./modal.scss";

import { Injectable } from "../injection";
import { Dom } from "../View/Dom";

@Injectable()
export class ModalView {
  private readonly modal = this.dom.modal;
  private readonly modalContent = this.dom.modalContent;

  private readonly positiveButton = this.dom.modalButtonPositive;
  private readonly negativeButton = this.dom.modalButtonNegative;
  private readonly closeButton = this.dom.modalCloseButton;

  constructor(private readonly dom: Dom) {}

  set content(value: string) {
    this.modalContent.innerText = value;
  }

  set onPositiveAction(
    value: (this: GlobalEventHandlers, ev: MouseEvent) => any
  ) {
    this.positiveButton.onclick = value;
  }

  set onNegativeAction(
    value: (this: GlobalEventHandlers, ev: MouseEvent) => any
  ) {
    this.negativeButton.onclick = value;
    this.closeButton.onclick = value;
  }

  reset() {
    this.positiveButton.onclick = null;
    this.negativeButton.onclick = null;
    this.hide();
  }

  show() {
    this.modal.style.display = "block";
  }

  hide() {
    this.modal.style.display = "none";
  }
}
