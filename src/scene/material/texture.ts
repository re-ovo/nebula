export abstract class Texture {
  public readonly width: number;
  public readonly height: number;
  public readonly depthOrArrayLayers: number;
  public readonly label?: string;
  public readonly usage: GPUTextureUsageFlags;
  public readonly mipLevelCount?: number;
  public readonly sampleCount?: number;
  public readonly dimension?: GPUTextureDimension;

  constructor(
    width: number,
    height: number,
    depthOrArrayLayers: number = 1,
    usage: GPUTextureUsageFlags,
    label?: string,
    mipLevelCount?: number,
    sampleCount?: number,
    dimension?: GPUTextureDimension,
  ) {
    this.width = width;
    this.height = height;
    this.depthOrArrayLayers = depthOrArrayLayers;
    this.usage = usage;
    this.label = label;
    this.mipLevelCount = mipLevelCount;
    this.sampleCount = sampleCount;
    this.dimension = dimension;
  }

  get size(): GPUExtent3DStrict {
    return {
      width: this.width,
      height: this.height,
      depthOrArrayLayers: this.depthOrArrayLayers,
    };
  }

  /**
   * 创建纹理描述符
   * @returns TextureDescriptor对象
   */
  getDescriptor(): GPUTextureDescriptor {
    return {
      size: this.size,
      format: this.getFormat(),
      usage: this.usage,
      label: this.label,
      mipLevelCount: this.mipLevelCount,
      sampleCount: this.sampleCount,
      dimension: this.dimension,
    };
  }

  abstract getFormat(): GPUTextureFormat;
}

export class Texture2D extends Texture {
  constructor(
    public readonly source: GPUCopyExternalImageSource,
    public readonly format: GPUTextureFormat,
    width?: number,
    height?: number,
    usage: GPUTextureUsageFlags = GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
    label?: string,
    mipLevelCount?: number,
    sampleCount?: number,
  ) {
    // 根据source类型获取宽度和高度
    const sourceWidth = getSourceWidth(source);
    const sourceHeight = getSourceHeight(source);

    super(
      width ?? sourceWidth,
      height ?? sourceHeight,
      1,
      usage,
      label,
      mipLevelCount,
      sampleCount,
      "2d",
    );
  }

  getFormat(): GPUTextureFormat {
    return this.format;
  }
}

// 辅助函数，用于获取不同类型source的宽度
function getSourceWidth(source: GPUCopyExternalImageSource): number {
  if (
    source instanceof HTMLCanvasElement ||
    source instanceof HTMLVideoElement ||
    source instanceof HTMLImageElement ||
    source instanceof ImageBitmap ||
    source instanceof OffscreenCanvas
  ) {
    return source.width;
  } else if (source instanceof ImageData) {
    return source.width;
  } else {
    // VideoFrame或其他类型，提供默认值
    return 1;
  }
}

// 辅助函数，用于获取不同类型source的高度
function getSourceHeight(source: GPUCopyExternalImageSource): number {
  if (
    source instanceof HTMLCanvasElement ||
    source instanceof HTMLVideoElement ||
    source instanceof HTMLImageElement ||
    source instanceof ImageBitmap ||
    source instanceof OffscreenCanvas
  ) {
    return source.height;
  } else if (source instanceof ImageData) {
    return source.height;
  } else {
    // VideoFrame或其他类型，提供默认值
    return 1;
  }
}

export class RenderTexture extends Texture2D {
  constructor(
    width: number,
    height: number,
    format: GPUTextureFormat = "rgba8unorm",
    usage: GPUTextureUsageFlags = GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
    label?: string,
    mipLevelCount?: number,
    sampleCount?: number,
  ) {
    const dummyCanvas = document.createElement("canvas");
    dummyCanvas.width = 1;
    dummyCanvas.height = 1;

    super(
      dummyCanvas,
      format,
      width,
      height,
      usage,
      label,
      mipLevelCount,
      sampleCount,
    );
  }
}

export class DepthTexture extends Texture {
  public readonly format: GPUTextureFormat;

  constructor(
    width: number,
    height: number,
    format: GPUTextureFormat = "depth24plus",
    usage: GPUTextureUsageFlags = GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING,
    label?: string,
    sampleCount?: number,
  ) {
    super(width, height, 1, usage, label, 1, sampleCount, "2d");
    this.format = format;
  }

  getFormat(): GPUTextureFormat {
    return this.format;
  }
}
