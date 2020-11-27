import { Log } from "../../../shared/Util/Log";
import { Injectable } from "../injection";

@Injectable()
export class ErrorController {
  public constructor() {}

  public handleError(error: unknown): void {
    Log.error(error);
  }
}
