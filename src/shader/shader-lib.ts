import { link } from "wesl";

class ShaderLib {
  private readonly shaderSources: Record<string, string>;

  constructor() {
    this.shaderSources = {
      // TODO: Add shaders
    };
  }

  getShaderSource(name: string) {
    return this.shaderSources[name];
  }

  registerShaderSource(path: string, source: string) {
    if (this.shaderSources[path]) {
      console.warn(`Shader source already registered: ${path}`);
    }
    this.shaderSources[path] = source;
  }

  getShaderVariant(name: string): ShaderVariant {
    const source = this.getShaderSource(name);
    if (!source) {
      throw new Error(`Shader source not found: ${name}`);
    }
  }
}

export default ShaderLib;
