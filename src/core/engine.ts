import { ForwardPipeline, RenderContext, RenderPipeline } from "@/render";
import { Clock } from "./clock";
import { Disposable } from "./types";
import { Scene, Camera } from "@/scene";

export class Engine implements Disposable {
  readonly canvasContext: GPUCanvasContext;
  readonly device: GPUDevice;
  readonly preferredFormat: GPUTextureFormat;
  readonly size: { width: number; height: number };
  readonly clock: Clock;

  readonly renderContext: RenderContext;
  private _renderPipeline: RenderPipeline;

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
    this.renderContext = new RenderContext(this);
    this._renderPipeline = new ForwardPipeline(this);
  }

  setSize(width: number, height: number) {
    this.canvasContext.canvas.width = width;
    this.canvasContext.canvas.height = height;
    this.size.width = width;
    this.size.height = height;
  }

  getTargetTexture() {
    return this.canvasContext.getCurrentTexture();
  }

  getTargetTextureView(descriptor?: GPUTextureViewDescriptor) {
    return this.getTargetTexture().createView(descriptor);
  }

  get renderPipeline() {
    return this._renderPipeline;
  }

  set renderPipeline(pipeline: RenderPipeline) {
    this._renderPipeline = pipeline;
  }

  render(scene: Scene) {
    // 更新时钟
    this.clock.update();

    // 更新场景
    scene.update(this.clock.deltaTime);

    // 查找活动相机
    const activeCameras: Camera[] = [];
    for (const entity of scene.entities) {
      if (entity.active) {
        const camera = entity.getComponent(Camera);
        if (camera) {
          // Assume Camera component exists and is implicitly enabled if entity is active
          activeCameras.push(camera);
        }
      }
    }

    // 渲染场景
    this.renderPipeline.render(this.renderContext, activeCameras);
  }

  dispose() {
    this.renderContext.dispose();
    this.canvasContext.unconfigure();
    this.device.destroy();
  }
}
