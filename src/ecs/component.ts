import { Bitset } from "@/utils/bitset";
import { Entity } from "./entity";

/** 组件类型 */
export type ComponentTypeId = number;

/** 组件构造函数接口 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentConstructor<T> = new (...args: any[]) => T;

/** 组件签名, 表示一个实体拥有的组件类型, 基于ComponentType */
export type Signature = Bitset;

/**
 * 组件管理器
 * 负责注册组件类型和跟踪组件类型ID
 */
export class ComponentManager {
  private nextComponentId: ComponentTypeId = 0;

  // 组件类型ID -> 组件构造函数
  private componentTypes = new Map<
    ComponentConstructor<unknown>,
    ComponentTypeId
  >();

  // 组件构造函数 -> 组件类型ID
  private componentConstructors = new Map<
    ComponentTypeId,
    ComponentConstructor<unknown>
  >();

  /**
   * 注册一个组件类型
   * @param constructor 组件构造函数
   * @returns 组件类型ID
   */
  registerComponent<T>(constructor: ComponentConstructor<T>): ComponentTypeId {
    // 如果已经注册过，直接返回类型ID
    if (this.componentTypes.has(constructor)) {
      return this.componentTypes.get(constructor)!;
    }

    // 分配新的组件类型ID
    const componentType = this.nextComponentId++;
    this.componentTypes.set(constructor, componentType);
    this.componentConstructors.set(componentType, constructor);

    return componentType;
  }

  /**
   * 获取组件类型ID
   * @param constructor 组件构造函数
   * @returns 组件类型ID
   */
  getComponentType<T>(constructor: ComponentConstructor<T>): ComponentTypeId {
    if (!this.componentTypes.has(constructor)) {
      throw new Error(`Component ${constructor.name} not registered`);
    }
    return this.componentTypes.get(constructor)!;
  }

  /**
   * 获取组件构造函数
   * @param type 组件类型ID
   * @returns 组件构造函数
   */
  getComponentConstructor(
    type: ComponentTypeId,
  ): ComponentConstructor<unknown> {
    if (!this.componentConstructors.has(type)) {
      throw new Error(`Component type ${type} not registered`);
    }
    return this.componentConstructors.get(type)!;
  }

  /**
   * 创建组件实例
   * @param type 组件类型ID
   * @param args 构造函数参数
   * @returns 组件实例
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createComponent<T>(type: ComponentTypeId, ...args: any[]): T {
    const constructor = this.getComponentConstructor(type);
    return new constructor(...args) as T;
  }

  /**
   * 获取已注册的组件数量
   */
  getComponentCount(): number {
    return this.nextComponentId;
  }
}
