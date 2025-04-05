import { Engine } from "@/core";

export interface ResourceAllocator<C, G> {
  allocate(engine: Engine, cpuResource: C): G;
}
