import { Archetype } from "./archetype";
import { ComponentConstructor, ComponentTypeId, Signature } from "./component";
import { Entity } from "./entity";
import { System } from "./system";
import { World } from "./world";
import { Bitset } from "@/utils/bitset";

/**
 * 查询结果的实体和组件数据
 */
export type QueryEntity<C extends Record<string, unknown>> = {
  entity: Entity;
  components: C;
};

/**
 * 查询构建器
 * 用于构建类型安全的查询
 */
export class QueryBuilder<
  C extends Record<string, unknown> = Record<string, unknown>,
> {
  private includeSignature: Signature = new Bitset(8);
  private excludeSignature: Signature = new Bitset(8);
  private componentMap: Map<ComponentTypeId, string> = new Map();
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  /**
   * 添加一个必须包含的组件类型
   * @param componentKey 组件在结果中的键名
   * @param componentConstructor 组件构造函数
   */
  with<T, K extends string>(
    componentKey: K,
    componentConstructor: ComponentConstructor<T>,
  ): QueryBuilder<C & { [key in K]: T }> {
    const componentTypeId = this.world.getComponentTypeId(componentConstructor);
    this.includeSignature.set(componentTypeId);
    this.componentMap.set(componentTypeId, componentKey);

    // 强制类型转换，因为TypeScript不能追踪这种动态添加属性的模式
    return this as unknown as QueryBuilder<C & { [key in K]: T }>;
  }

  /**
   * 添加一个必须不包含的组件类型
   * @param componentConstructor 组件构造函数
   */
  without<T>(componentConstructor: ComponentConstructor<T>): QueryBuilder<C> {
    const componentTypeId = this.world.getComponentTypeId(componentConstructor);
    this.excludeSignature.set(componentTypeId);
    return this;
  }

  /**
   * 执行查询并返回查询结果
   */
  build(): Query<C> {
    return new Query<C>(
      this.world,
      this.includeSignature,
      this.excludeSignature,
      this.componentMap,
    );
  }
}

/**
 * 查询结果
 * 支持迭代和获取结果数组
 */
export class Query<C extends Record<string, unknown>>
  implements Iterable<QueryEntity<C>>
{
  private world: World;
  private includeSignature: Signature;
  private excludeSignature: Signature;
  private componentMap: Map<ComponentTypeId, string>;

  /** 所有匹配的Archetype */
  private matchingArchetypes: Archetype[] = [];

  constructor(
    world: World,
    includeSignature: Signature,
    excludeSignature: Signature,
    componentMap: Map<ComponentTypeId, string>,
  ) {
    this.world = world;
    this.includeSignature = includeSignature;
    this.excludeSignature = excludeSignature;
    this.componentMap = componentMap;
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

  /**
   * 实现迭代器接口，允许使用for...of循环
   */
  *[Symbol.iterator](): Iterator<QueryEntity<C>> {
    for (const archetype of this.matchingArchetypes) {
      for (const entity of archetype.entities) {
        const components: Record<string, unknown> = {};

        // 获取每个请求的组件
        for (const [typeId, key] of this.componentMap.entries()) {
          components[key] = archetype.getComponent(entity, typeId);
        }

        yield { entity, components: components as C };
      }
    }
  }

  /**
   * 获取查询结果数组
   */
  getEntities(): QueryEntity<C>[] {
    return Array.from(this);
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
  refresh(): Query<C> {
    this.findMatchingArchetypes();
    return this;
  }
}
