import type { Conditions } from "wesl";
import { WgslReflect } from "wgsl_reflect";

class ShaderVariant {
  private readonly code: string;
  private readonly constants: Record<string, string | number>;
  private readonly conditions: Conditions;
  private readonly reflect: WgslReflect;

  constructor(
    code: string,
    constants: Record<string, string | number>,
    conditions: Conditions,
  ) {
    this.code = code;
    this.constants = constants;
    this.conditions = conditions;
    this.reflect = new WgslReflect(this.code);
  }

  getCode() {
    return this.code;
  }

  getConstants() {
    return this.constants;
  }

  getConditions() {
    return this.conditions;
  }

  getReflectionInfo() {
    return this.reflect;
  }
}

export default ShaderVariant;
