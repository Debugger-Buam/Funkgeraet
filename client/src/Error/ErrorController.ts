import {Log} from '../../../shared/Util/Log';

export class ErrorController {
  public handleError(error: unknown): void {
    Log.error(error);
  }
}
