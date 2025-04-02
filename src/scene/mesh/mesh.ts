import { Component } from "../component";
import { Engine } from "../../core/engine";

export interface VertexAttribute {
  format: GPUVertexFormat;
  shaderLocation: number;
}

const MeshAttributePosition: VertexAttribute = {
  format: "float32x3",
  shaderLocation: 0,
};

const MeshAttributeNormal: VertexAttribute = {
  format: "float32x3",
  shaderLocation: 1,
};

export class Mesh {}
