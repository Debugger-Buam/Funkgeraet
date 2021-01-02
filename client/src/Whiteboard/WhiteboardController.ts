import { COLORS, WhiteboardState } from "../../../shared/Whiteboard";
import { Injectable } from "../injection";
import { WhiteboardView } from "./WhiteboardView";

@Injectable()
export class WhiteboardController {
  private state: WhiteboardState = new WhiteboardState();
  private selectedColor: number = 0;
  private selectedRadius: number = 1;
  private drawBuffer: any[] = [];

  constructor(
    private view: WhiteboardView
  ) {
    this.view.onPixelDraw = (x, y) => {
      this.interpolatePixelUpdate(x, y);
    }
  }

  private interpolatePixelUpdate(x: number, y: number) {
    for (let extX = -this.selectedRadius; extX < this.selectedRadius; extX++) {
      for (let extY = -this.selectedRadius; extY < this.selectedRadius; extY++) {
        this.setPixel(x + extX, y + extY);
      }
    }

    this.sendBuffer();
  }

  private setPixel(x: number, y: number) {
    this.view.drawPixel(x, y, COLORS[this.selectedColor]);
    this.state.setPixel(x, y, this.selectedColor);
    this.drawBuffer.push({ x, y, color: this.selectedColor });
  }

  private async sendBuffer() {
    // TODO: sent to server
    this.drawBuffer = [];
  }
}