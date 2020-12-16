import { Injectable } from "../injection";
import { ModalView } from "./ModalView";

@Injectable()
export class ModalController {
  constructor(private view: ModalView) {}

  public showModal(content: string): Promise<boolean> {
    return new Promise((resolve, _) => {
      this.view.content = content;
      this.view.show();
      this.view.onPositiveAction = () => {
        resolve(true);
        this.view.reset();
      };
      this.view.onNegativeAction = () => {
        resolve(false);
        this.view.reset();
      };
    });
  }
}
