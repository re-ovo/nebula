import { World } from "./world";

export interface EcsPlugin {
  setup(world: World): void;
}
