import { World } from "./world";

export type System = (context: SystemContext) => void;

export type SystemContext = {
  world: World;
  deltaTime: number;
};
