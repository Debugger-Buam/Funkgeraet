import { COLORS, WhiteboardStatus } from "../../../shared/WhiteboardStatus";
import { Injectable } from "../injection";
import { WhiteboardView } from "./WhiteboardView";

@Injectable()
export class WhiteboardController {
  constructor(
    private view: WhiteboardView
  ) {
    this.init();
  }

  async init() {

  }
}