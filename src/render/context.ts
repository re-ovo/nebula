import { Disposable, Engine } from "@/core";

export class RenderContext implements Disposable {
  private _engine: Engine;
  private _device: GPUDevice;
  private _canvasContext: GPUCanvasContext;
  private _preferredFormat: GPUTextureFormat;
  private _size: { width: number; height: number };

  constructor(
    engine: Engine,
    device: GPUDevice,
    canvasContext: GPUCanvasContext,
    preferredFormat: GPUTextureFormat,
    size: { width: number; height: number },
  ) {
    this._engine = engine;
    this._device = device;
    this._canvasContext = canvasContext;
    this._preferredFormat = preferredFormat;
    this._size = size;
  }

  updateSize(width: number, height: number) {
    this._size.width = width;
    this._size.height = height;
  }

  get engine() {
    return this._engine;
  }

  get device() {
    return this._device;
  }

  get canvasContext() {
    return this._canvasContext;
  }

  get preferredFormat() {
    return this._preferredFormat;
  }

  get size() {
    return this._size;
  }

  getTargetTexture() {
    return this._engine.getTargetTexture();
  }

  getTargetTextureView(descriptor?: GPUTextureViewDescriptor) {
    return this._engine.getTargetTextureView(descriptor);
  }

  dispose() {
    // TODO: 释放资源
  }
}
