import { Archetype } from "./archetype";
import {
  ComponentConstructor,
  ComponentManager,
  ComponentTypeId,
  Signature,
} from "./component";
import { Entity, EntityManager } from "./entity";
import { QueryBuilder } from "./query";
import { System, SystemContext } from "./system";

const EMPTY_COMPONENT_MAP = new Map<ComponentTypeId, unknown>();

/**
 * ECS世界 - 整个ECS的核心
 *
 * 管理所有实体、组件、系统和查询
 */
export class World {
  /** 实体管理器 */
  private entityManager: EntityManager;
  /** 组件管理器 */
  private componentManager: ComponentManager;
  /** 系统管理器 */
  private systems: System[] = [];

  /** 所有Archetype */
  private archetypes: Archetype[] = [];
  /** 实体到Archetype的映射 */
  private entityArchetypes: (Archetype | undefined)[] = [];

  /** 延迟执行的函数 */
  private deferredFunctions: (() => void)[] = [];

  constructor() {
    this.entityManager = new EntityManager();
    this.componentManager = new ComponentManager();

    // 创建一个空的Archetype，用于存储没有组件的实体
    this.archetypes.push(new Archetype([]));
  }

  private _moveEntity(entity: Entity, newArchetype: Archetype) {
    const oldArchetype = this.entityArchetypes[entity];
    const oldComponents = oldArchetype?.getComponents(entity);
    if (oldArchetype) {
      oldArchetype.removeEntity(entity);
    }
    this.entityArchetypes[entity] = newArchetype;
    newArchetype.addEntity(entity, oldComponents || EMPTY_COMPONENT_MAP);
  }

  /**
   * 创建一个新实体
   * @returns 新创建的实体ID
   */
  createEntity(): Entity {
    const entity = this.entityManager.create();
    this._moveEntity(entity, this.archetypes[0]);
    return entity;
  }

  /**
   * 检查实体是否有效
   * @param entity 实体ID
   * @returns 如果实体有效则返回true
   */
  hasEntity(entity: Entity): boolean {
    return this.entityManager.isValid(entity);
  }

  /**
   * 销毁一个实体
   * @param entity 要销毁的实体ID
   */
  destroyEntity(entity: Entity): void {
    if (!this.entityManager.isValid(entity)) {
      return;
    }

    // 从关联的Archetype中移除
    const archetype = this.entityArchetypes[entity];
    if (archetype) {
      archetype.removeEntity(entity);
      this.entityArchetypes[entity] = undefined;
    }

    // 销毁实体
    this.entityManager.destroy(entity);
  }

  /**
   * 注册组件类型
   * @param componentConstructor 组件构造函数
   * @returns 组件类型ID
   */
  registerComponent<T>(
    componentConstructor: ComponentConstructor<T>,
  ): ComponentTypeId {
    return this.componentManager.registerComponent(componentConstructor);
  }

  /**
   * 获取组件类型ID
   * @param componentConstructor 组件构造函数
   * @returns 组件类型ID
   */
  getComponentTypeId<T>(
    componentConstructor: ComponentConstructor<T>,
  ): ComponentTypeId {
    return this.componentManager.getComponentType(componentConstructor);
  }

  /**
   * 向实体添加组件
   * @param entity 实体ID
   * @param component 组件实例
   */
  addComponent<T>(entity: Entity, component: T): void {
    if (!this.entityManager.isValid(entity)) {
      throw new Error(`Cannot add component to invalid entity ${entity}`);
    }

    const constructor =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.getPrototypeOf(component).constructor as ComponentConstructor<any>;
    const componentTypeId = this.componentManager.getComponentType(constructor);

    let archetype = this.entityArchetypes[entity];
    if (!archetype) {
      throw new Error(`Entity ${entity} does not have an archetype`);
    }

    // 如果Archetype不包含该组件，则创建一个新的Archetype
    if (!archetype.hasComponent(componentTypeId)) {
      const newTypeIds = [...archetype.componentTypeIds, componentTypeId];
      archetype = this.findArchetype(newTypeIds, true)!;

      this._moveEntity(entity, archetype); // 将实体移动到新的Archetype
    }

    // 添加组件到Archetype
    archetype.addComponent(entity, componentTypeId, component);
  }

  /**
   * 从实体移除组件
   * @param entity 实体ID
   * @param componentConstructor 组件构造函数
   */
  removeComponent<T>(
    entity: Entity,
    componentConstructor: ComponentConstructor<T>,
  ): void {
    if (!this.entityManager.isValid(entity)) {
      return;
    }

    const componentTypeId =
      this.componentManager.getComponentType(componentConstructor);

    const archetype = this.entityArchetypes[entity];
    if (!archetype) {
      throw new Error(`Entity ${entity} does not have an archetype`);
    }

    const newTypeIds = archetype.componentTypeIds.filter(
      (id) => id !== componentTypeId,
    );
    const newArchetype = this.findArchetype(newTypeIds, true)!;
    this._moveEntity(entity, newArchetype);
  }

  /**
   * 获取实体的组件
   * @param entity 实体ID
   * @param componentConstructor 组件构造函数
   * @returns 组件实例
   */
  getComponent<T>(
    entity: Entity,
    componentConstructor: ComponentConstructor<T>,
  ): T | undefined {
    const archetype = this.entityArchetypes[entity];
    if (!archetype) {
      throw new Error(`Entity ${entity} does not have an archetype`);
    }

    const componentTypeId =
      this.componentManager.getComponentType(componentConstructor);
    return archetype.getComponent(entity, componentTypeId) as T;
  }

  /**
   * 注册系统
   * @param system 系统实例
   */
  registerSystem(system: System): void {
    if (this.systems.includes(system)) {
      throw new Error(`System ${system.name} already registered`);
    }
    this.systems.push(system);
  }

  createQuery(): QueryBuilder {
    return new QueryBuilder(this);
  }

  /**
   * 延迟执行函数
   * @param fn 要延迟执行的函数
   */
  defer(fn: () => void): void {
    this.deferredFunctions.push(fn);
  }

  private executeDeferredFunctions(): void {
    for (const fn of this.deferredFunctions) {
      fn();
    }
    this.deferredFunctions.length = 0;
  }

  /**
   * 更新系统
   * @param deltaTime 时间间隔
   */
  update(deltaTime: number): void {
    const context: SystemContext = {
      world: this,
      deltaTime,
    };
    for (const system of this.systems) {
      system(context);
    }
    this.executeDeferredFunctions();
  }

  /**
   * 查找完全匹配签名的Archetype
   * @param signature 组件签名或者组件类型ID数组
   * @returns 匹配的Archetype，如果没有则返回undefined
   */
  private findArchetype(
    signature: Signature | ComponentTypeId[],
    createIfNotFound: boolean = false,
  ): Archetype | undefined {
    let archetype = undefined;

    if (Array.isArray(signature)) {
      archetype = this.archetypes.find((archetype) =>
        signature.every((type) => archetype.signature.test(type)),
      );
    } else {
      archetype = this.archetypes.find((archetype) =>
        archetype.signature.equals(signature),
      );
    }

    // can't find archetype, create a new one if createIfNotFound is true
    if (!archetype && createIfNotFound) {
      archetype = Array.isArray(signature)
        ? new Archetype(signature)
        : new Archetype(signature.toArray());
      this.archetypes.push(archetype);
    }

    return archetype;
  }

  getEntityArchetype(entity: Entity): Archetype | undefined {
    return this.entityArchetypes[entity];
  }

  /**
   * 获取所有Archetype
   * @returns 所有Archetype的数组
   */
  getArchetypes(): Archetype[] {
    return this.archetypes;
  }
}
