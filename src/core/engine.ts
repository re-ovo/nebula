import { RenderContext } from "@/render";
import { Clock } from "./clock";

export class Engine implements Disposable {
  readonly canvasContext: GPUCanvasContext;
  readonly device: GPUDevice;
  readonly preferredFormat: GPUTextureFormat;
  readonly size: { width: number; height: number };
  readonly clock: Clock;
  readonly renderContext: RenderContext;

  static async create(canvas: HTMLCanvasElement) {
    if (!navigator.gpu) {
      throw new Error("WebGPU not supported in this browser");
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("No gpu adapter found!");
    }
    const device = await adapter.requestDevice();
    return new Engine(canvas, device);
  }

  constructor(canvas: HTMLCanvasElement, device: GPUDevice) {
    this.canvasContext = canvas.getContext("webgpu") as GPUCanvasContext;
    this.device = device;
    this.preferredFormat = navigator.gpu.getPreferredCanvasFormat();
    this.canvasContext.configure({
      device,
      format: this.preferredFormat,
    });
    this.size = {
      width: this.canvasContext.canvas.width,
      height: this.canvasContext.canvas.height,
    };
    this.clock = new Clock();
    this.renderContext = new RenderContext(
      this,
      this.device,
      this.canvasContext,
      this.preferredFormat,
      this.size,
    );
  }
  [Symbol.dispose](): void {
    throw new Error("Method not implemented.");
  }

  setSize(width: number, height: number) {
    this.canvasContext.canvas.width = width;
    this.canvasContext.canvas.height = height;
    this.size.width = width;
    this.size.height = height;
    this.renderContext.updateSize(width, height);
  }

  getTargetTexture() {
    return this.canvasContext.getCurrentTexture();
  }

  getTargetTextureView(descriptor?: GPUTextureViewDescriptor) {
    return this.getTargetTexture().createView(descriptor);
  }

  dispose() {
    this.renderContext.dispose();
    this.canvasContext.unconfigure();
    this.device.destroy();
  }
}
