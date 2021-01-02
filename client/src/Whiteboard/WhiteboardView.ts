import "./whiteboard.scss";
import { Dom } from "../View/Dom";
import { Injectable } from "../injection";


@Injectable()
export class WhiteboardView {
  private readonly whiteboardContainer = this.dom.whiteboardContainer;
  private readonly whiteboardCanvas: HTMLCanvasElement = this.dom.whiteboardCanvas as HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor(private readonly dom: Dom) {
    this.context = this.whiteboardCanvas.getContext("2d")!;

    window.addEventListener("resize", () => {
      this.updateCanvasSize();
    });

    document.addEventListener("DOMContentLoaded", () => {
      this.updateCanvasSize();
    });
  }

  updateCanvasSize() {
    const width = this.whiteboardContainer.offsetWidth;
    const height = this.whiteboardContainer.offsetHeight;
    this.whiteboardCanvas.width = width;
    this.whiteboardCanvas.width = height;
  }
}