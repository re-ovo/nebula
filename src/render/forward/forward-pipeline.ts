import { Camera } from "@/scene";
import { RenderContext, RenderPipeline } from "../pipeline";
import { Engine } from "@/core";
import { RenderGraph } from "../graph";

export class ForwardPipeline extends RenderPipeline {
  private _renderGraph: RenderGraph;

  constructor(engine: Engine) {
    super(engine);
    console.log("ForwardPipeline constructor");
    this._renderGraph = new RenderGraph(engine);
  }

  render(context: RenderContext, cameras: Camera[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  dispose(): void {
    throw new Error("Method not implemented.");
  }
}
