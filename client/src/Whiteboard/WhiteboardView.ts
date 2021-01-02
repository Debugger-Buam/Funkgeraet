import "./whiteboard.scss";
import { Dom } from "../View/Dom";
import { Injectable } from "../injection";


@Injectable()
export class WhiteboardView {
  private readonly container = this.dom.whiteboardContainer;
  private readonly canvas: HTMLCanvasElement = this.dom.whiteboardCanvas as HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private isDrawing: boolean = false;
  private canvasCenter = { x: 0, y: 0 };

  private onPixelDrawListener: (x: number, y: number) => void = () => {};
  private onRedrawRequiredListener: () => void = () => {};

  constructor(private readonly dom: Dom) {
    this.context = this.canvas.getContext("2d")!;

    window.addEventListener("resize", () => {
      this.updateCanvasSize();
    });

    document.addEventListener("DOMContentLoaded", () => {
      this.updateCanvasSize();
    });

    this.canvas.addEventListener("mousedown", (event) => {
      this.isDrawing = true;
      this.triggerPixelDrawEvent(event.offsetX, event.offsetY);
    });

    this.canvas.addEventListener("mouseup", (event) => {
      this.isDrawing = false;
      this.triggerPixelDrawEvent(event.offsetX, event.offsetY);
    });

    this.canvas.addEventListener("mousemove", (event) => {
      if (this.isDrawing) {
        this.triggerPixelDrawEvent(event.offsetX, event.offsetY);
      }
    });

    this.updateCanvasSize();
  }

  private triggerPixelDrawEvent(x: number, y: number) {
    this.onPixelDrawListener(x - this.canvasCenter.x, y - this.canvasCenter.y);
  }

  public drawPixel(x: number, y: number, color: string) {
    this.context.fillStyle = color;
    this.context.fillRect(x + this.canvasCenter.x, y + this.canvasCenter.y, 1, 1);
  }

  public set onPixelDraw(listener: (x: number, y: number) => void) {
    this.onPixelDrawListener = listener;
  }

  public set onRedrawRequired(listener: () => void) {
    this.onRedrawRequiredListener = listener;
  }

  updateCanvasSize() {
    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvasCenter.x = Math.round(width / 2);
    this.canvasCenter.y = Math.round(height / 2);
  }
}