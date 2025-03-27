import { WgslReflect } from "wgsl_reflect";
import { ShaderOptions } from "./shader-options";

/**
 * A variant of a shader source.
 *
 * @example
 * ```ts
 * const PBR_SHADER : ShaderSource = ...;
 * const variant = await shaderLib.getShaderVariant(PBR_SHADER, {
 *   constants: {
 *     PI: Math.PI,
 *   },
 * });
 * ```
 */
class ShaderVariant {
  private readonly code: string;
  private readonly options: ShaderOptions;
  private readonly reflect: WgslReflect;

  constructor(code: string, options: ShaderOptions) {
    this.code = code;
    this.options = options;
    this.reflect = new WgslReflect(this.code);
  }

  getCode() {
    return this.code;
  }

  getOptions() {
    return this.options;
  }

  getReflectionInfo() {
    return this.reflect;
  }
}

export default ShaderVariant;
