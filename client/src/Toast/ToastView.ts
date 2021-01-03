import "./toast.scss";

import { Injectable } from "../injection";
import { ClassName, Dom } from "../View/Dom";

@Injectable()
export class ToastView {
  private readonly toast = this.dom.toast;
  private toastTimeout?: NodeJS.Timeout;

  constructor(private readonly dom: Dom) {}

  public showToast(message: string, duration: number = 3000): void {
    this.toast.innerText = message;
    this.toast.classList.remove(ClassName.hidden);
    this.toast.classList.add(ClassName.shown);

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      this.toast.classList.remove(ClassName.shown);
      this.toastTimeout = undefined;
    }, duration);
  }
}
