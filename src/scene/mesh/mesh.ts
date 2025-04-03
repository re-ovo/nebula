import { TypedArray } from "@/core";

export type Indice = Uint16Array | Uint32Array;

export class VertexAttribute {
  private _name: string;
  private _format: GPUVertexFormat;
  private _data: TypedArray;

  constructor(name: string, format: GPUVertexFormat, data: TypedArray) {
    this._name = name;
    this._format = format;
    this._data = data;
  }

  get name() {
    return this._name;
  }

  get format() {
    return this._format;
  }

  get data() {
    return this._data;
  }
}

export interface VertexAttributeKey {
  name: string;
  format: GPUVertexFormat;
}

export class Mesh {
  private _topology: GPUPrimitiveTopology;
  private _attributes: Map<string, VertexAttribute>;
  private _indices: Indice | null;
  private _vertexCount: number = 0;

  static readonly AttributePosition: VertexAttributeKey = {
    name: "a_position",
    format: "float32x3",
  };

  static readonly AttributeNormal: VertexAttributeKey = {
    name: "a_normal",
    format: "float32x3",
  };

  static readonly AttributeUv: VertexAttributeKey = {
    name: "a_uv",
    format: "float32x2",
  };

  static readonly AttributeUv1: VertexAttributeKey = {
    name: "a_uv1",
    format: "float32x2",
  };

  static readonly AttributeTangent: VertexAttributeKey = {
    name: "a_tangent",
    format: "float32x3",
  };

  static readonly AttributeColor: VertexAttributeKey = {
    name: "a_color",
    format: "float32x4",
  };

  static readonly AttributeJointWeight: VertexAttributeKey = {
    name: "a_jointWeight",
    format: "float32x4",
  };

  static readonly AttributeJointIndex: VertexAttributeKey = {
    name: "a_jointIndex",
    format: "uint16x4",
  };

  constructor(topology: GPUPrimitiveTopology = "triangle-list") {
    this._topology = topology;
    this._attributes = new Map();
    this._indices = null;
  }

  insertAttribute(key: VertexAttributeKey, data: TypedArray) {
    if (this._attributes.has(key.name)) {
      throw new Error(`Attribute ${key.name} already exists`);
    }
    this._attributes.set(
      key.name,
      new VertexAttribute(key.name, key.format, data),
    );
    this._computeVertexCount();
  }

  removeAttribute(key: string | VertexAttributeKey) {
    if (typeof key === "string") {
      this._attributes.delete(key);
    } else {
      this._attributes.delete(key.name);
    }
    this._computeVertexCount();
  }

  private _computeVertexCount() {
    this._vertexCount = 0;
    if (this._indices) {
      // 索引绘制
      this._vertexCount = this._indices.length;
    } else {
      // 顶点绘制
      this._vertexCount = Math.min(
        ...Array.from(this._attributes.values()).map((attribute) =>
          getVertexCount(attribute.format, attribute.data),
        ),
      );
    }
  }

  get indices(): Indice | null {
    return this._indices;
  }

  set indices(indices: Indice) {
    this._indices = indices;
    this._computeVertexCount();
  }

  get topology() {
    return this._topology;
  }

  get attributes() {
    return this._attributes;
  }

  get vertexCount() {
    return this._vertexCount;
  }
}

function getVertexByteSize(format: GPUVertexFormat) {
  switch (format) {
    case "float32":
      return 4;
    case "float32x2":
      return 2 * 4;
    case "float32x3":
      return 3 * 4;
    case "float32x4":
      return 4 * 4;
    case "uint16x2":
      return 2 * 2;
    case "uint16x4":
      return 4 * 2;
    case "uint32":
      return 4;
    case "uint32x2":
      return 2 * 4;
    case "uint32x3":
      return 3 * 4;
    case "uint32x4":
      return 4 * 4;
    case "sint16x2":
      return 2 * 2;
    case "sint16x4":
      return 4 * 2;
    case "sint32":
      return 4;
    case "sint32x2":
      return 2 * 4;
    case "sint32x3":
      return 3 * 4;
    case "sint32x4":
      return 4 * 4;
    case "unorm8x2":
      return 2 * 1;
    case "unorm8x4":
      return 4 * 1;
    case "unorm16x2":
      return 2 * 2;
    case "unorm16x4":
      return 4 * 2;
    case "snorm8x2":
      return 2 * 1;
    case "snorm8x4":
      return 4 * 1;
    case "snorm16x2":
      return 2 * 2;
    case "snorm16x4":
      return 4 * 2;
    case "uint8x2":
      return 2 * 1;
    case "uint8x4":
      return 4 * 1;
    case "uint8":
      return 1;
    case "sint8x2":
      return 2 * 1;
    case "sint8x4":
      return 4 * 1;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

function getVertexCount(format: GPUVertexFormat, data: TypedArray) {
  const byteSize = getVertexByteSize(format);
  return Math.floor(data.byteLength / byteSize);
}
