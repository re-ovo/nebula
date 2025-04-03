import { Camera } from "@/scene";
import { RenderContext, RenderPipeline } from "../pipeline";

export class ForwardPipeline implements RenderPipeline {
  name: string = "forward";

  render(context: RenderContext, cameras: Camera[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  dispose(): void {
    throw new Error("Method not implemented.");
  }
}
