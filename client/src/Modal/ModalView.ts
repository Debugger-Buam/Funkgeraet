import "./modal.scss";

import { Injectable } from "../injection";
import { Dom } from "../View/Dom";

@Injectable()
export class ModalView {
  private readonly modal = this.dom.modal;
  private readonly modalContent = this.dom.modalContent;
  private readonly modalTitle = this.dom.modalTitle;

  private readonly positiveButton = this.dom.modalButtonPositive;
  private readonly negativeButton = this.dom.modalButtonNegative;
  private readonly closeButton = this.dom.modalCloseButton;

  constructor(private readonly dom: Dom) {}

  set title(value: string) {
    this.modalTitle.innerText = value;
  }

  set content(value: string) {
    this.modalContent.innerHTML = value;
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
    this.showPositiveButton();
    this.showNegativeButton();
    this.showCloseButton();
    this.hide();
  }

  show() {
    this.modal.style.display = "block";
  }

  hide() {
    this.modal.style.display = "none";
  }

  showPositiveButton() {
    this.positiveButton.style.display = "";
  }

  hidePositiveButton() {
    this.positiveButton.style.display = "none";
  }

  showNegativeButton() {
    this.negativeButton.style.display = "";
  }

  hideNegativeButton() {
    this.negativeButton.style.display = "none";
  }

  showCloseButton() {
    this.closeButton.style.display = "";
  }

  hideCloseButton() {
    this.closeButton.style.display = "none";
  }
}
