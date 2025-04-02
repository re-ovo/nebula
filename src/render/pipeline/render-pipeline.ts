import { Camera } from "@/scene";
import { Disposable } from "@/core";
import { RenderContext } from "./context";

export interface RenderPipeline extends Disposable {
  name: string;

  render(context: RenderContext, cameras: Camera[]): Promise<void>;
}
