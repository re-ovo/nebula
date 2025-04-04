import { TypedArray } from "@/core";
import { ShaderOptions } from "@/shader";

export class ShaderData {
  private _shaderOptions: ShaderOptions;
  private _uniforms: Record<string, UniformData>;
  private _textures: Record<string, Texture>;

  constructor() {
    this._shaderOptions = {
      constants: {},
      conditions: {},
    };
    this._uniforms = {};
    this._textures = {};
  }

  get shaderOptions() {
    return this._shaderOptions;
  }

  get uniforms() {
    return this._uniforms;
  }

  setConstant(name: string, value: string | number) {
    this._shaderOptions.constants[name] = value;
  }

  setCondition(name: string, value: boolean) {
    this._shaderOptions.conditions[name] = value;
  }

  setUniform(name: string, data: UniformData) {
    this._uniforms[name] = data;
  }

  setTexture(name: string, texture: Texture) {
    this._textures[name] = texture;
  }

  getTexture(name: string) {
    return this._textures[name];
  }

  getUniform(name: string) {
    return this._uniforms[name];
  }
}

export type UniformData = TypedArray | Record<string, TypedArray>;
