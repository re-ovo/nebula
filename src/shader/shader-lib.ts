import { Conditions, link } from "wesl";
import ShaderVariant from "./shader-variant";

class ShaderLib {
  private readonly shaderSources: Map<string, string>;

  constructor() {
    this.shaderSources = new Map();
  }

  getShaderSource(name: string): string | undefined {
    return this.shaderSources.get(name);
  }

  registerShaderSource(name: string, source: string) {
    if (this.shaderSources.has(name)) {
      console.warn(`Shader source already registered: ${name}`);
    }
    this.shaderSources.set(name, source);
  }

  async getShaderVariant(
    name: string,
    constants: Record<string, string | number>,
    conditions: Conditions,
  ): Promise<ShaderVariant> {
    const result = await link({
      weslSrc: Object.fromEntries(this.shaderSources),
      rootModuleName: name,
      constants,
      conditions,
    });
    return new ShaderVariant(result.dest, constants, conditions);
  }
}

export default ShaderLib;
