import "./whiteboard.scss";
import { Dom } from "../View/Dom";
import { Injectable } from "../injection";
import { Log } from "../../../shared/Util";
import { COLORS } from "../../../shared/Whiteboard";
import { addClickStopPropagation } from "../View/ViewUtil";

@Injectable()
export class WhiteboardView {
  private readonly container = this.dom.whiteboardContainer;
  private readonly canvas = this.dom.whiteboardCanvas;
  private readonly controlsContainer = this.dom.whiteboardControls;
  private context: CanvasRenderingContext2D;
  private isDrawing: boolean = false;
  private canvasCenter = { x: 0, y: 0 };

  private pixelDrawListener: (x: number, y: number) => void = () => {};
  private redrawRequiredListener: () => void = () => {};
  private drawingStartedListener: () => void = () => {};
  private drawingEndedListener: () => void = () => {};
  private colorChangedListener: (color: string) => void = (_) => {};
  private sizeChangedListener: (size: number) => void = (_) => {};

  constructor(private readonly dom: Dom) {
    this.context = this.canvas.getContext("2d")!;

    window.addEventListener("resize", () => {
      this.updateCanvasSize();
    });

    document.addEventListener("DOMContentLoaded", () => {
      this.updateCanvasSize();
    });

    this.initControls();

    this.canvas.addEventListener("touchstart", (event) => {
      event.preventDefault();

      this.isDrawing = true;
      this.drawingStartedListener();

      const rect = this.canvas.getBoundingClientRect();
      this.triggerPixelDrawEvent(
        event.targetTouches[0].pageX - rect.left,
        event.targetTouches[0].pageY - rect.top
      );
    });

    this.canvas.addEventListener("touchend", (event) => {
      event.preventDefault();

      this.isDrawing = false;
      this.drawingEndedListener();

      const rect = this.canvas.getBoundingClientRect();
      this.triggerPixelDrawEvent(
        event.targetTouches[0].pageX - rect.left,
        event.targetTouches[0].pageY - rect.top
      );
    });

    this.canvas.addEventListener("touchmove", (event) => {
      event.preventDefault();

      if (this.isDrawing) {
        const rect = this.canvas.getBoundingClientRect();
        this.triggerPixelDrawEvent(
          event.targetTouches[0].pageX - rect.left,
          event.targetTouches[0].pageY - rect.top
        );
      }
    });

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

    setInterval(() => {
      this.updateCanvasSize();
    }, 500);
  }

  private initControls() {
    let firstElement = true;
    for (const color of COLORS) {
      const element = document.createElement("span");
      element.className = firstElement
        ? "whiteboard-control whiteboard-color active"
        : "whiteboard-control whiteboard-color";
      element.style.backgroundColor = color;
      element.addEventListener("click", () => {
        this.colorChangedListener(color);
        this.removeActiveClass("whiteboard-color");
        element.classList.add("active");
      });
      element.innerText = ' ';
      this.controlsContainer.append(element);
      firstElement = false;
    }

    firstElement = true;
    const SIZES = [1, 2, 3, 5, 10];
    for (let i = 0; i < SIZES.length; i++) {
      const size = SIZES[i];
      const element = document.createElement("span");
      element.className = firstElement
        ? "whiteboard-control whiteboard-size active"
        : "whiteboard-control whiteboard-size";

      element.innerText = `${size}`;
      element.addEventListener("click", () => {
        this.sizeChangedListener(size);
        this.removeActiveClass("whiteboard-size");
        element.classList.add("active");
      });
      this.controlsContainer.append(element);
      firstElement = false;
    }
  }

  set onClearButtonClicked(value: () => void) {
    addClickStopPropagation(this.dom.whiteboardClear, value);
  }

  private removeActiveClass(cls: string) {
    for (const child of this.controlsContainer.children) {
      if (child.classList.contains(cls)) child.classList.remove("active");
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
    this.context.fillRect(
      x + this.canvasCenter.x,
      y + this.canvasCenter.y,
      1,
      1
    );
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

  public set onSizeChanged(listener: (size: number) => void) {
    this.sizeChangedListener = listener;
  }

  updateCanvasSize() {
    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;

    if (width !== this.canvas.width || height !== this.canvas.height) {
      Log.info("Resize canvas...");

      this.canvas.width = width;
      this.canvas.height = height;
      this.canvasCenter.x = Math.round(width / 2);
      this.canvasCenter.y = Math.round(height / 2);

      this.redrawRequiredListener();
    }
  }
}
