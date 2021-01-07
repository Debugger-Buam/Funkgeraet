import { COLORS, WhiteboardState } from "../../../shared/Whiteboard";
import { Injectable } from "../injection";
import { WhiteboardView } from "./WhiteboardView";

@Injectable()
export class WhiteboardController {
  private state: WhiteboardState = new WhiteboardState();
  private selectedColor: number = 0;
  private selectedRadius: number = 1;
  private drawBuffer: any[] = [];
  private lastPixel: any = { x: 0, y: 0, time: 0 };
  private updateListener: (data: any[]) => void = (_) => {};
  private clearListener?: () => void;

  constructor(private view: WhiteboardView) {
    this.view.onPixelDraw = (x, y) => {
      this.interpolatePixelUpdate(x, y);
    };

    this.view.onDrawingStarted = () => {
      this.lastPixel.time = 0;
    };

    this.view.onDrawingEnded = () => {
      this.lastPixel.time = 0;
    };

    this.view.onRedrawRequired = () => {
      this.redrawWhiteboard();
    };

    this.view.onColorChanged = (color: string) => {
      this.selectedColor = COLORS.indexOf(color);
    };

    this.view.onSizeChanged = (size: number) => {
      this.selectedRadius = size;
    };

    this.view.onClearButtonClicked = () => this.onClearWhiteboard();
  }

  private onClearWhiteboard() {
    if (this.clearListener) {
      this.clearListener();
    }
    this.clearWhiteBoard();
  }

  public clearWhiteBoard() {
    this.state.clear();
    this.view.clear();
  }

  private redrawWhiteboard() {
    this.view.clear();

    this.state.forEachPixel((x, y, color) => {
      this.view.drawPixel(x, y, COLORS[color]);
    });
  }

  public addWhiteboardUpdate(data: any[]) {
    for (const point of data) {
      this.view.drawPixel(point.x, point.y, COLORS[point.c]);
      this.state.setPixel(point.x, point.y, point.c);
    }
  }

  public set onWhiteboardClear(listener: () => void) {
    this.clearListener = listener;
  }

  public set onWhiteboardUpdate(listener: (data: any[]) => void) {
    this.updateListener = listener;
  }

  // we do not get updates for every pixel, so we need to interpolate between pixels
  private interpolatePixelUpdate(x: number, y: number) {
    const now = Date.now();

    if (now - this.lastPixel.time < 250) {
      const xDist = x - this.lastPixel.x;
      const yDist = y - this.lastPixel.y;
      let prevX = this.lastPixel.x;
      let prevY = this.lastPixel.y;

      for (let p = 0.0; p < 1.01; p += 0.03) {
        const nextX = Math.round(this.lastPixel.x + xDist * p);
        const nextY = Math.round(this.lastPixel.y + yDist * p);

        if (prevX !== nextX || prevY !== nextY) {
          this.setPixel(nextX, nextY);
          prevX = nextX;
          prevY = nextY;
        }
      }
    } else {
      this.setPixel(x, y);
    }

    this.lastPixel.x = x;
    this.lastPixel.y = y;
    this.lastPixel.time = now;

    this.sendBuffer();
  }

  private setPixel(cx: number, cy: number) {
    for (let extX = -this.selectedRadius; extX < this.selectedRadius; extX++) {
      for (
        let extY = -this.selectedRadius;
        extY < this.selectedRadius;
        extY++
      ) {
        const x = cx + extX;
        const y = cy + extY;

        this.view.drawPixel(x, y, COLORS[this.selectedColor]);
        this.state.setPixel(x, y, this.selectedColor);
        this.drawBuffer.push({ x, y, c: this.selectedColor });
      }
    }
  }

  private async sendBuffer() {
    this.updateListener(this.drawBuffer);
    this.drawBuffer = [];
  }
}
