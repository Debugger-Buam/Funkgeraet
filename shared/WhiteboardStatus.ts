
export var COLORS = [
  '#000000',
  '#ffffff',
  '#ff0000',
  '#00ff00',
  '#0000ff'
];

export class WhiteboardStatus {

  private pixelMap: Map<number, number> = new Map<number, number>();

  public setPixel(x: number, y: number, color: number) {
    const index = (x << 16) + y;
    this.pixelMap.set(index, color);
  }

  public forEachPixel(callback: (x: number, y: number, color: number) => void) {
    this.pixelMap.forEach((color, index) => {
      const x = index >> 16;
      const y = index - (x << 16);
      callback(x, y, color);
    });
  }

  toJson(): string {
    return JSON.stringify([...this.pixelMap]);
  }

  fromJson(jsonValue: string): void {
    this.pixelMap = new Map<number, number>(JSON.parse(jsonValue));
  }
}