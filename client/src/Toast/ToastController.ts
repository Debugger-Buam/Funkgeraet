import {Injectable} from '../injection';
import {ToastView} from './ToastView';

@Injectable()
export class ToastController {
  constructor(private view: ToastView) {
  }

  public showToast(message: string, duration: number = 3000): void {
    this.view.showToast(message, duration);
  }
}
