import { Injectable } from "../injection";
import { ModalView } from "./ModalView";

export enum ModalType {
  PositiveAndNegativeButtons,
  NoButtons,
}

export interface ModalOptions {
  type: ModalType;
}

@Injectable()
export class ModalController {
  private openPromise?: (value: boolean) => void;

  constructor(private view: ModalView) {}

  public showModal(
    title: string,
    content: string,
    options?: ModalOptions
  ): Promise<boolean> {
    if (this.openPromise) {
      throw Error("Already showing a Modal");
    }

    const opt: ModalOptions = options ?? {
      type: ModalType.PositiveAndNegativeButtons,
    };

    return new Promise((resolve, _) => {
      this.view.title = title;
      this.view.content = content;
      this.openPromise = resolve;

      this.configureView(opt);
      this.view.show();

      this.view.onPositiveAction = () => {
        this.openPromise = undefined;
        resolve(true);
        this.view.reset();
      };
      this.view.onNegativeAction = () => {
        this.openPromise = undefined;
        resolve(false);
        this.view.reset();
      };
    });
  }

  public close(result: boolean = false) {
    if (this.openPromise) {
      this.view.reset();
      this.openPromise(result);
      this.openPromise = undefined;
    }
  }

  private configureView(options: ModalOptions) {
    if (options.type === ModalType.NoButtons) {
      this.view.hideNegativeButton();
      this.view.hidePositiveButton();
      this.view.hideCloseButton();
    } else if (options.type === ModalType.PositiveAndNegativeButtons) {
      this.view.showPositiveButton();
      this.view.showNegativeButton();
      this.view.showCloseButton();
    }
  }
}
