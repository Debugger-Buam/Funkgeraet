import "./whiteboard.scss";
import { Dom } from "../View/Dom";
import { Injectable } from "../injection";
import { Log } from "../../../shared/Util/Log";
import { COLORS } from "../../../shared/Whiteboard";


@Injectable()
export class WhiteboardView {
  private readonly container = this.dom.whiteboardContainer;
  private readonly canvas: HTMLCanvasElement = this.dom.whiteboardCanvas as HTMLCanvasElement;
  private readonly controlsContainer = this.dom.whiteboardControls;
  private context: CanvasRenderingContext2D;
  private isDrawing: boolean = false;
  private canvasCenter = { x: 0, y: 0 };

  private pixelDrawListener: (x: number, y: number) => void = () => {};
  private redrawRequiredListener: () => void = () => {};
  private drawingStartedListener: () => void = () => {};
  private drawingEndedListener: () => void = () => {};
  private colorChangedListener: (color: string) => void = _ => {};

  constructor(private readonly dom: Dom) {
    this.context = this.canvas.getContext("2d")!;

    window.addEventListener("resize", () => {
      this.updateCanvasSize();
    });

    document.addEventListener("DOMContentLoaded", () => {
      this.updateCanvasSize();
    });

    this.initControls();

    this.canvas.addEventListener("mousedown", (event) => {
      this.isDrawing = true;
      this.drawingStartedListener();
      this.triggerPixelDrawEvent(event.offsetX, event.offsetY);
    });

    this.canvas.addEventListener("mouseup", (event) => {
      this.isDrawing = false;
      this.drawingEndedListener();
      this.triggerPixelDrawEvent(event.offsetX, event.offsetY);
    });

    this.canvas.addEventListener("mousemove", (event) => {
      if (this.isDrawing) {
        this.triggerPixelDrawEvent(event.offsetX, event.offsetY);
      }
    });

    setInterval(() => { this.updateCanvasSize(); }, 500);
  }

  private initControls() {
    let firstElement = true;
    for (const color of COLORS) {
      const element = document.createElement("span");
      element.className = firstElement ? "whiteboard-color active" : "whiteboard-color";
      element.style.backgroundColor = color;
      element.addEventListener("click", () => {
        this.colorChangedListener(color);
        this.removeActiveClass();
        element.classList.add('active');
      });
      this.controlsContainer.append(element);
      firstElement = false;
    }
  }

  private removeActiveClass() {
    for (const child of this.controlsContainer.children) {
      child.classList.remove('active');
    }
  }

  private triggerPixelDrawEvent(x: number, y: number) {
    this.pixelDrawListener(x - this.canvasCenter.x, y - this.canvasCenter.y);
  }

  public clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public drawPixel(x: number, y: number, color: string) {
    this.context.fillStyle = color;
    this.context.fillRect(x + this.canvasCenter.x, y + this.canvasCenter.y, 1, 1);
  }

  public set onPixelDraw(listener: (x: number, y: number) => void) {
    this.pixelDrawListener = listener;
  }

  public set onRedrawRequired(listener: () => void) {
    this.redrawRequiredListener = listener;
  }

  public set onDrawingStarted(listener: () => void) {
    this.drawingStartedListener = listener;
  }

  public set onDrawingEnded(listener: () => void) {
    this.drawingEndedListener = listener;
  }

  public set onColorChanged(listener: (color: string) => void) {
    this.colorChangedListener = listener;
  }

  updateCanvasSize() {
    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;

    if (width !== this.canvas.width || height !== this.canvas.height) {
      Log.info('Resize canvas...');

      this.canvas.width = width;
      this.canvas.height = height;
      this.canvasCenter.x = Math.round(width / 2);
      this.canvasCenter.y = Math.round(height / 2);
      
      this.redrawRequiredListener();
    }
  }
}