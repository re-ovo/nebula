import { Camera } from "@/scene";
import { Disposable, Engine } from "@/core";
import { RenderContext } from "./context";

export abstract class RenderPipeline implements Disposable {
  private _engine: Engine;

  constructor(engine: Engine) {
    this._engine = engine;
  }

  get engine() {
    return this._engine;
  }

  abstract render(context: RenderContext, cameras: Camera[]): Promise<void>;

  abstract dispose(): void;
}
