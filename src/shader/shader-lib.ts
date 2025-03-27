import { HashCache } from "@/utils/hash-cache";
import { link } from "wesl";
import {
  ShaderOptions,
  ShaderOptionsEqual,
  ShaderOptionsHash,
} from "./shader-options";
import ShaderSource from "./shader-source";
import ShaderVariant from "./shader-variant";

class ShaderLib {
  private readonly shaderSources: Map<string, ShaderSource>;
  private readonly shaderVariants: Map<
    ShaderSource,
    HashCache<ShaderOptions, ShaderVariant>
  >;

  constructor() {
    this.shaderSources = new Map();
    this.shaderVariants = new Map();
  }

  getShaderSource(name: string): ShaderSource | undefined {
    return this.shaderSources.get(name);
  }

  registerShaderSource(source: ShaderSource) {
    this.shaderSources.set(source.getName(), source);
  }

  unregisterShaderSource(source: ShaderSource) {
    this.shaderSources.delete(source.getName());
    this.shaderVariants.delete(source);
  }

  async getShaderVariant(
    source: ShaderSource,
    options: ShaderOptions,
  ): Promise<ShaderVariant> {
    let cache = this.shaderVariants.get(source);
    if (!cache) {
      cache = new HashCache(16, ShaderOptionsHash, ShaderOptionsEqual);
      this.shaderVariants.set(source, cache);
    }
    let variant = cache.get(options);
    if (variant) {
      // Variant already exists, return it
      return variant;
    }
    // Variant does not exist, create it
    const result = await link({
      weslSrc: Object.fromEntries(
        Array.from(this.shaderSources.entries()).map(([name, source]) => [
          name,
          source.getSource(),
        ]),
      ),
      rootModuleName: source.getName(),
      constants: options?.constants,
      conditions: options?.conditions,
    });
    variant = new ShaderVariant(result.dest, options);
    cache.set(options, variant);
    return variant;
  }
}

export default ShaderLib;
