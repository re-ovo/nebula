import { SparseSet } from "@/utils/sparse-set";
import { Entity } from "./entity";
import { ComponentTypeId, Signature } from "./component";
import { Bitset } from "@/utils/bitset";

// 组件元素 - 包含实体ID和组件实例
export type ComponentEl = unknown | undefined;

// 组件列表
export type ComponentList = ComponentEl[];

/** 相同组件结构的实体集合 */
export class Archetype {
  /** 该Archetype的组件签名 - 表示这个Archetype包含哪些组件 */
  readonly signature: Signature;

  /** 组件类型 */
  readonly componentTypeIds: ComponentTypeId[];

  /** 该Archetype包含的实体集合 */
  readonly entities: SparseSet;

  /** 组件数据 - 按组件类型存储 */
  private components: Map<ComponentTypeId, ComponentList>;

  constructor(componentTypeIds: ComponentTypeId[]) {
    this.componentTypeIds = componentTypeIds;
    this.components = new Map();
    this.entities = new SparseSet();
    this.signature = Bitset.fromArray(componentTypeIds);
  }

  hasEntity(entity: Entity): boolean {
    return this.entities.has(entity);
  }

  hasComponent(componentTypeId: ComponentTypeId): boolean {
    return this.componentTypeIds.includes(componentTypeId);
  }

  addEntity(entity: Entity, components: Map<ComponentTypeId, ComponentEl>) {
    if (!this.entities.add(entity)) {
      throw new Error(`Entity ${entity} already exists in archetype`);
    }
    const denseIndex = this.entities.getDenseIndex(entity);
    if (denseIndex === undefined) {
      throw new Error(`Entity ${entity} does not exist in archetype`);
    }
    for (const cid of this.componentTypeIds) {
      const componentArray = this.components.get(cid) || [];
      componentArray[denseIndex] = components.get(cid);
      this.components.set(cid, componentArray);
    }
  }

  removeEntity(entity: Entity) {
    const denseIndex = this.entities.getDenseIndex(entity);
    if (denseIndex === undefined) {
      throw new Error(`Entity ${entity} does not exist in archetype`);
    }
    for (const cid of this.componentTypeIds) {
      const componentArray = this.components.get(cid) || [];
      componentArray[denseIndex] = undefined;
      this.components.set(cid, componentArray);
    }
    this.entities.remove(entity);
  }

  addComponent(entity: Entity, typeId: ComponentTypeId, component: unknown) {
    if (!this.hasComponent(typeId)) {
      throw new Error(
        `Component type ${typeId} does not exist in archetype: ${this.componentTypeIds}`,
      );
    }
    const denseIndex = this.entities.getDenseIndex(entity);
    if (denseIndex === undefined) {
      throw new Error(`Entity ${entity} does not exist in archetype`);
    }
    const componentArray = this.components.get(typeId) || [];
    componentArray[denseIndex] = component;
    this.components.set(typeId, componentArray);
  }

  getComponent(
    entity: Entity,
    componentTypeId: ComponentTypeId,
  ): unknown | undefined {
    if (!this.componentTypeIds.includes(componentTypeId)) return undefined;
    const denseIndex = this.entities.getDenseIndex(entity);
    if (denseIndex === undefined) {
      throw new Error(`Entity ${entity} does not exist in archetype`);
    }
    const componentArray = this.components.get(componentTypeId) || [];
    return componentArray[denseIndex];
  }

  getComponents(entity: Entity): Map<ComponentTypeId, ComponentEl> {
    const denseIndex = this.entities.getDenseIndex(entity);
    if (denseIndex === undefined) {
      throw new Error(`Entity ${entity} does not exist in archetype`);
    }
    return new Map(
      this.componentTypeIds.map((cid) => [
        cid,
        this.components.get(cid)?.[denseIndex],
      ]),
    );
  }

  getComponentStorage(): Map<ComponentTypeId, ComponentList> {
    return this.components;
  }

  getEntityCount(): number {
    return this.entities.size();
  }
}
