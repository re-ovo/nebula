import { Disposable, Engine } from "@/core";

export class RenderContext implements Disposable {
  private _engine: Engine;

  constructor(engine: Engine) {
    this._engine = engine;
  }

  get engine() {
    return this._engine;
  }

  get device() {
    return this._engine.device;
  }

  get canvasContext() {
    return this._engine.canvasContext;
  }

  get preferredFormat() {
    return this._engine.preferredFormat;
  }

  get size() {
    return this._engine.size;
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
