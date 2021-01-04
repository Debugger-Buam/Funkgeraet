import { Log } from "../../../shared/Util";
import { Injectable } from "../injection";

@Injectable()
export class ErrorController {
  public constructor() {}

  public handleError(error: unknown): void {
    Log.error(error);
  }
}
