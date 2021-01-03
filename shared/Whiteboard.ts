export var COLORS = ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff"];

export interface PixelData {
  x: number;
  y: number;
  c: number;
}

export class WhiteboardState {
  private pixelMap: Map<number, number> = new Map<number, number>();

  public clear() {
    this.pixelMap.clear();
  }

  public setPixel(x: number, y: number, color: number) {
    // encode X and Y into one number:  X -> upper 15 bits, Y -> lower 15 bits
    const index = ((x + (1 << 14)) << 15) + (y + (1 << 14));
    this.pixelMap.set(index, color);
  }

  public forEachPixel(callback: (x: number, y: number, color: number) => void) {
    this.pixelMap.forEach((color, index) => {
      // decode X and Y into one number:  X -> upper 15 bits, Y -> lower 15 bits
      const x = (index >> 15) - (1 << 14);
      const y = index - ((index >> 15) << 15) - (1 << 14);
      callback(x, y, color);
    });
  }
}
