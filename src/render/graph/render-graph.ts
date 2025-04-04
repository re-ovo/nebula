import type { Engine } from "@/core";

export type ResourceHandle = symbol;

export enum ResourceType {
  Texture = "Texture",
  Buffer = "Buffer",
}

export interface TextureDescriptor {
  label?: string;
  size: GPUExtent3DStrict;
  format: GPUTextureFormat;
  usage: GPUTextureUsageFlags;
  mipLevelCount?: number;
  sampleCount?: number;
  dimension?: GPUTextureDimension;
}

export interface BufferDescriptor {
  label?: string;
  size: number;
  usage: GPUBufferUsageFlags;
  mappedAtCreation?: boolean;
}

export interface BaseResourceHandle {
  _id: ResourceHandle;
  _type: ResourceType; // 内部类型标记
  _desc: TextureDescriptor | BufferDescriptor;
  _transient: boolean; // 是否为图内部临时资源
}

export interface TextureHandle extends BaseResourceHandle {
  _type: ResourceType.Texture;
  _desc: TextureDescriptor;
}

export interface BufferHandle extends BaseResourceHandle {
  _type: ResourceType.Buffer;
  _desc: BufferDescriptor;
}

// Helper to check if a value is a TextureHandle
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isTextureHandle(handle: any): handle is TextureHandle {
  return handle && handle._type === ResourceType.Texture;
}

// Helper to check if a value is a BufferHandle
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isBufferHandle(handle: any): handle is BufferHandle {
  return handle && handle._type === ResourceType.Buffer;
}

export const ResourceUsage = {
  Texture: GPUTextureUsage,
  Buffer: GPUBufferUsage,
} as const;

export interface PassContext {
  device: GPUDevice;
  encoder: GPUCommandEncoder;

  /** 将资源句柄解析为实际的 GPU 资源 */
  resolveTexture: (handle: TextureHandle) => GPUTexture;
  resolveBuffer: (handle: BufferHandle) => GPUBuffer;

  /** 获取纹理的视图，常用于 Render Pass Attachment */
  getView: (
    handle: TextureHandle,
    desc?: GPUTextureViewDescriptor,
  ) => GPUTextureView;
}

export interface PassBuilder {
  /** 声明读取一个资源 */
  read(
    handle: TextureHandle | BufferHandle,
    usage: typeof ResourceUsage,
  ): PassBuilder;

  /** 声明写入一个资源 */
  write(
    handle: TextureHandle | BufferHandle,
    usage: typeof ResourceUsage,
  ): PassBuilder;

  /** 设置 Pass 的执行回调 */
  setExecute(
    callback: (context: PassContext) => void | Promise<void>,
  ): PassBuilder;
}

export interface PassInfo {
  name: string;
  reads: Map<ResourceHandle, typeof ResourceUsage>;
  writes: Set<ResourceHandle>;
  execute?: (context: PassContext) => void | Promise<void>;
}

/** 内部存储的资源信息 */
export interface ResourceInfo {
  id: ResourceHandle;
  type: ResourceType;
  desc: TextureDescriptor | BufferDescriptor;
  producer: number | null; // 产生此资源的 Pass 索引, null 表示导入或未产生
  lastUsed: number; // 最后使用此资源的 Pass 索引
  usages: Set<typeof ResourceUsage>; // 此资源在整个图中的所有用途
  physicalResource?: GPUTexture | GPUBuffer; // 编译后分配的物理资源
  imported: boolean; // 是否为外部导入的资源
}

/** 编译后的 Render Graph */
export interface CompiledGraph {
  orderedPasses: PassInfo[];
  resourceMap: Map<ResourceHandle, ResourceInfo>;
}

/**
 * Render Graph 实现
 */
export class RenderGraph {
  private engine: Engine;
  private passes: Map<string, PassInfo> = new Map();
  private resources: Map<ResourceHandle, ResourceInfo> = new Map();
  private compiled: CompiledGraph | null = null;

  constructor(engine: Engine) {
    this.engine = engine;
  }

  /**
   * 添加一个纹理资源
   * @param desc 纹理描述符
   * @param imported 是否为导入资源
   * @returns 纹理句柄
   */
  addTexture(desc: TextureDescriptor, imported = false): TextureHandle {
    const id = Symbol();
    const handle: TextureHandle = {
      _id: id,
      _type: ResourceType.Texture,
      _desc: desc,
      _transient: !imported,
    };

    this.resources.set(id, {
      id,
      type: ResourceType.Texture,
      desc,
      producer: null,
      lastUsed: -1,
      usages: new Set(),
      imported,
    });

    return handle;
  }

  /**
   * 添加一个缓冲区资源
   * @param desc 缓冲区描述符
   * @param imported 是否为导入资源
   * @returns 缓冲区句柄
   */
  addBuffer(desc: BufferDescriptor, imported = false): BufferHandle {
    const id = Symbol();
    const handle: BufferHandle = {
      _id: id,
      _type: ResourceType.Buffer,
      _desc: desc,
      _transient: !imported,
    };

    this.resources.set(id, {
      id,
      type: ResourceType.Buffer,
      desc,
      producer: null,
      lastUsed: -1,
      usages: new Set(),
      imported,
    });

    return handle;
  }

  /**
   * 导入外部纹理
   * @param texture 外部纹理
   * @param desc 纹理描述符
   * @returns 纹理句柄
   */
  importTexture(
    texture: GPUTexture,
    desc?: Partial<TextureDescriptor>,
  ): TextureHandle {
    const fullDesc: TextureDescriptor = {
      size: {
        width: texture.width,
        height: texture.height,
        depthOrArrayLayers: texture.depthOrArrayLayers,
      },
      format: texture.format,
      usage: texture.usage,
      ...desc,
    };

    const handle = this.addTexture(fullDesc, true);
    const resource = this.resources.get(handle._id);
    if (resource) {
      resource.physicalResource = texture;
    }

    return handle;
  }

  /**
   * 导入外部缓冲区
   * @param buffer 外部缓冲区
   * @param desc 缓冲区描述符
   * @returns 缓冲区句柄
   */
  importBuffer(
    buffer: GPUBuffer,
    desc?: Partial<BufferDescriptor>,
  ): BufferHandle {
    const fullDesc: BufferDescriptor = {
      size: buffer.size,
      usage: buffer.usage,
      ...desc,
    };

    const handle = this.addBuffer(fullDesc, true);
    const resource = this.resources.get(handle._id);
    if (resource) {
      resource.physicalResource = buffer;
    }

    return handle;
  }

  /**
   * 添加一个渲染通道
   * @param name 通道名称
   * @param callback 通道构建回调
   */
  addPass(name: string, callback: (builder: PassBuilder) => void): this {
    const reads = new Map<ResourceHandle, typeof ResourceUsage>();
    const writes = new Set<ResourceHandle>();
    let executeCallback:
      | ((context: PassContext) => void | Promise<void>)
      | undefined;

    const builder: PassBuilder = {
      read(handle, usage) {
        reads.set(handle._id, usage);
        return this;
      },
      write(handle, usage) {
        writes.add(handle._id);
        // 当写入资源时，也隐含了读取操作
        if (!reads.has(handle._id)) {
          reads.set(handle._id, usage);
        }
        return this;
      },
      setExecute(callback) {
        executeCallback = callback;
        return this;
      },
    };

    callback(builder);

    const passInfo: PassInfo = {
      name,
      reads,
      writes,
      execute: executeCallback,
    };

    this.passes.set(name, passInfo);
    return this;
  }

  /**
   * 编译渲染图
   * @returns 编译后的渲染图
   */
  compile(): CompiledGraph {
    if (!this.engine.device) {
      throw new Error("No GPU device set for render graph");
    }

    // 重置编译状态
    this.compiled = null;

    // 创建资源信息的副本
    const resourceMap = new Map<ResourceHandle, ResourceInfo>();
    for (const [id, info] of this.resources) {
      resourceMap.set(id, { ...info, usages: new Set(info.usages) });
    }

    // 拓扑排序 Pass
    const orderedPasses: PassInfo[] = this.topologicalSort();

    // 更新资源使用信息
    this.updateResourceUsageInfo(orderedPasses, resourceMap);

    // 分配物理资源
    this.allocatePhysicalResources(resourceMap);

    const compiled: CompiledGraph = {
      orderedPasses,
      resourceMap,
    };

    this.compiled = compiled;
    return compiled;
  }

  /**
   * 执行编译后的渲染图
   * @returns Promise，完成渲染后解析
   */
  async execute(): Promise<void> {
    if (!this.engine.device) {
      throw new Error("No GPU device set for render graph");
    }

    if (!this.compiled) {
      this.compile();
    }

    if (!this.compiled) {
      throw new Error("Failed to compile render graph");
    }

    const { orderedPasses, resourceMap } = this.compiled;
    const device = this.engine.device;
    const encoder = device.createCommandEncoder();

    // 创建 Pass 上下文
    const context: PassContext = {
      device,
      encoder,
      resolveTexture: (handle) => {
        const resource = resourceMap.get(handle._id);
        if (
          !resource ||
          resource.type !== ResourceType.Texture ||
          !resource.physicalResource
        ) {
          throw new Error(
            `Invalid texture handle or texture not allocated: ${handle._id.toString()}`,
          );
        }
        return resource.physicalResource as GPUTexture;
      },
      resolveBuffer: (handle) => {
        const resource = resourceMap.get(handle._id);
        if (
          !resource ||
          resource.type !== ResourceType.Buffer ||
          !resource.physicalResource
        ) {
          throw new Error(
            `Invalid buffer handle or buffer not allocated: ${handle._id.toString()}`,
          );
        }
        return resource.physicalResource as GPUBuffer;
      },
      getView: (handle, desc) => {
        const texture = context.resolveTexture(handle);
        return texture.createView(desc);
      },
    };

    // 按顺序执行每个 Pass
    for (const pass of orderedPasses) {
      if (pass.execute) {
        await pass.execute(context);
      }
    }

    // 提交命令
    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
  }

  /**
   * 清理渲染图资源
   */
  cleanup(): void {
    if (this.compiled) {
      const { resourceMap } = this.compiled;

      // 释放所有非导入的物理资源
      for (const resource of resourceMap.values()) {
        if (!resource.imported && resource.physicalResource) {
          resource.physicalResource.destroy();
          resource.physicalResource = undefined;
        }
      }

      this.compiled = null;
    }
  }

  /**
   * 重置渲染图
   */
  reset(): void {
    this.cleanup();
    this.passes.clear();
    this.resources.clear();
  }

  /**
   * 拓扑排序 Pass
   * @returns 排序后的 Pass 数组
   */
  private topologicalSort(): PassInfo[] {
    const passArray = Array.from(this.passes.values());
    const resourceProducers = new Map<ResourceHandle, number>();

    // 找出每个资源的生产者
    passArray.forEach((pass, index) => {
      pass.writes.forEach((handle) => {
        resourceProducers.set(handle, index);
      });
    });

    // 构建依赖图
    const graph: number[][] = Array.from(
      { length: passArray.length },
      () => [],
    );
    passArray.forEach((pass, index) => {
      pass.reads.forEach((_, handle) => {
        const producer = resourceProducers.get(handle);
        if (producer !== undefined && producer !== index) {
          graph[producer].push(index);
        }
      });
    });

    // 拓扑排序
    const visited = new Set<number>();
    const visiting = new Set<number>();
    const sorted: number[] = [];

    function dfs(node: number) {
      if (visited.has(node)) return;
      if (visiting.has(node)) {
        throw new Error("Circular dependency detected in render graph");
      }

      visiting.add(node);

      for (const neighbor of graph[node]) {
        dfs(neighbor);
      }

      visiting.delete(node);
      visited.add(node);
      sorted.push(node);
    }

    for (let i = 0; i < passArray.length; i++) {
      if (!visited.has(i)) {
        dfs(i);
      }
    }

    // 返回排序后的 Pass
    return sorted.map((index) => passArray[index]);
  }

  /**
   * 更新资源使用信息
   * @param orderedPasses 排序后的 Pass 数组
   * @param resourceMap 资源信息映射
   */
  private updateResourceUsageInfo(
    orderedPasses: PassInfo[],
    resourceMap: Map<ResourceHandle, ResourceInfo>,
  ): void {
    // 更新资源的 producer 和 lastUsed 信息
    orderedPasses.forEach((pass, passIndex) => {
      // 更新写入资源的生产者
      for (const handle of pass.writes) {
        const resource = resourceMap.get(handle);
        if (resource) {
          resource.producer = passIndex;
        }
      }

      // 更新资源的最后使用时间
      for (const [handle, usage] of pass.reads) {
        const resource = resourceMap.get(handle);
        if (resource) {
          resource.lastUsed = Math.max(resource.lastUsed, passIndex);
          resource.usages.add(usage);
        }
      }
    });
  }

  /**
   * 分配物理资源
   * @param resourceMap 资源信息映射
   */
  private allocatePhysicalResources(
    resourceMap: Map<ResourceHandle, ResourceInfo>,
  ): void {
    if (!this.engine.device) return;

    // 为每个未分配的资源创建物理资源
    for (const resource of resourceMap.values()) {
      // 跳过已分配的资源
      if (resource.physicalResource) continue;

      // 创建物理资源
      if (resource.type === ResourceType.Texture) {
        const desc = resource.desc as TextureDescriptor;
        resource.physicalResource = this.engine.device.createTexture({
          label: desc.label,
          size: desc.size,
          format: desc.format,
          usage: desc.usage,
          mipLevelCount: desc.mipLevelCount,
          sampleCount: desc.sampleCount,
          dimension: desc.dimension,
        });
      } else if (resource.type === ResourceType.Buffer) {
        const desc = resource.desc as BufferDescriptor;
        resource.physicalResource = this.engine.device.createBuffer({
          label: desc.label,
          size: desc.size,
          usage: desc.usage,
          mappedAtCreation: desc.mappedAtCreation,
        });
      }
    }
  }
}
