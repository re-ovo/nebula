import { World } from "./world";

export interface Plugin {
  setup(world: World): void;
}
