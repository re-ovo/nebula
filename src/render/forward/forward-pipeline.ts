import { Camera } from "@/scene";
import { RenderContext, RenderPipeline } from "../pipeline";
import { Engine, hashNumber } from "@/core";
import { RenderGraph } from "../graph";

export class ForwardPipeline extends RenderPipeline {
  private _renderGraph: RenderGraph;
  private _graphHash: number = -1;

  constructor(engine: Engine) {
    super(engine);
    this._renderGraph = new RenderGraph(engine);
  }

  private buildRenderGraph(): void {
    let hash = hashNumber(this.engine.size.width);
    hash = hashNumber(this.engine.size.height, hash);

    // 不需要重新构建RG
    if (this._graphHash === hash) return;

    // 需要重新构建RG，更新hash
    this._graphHash = hash;

    // TODO: 构建渲染图
  }

  async render(context: RenderContext, cameras: Camera[]): Promise<void> {
    this.buildRenderGraph();
  }

  dispose(): void {
    this._renderGraph.reset();
    this._graphHash = -1;
  }
}
