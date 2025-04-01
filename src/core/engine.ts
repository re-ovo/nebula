export class Engine {
  readonly canvasContext: GPUCanvasContext;
  readonly device: GPUDevice;
  readonly preferredFormat: GPUTextureFormat;
  readonly size: { width: number; height: number };

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
  }

  setSize(width: number, height: number) {
    this.size.width = width;
    this.size.height = height;
    this.canvasContext.configure({
      device: this.device,
      format: this.preferredFormat,
    });
  }

  dispose() {
    this.canvasContext.unconfigure();
    this.device.destroy();
    console.log("Engine disposed");
  }
}
