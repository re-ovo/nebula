import { Archetype } from "./archetype";
import { ComponentConstructor, ComponentTypeId, Signature } from "./component";
import { Entity } from "./entity";
import { System } from "./system";
import { World } from "./world";
import { Bitset } from "@/utils/bitset";

/**
 * 查询构建器
 * 用于构建类型安全的查询
 */
export class QueryBuilder<Components extends unknown[] = []> {
  private includeSignature: Signature = new Bitset(8);
  private excludeSignature: Signature = new Bitset(8);
  private componentTypes: ComponentConstructor<unknown>[] = [];
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  /**
   * 添加一个必须包含的组件类型
   * @param componentConstructor 组件构造函数
   */
  with<T>(
    componentConstructor: ComponentConstructor<T>,
  ): QueryBuilder<[...Components, T]> {
    const componentTypeId = this.world.getComponentTypeId(componentConstructor);
    this.includeSignature.set(componentTypeId);
    this.componentTypes.push(componentConstructor);

    // 强制类型转换，因为TypeScript不能追踪这种动态添加属性的模式
    return this as unknown as QueryBuilder<[...Components, T]>;
  }

  /**
   * 添加一个必须不包含的组件类型
   * @param componentConstructor 组件构造函数
   */
  without<T>(
    componentConstructor: ComponentConstructor<T>,
  ): QueryBuilder<Components> {
    const componentTypeId = this.world.getComponentTypeId(componentConstructor);
    this.excludeSignature.set(componentTypeId);
    return this;
  }

  /**
   * 执行查询并返回查询结果
   */
  build(): Query<Components> {
    return new Query<Components>(
      this.world,
      this.includeSignature,
      this.excludeSignature,
      this.componentTypes,
    );
  }
}

/**
 * 查询结果
 * 支持迭代和获取结果数组
 */
export class Query<Components extends unknown[]> {
  private world: World;
  private includeSignature: Signature;
  private excludeSignature: Signature;
  private componentTypes: ComponentConstructor<unknown>[];
  private componentTypeIds: ComponentTypeId[] = [];

  /** 所有匹配的Archetype */
  private matchingArchetypes: Archetype[] = [];

  constructor(
    world: World,
    includeSignature: Signature,
    excludeSignature: Signature,
    componentTypes: ComponentConstructor<unknown>[],
  ) {
    this.world = world;
    this.includeSignature = includeSignature;
    this.excludeSignature = excludeSignature;
    this.componentTypes = componentTypes;
    this.componentTypeIds = componentTypes.map((t) =>
      world.getComponentTypeId(t),
    );
    this.findMatchingArchetypes();
  }

  private findMatchingArchetypes(): void {
    this.matchingArchetypes = this.world.getArchetypes().filter((archetype) => {
      const includeSignature = this.includeSignature;
      const excludeSignature = this.excludeSignature;
      const archetypeSignature = archetype.signature;

      // 所有需要的组件都必须存在
      // 我们应该检查includeSignature中的每个bit都在archetype.signature中
      let hasAllRequired = true;
      for (const id of includeSignature.toArray()) {
        if (!archetypeSignature.test(id)) {
          hasAllRequired = false;
          break;
        }
      }

      // 所有排除的组件都不能存在
      let hasNoExcluded = excludeSignature.toArray().length === 0;
      if (!hasNoExcluded) {
        hasNoExcluded = true;
        for (const id of excludeSignature.toArray()) {
          if (archetypeSignature.test(id)) {
            hasNoExcluded = false;
            break;
          }
        }
      }

      return hasAllRequired && hasNoExcluded;
    });
  }

  forEach<Args extends [...Components]>(
    callback: (entity: Entity, ...components: Args) => void,
  ): void {
    this.matchingArchetypes.forEach((archetype) => {
      const components = archetype.getComponentStorage();
      for (let i = 0; i < archetype.getEntityCount(); i++) {
        const entity = archetype.entities.getSparseIndex(i)!;
        const componentArgs: unknown[] = [];

        // 收集所有组件
        for (const typeId of this.componentTypeIds) {
          const component = components.get(typeId)?.[i];
          if (component) {
            componentArgs.push(component);
          }
        }

        // 调用回调函数
        callback(entity, ...(componentArgs as Args));
      }
    });
  }

  /**
   * 获取查询结果数组
   */
  getEntities(): [Entity, ...Components][] {
    const result: [Entity, ...Components][] = [];

    this.matchingArchetypes.forEach((archetype) => {
      const components = archetype.getComponentStorage();
      for (let i = 0; i < archetype.getEntityCount(); i++) {
        const entity = archetype.entities.getSparseIndex(i)!;
        const componentArgs: unknown[] = [];

        // 收集所有组件
        for (const typeId of this.componentTypeIds) {
          const component = components.get(typeId)?.[i];
          if (component) {
            componentArgs.push(component);
          }
        }

        result.push([entity, ...componentArgs] as [Entity, ...Components]);
      }
    });

    return result;
  }

  /**
   * 获取查询匹配到的实体数量
   */
  count(): number {
    let count = 0;
    for (const archetype of this.matchingArchetypes) {
      count += archetype.entities.size();
    }
    return count;
  }

  /**
   * 刷新查询，更新匹配的原型
   * 当世界状态变化较大时调用此方法
   */
  refresh(): Query<Components> {
    this.findMatchingArchetypes();
    return this;
  }
}
