import { hashObject } from "@/core";

export interface ShaderOptions {
  constants: Record<string, string | number>;
  conditions: Record<string, boolean>;
}

export const ShaderOptionsHash = (options: ShaderOptions) => {
  return hashObject(options);
};

export const ShaderOptionsEqual = (a: ShaderOptions, b: ShaderOptions) => {
  return JSON.stringify(a) === JSON.stringify(b);
};
