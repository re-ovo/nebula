import { Entity } from "./entity";

export class Scene {
  private _name: string;
  private _entities: Entity[] = [];
  private _rootEntities: Entity[] = [];
  private _active: boolean = true;

  constructor(name: string = "Scene") {
    this._name = name;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get active(): boolean {
    return this._active;
  }

  set active(value: boolean) {
    if (this._active !== value) {
      this._active = value;
      // 设置所有根实体的激活状态
      for (const entity of this._rootEntities) {
        entity.active = value;
      }
    }
  }

  get entities(): readonly Entity[] {
    return this._entities;
  }

  get rootEntities(): readonly Entity[] {
    return this._rootEntities;
  }

  // 创建并添加实体
  createEntity(name: string = "Entity"): Entity {
    const entity = new Entity(name);
    this.addEntity(entity);
    return entity;
  }

  // 添加现有实体
  addEntity(entity: Entity): void {
    if (this._entities.includes(entity)) {
      return;
    }

    this._entities.push(entity);

    // 如果实体没有父实体，则添加到根实体列表
    if (!entity.parent) {
      this._rootEntities.push(entity);
    }

    // 设置实体的场景引用
    if (entity.scene !== this) {
      entity.scene = this;
    }
  }

  // 更新实体在根实体列表中的状态
  updateRootEntityStatus(entity: Entity, isRoot: boolean): void {
    // 确保实体属于这个场景
    if (!this._entities.includes(entity)) {
      return;
    }

    const rootIndex = this._rootEntities.indexOf(entity);
    const isInRootList = rootIndex !== -1;

    if (isRoot && !isInRootList) {
      // 添加到根实体列表
      this._rootEntities.push(entity);
    } else if (!isRoot && isInRootList) {
      // 从根实体列表中移除
      this._rootEntities.splice(rootIndex, 1);
    }
  }

  // 移除实体
  removeEntity(entity: Entity): boolean {
    const entityIndex = this._entities.indexOf(entity);
    if (entityIndex === -1) {
      return false;
    }

    // 首先移除所有子实体
    for (const child of entity.children) {
      this.removeEntity(child);
    }

    // 如果是根实体，从根实体列表中移除
    if (!entity.parent) {
      const rootIndex = this._rootEntities.indexOf(entity);
      if (rootIndex !== -1) {
        this._rootEntities.splice(rootIndex, 1);
      }
    }

    // 从实体列表中移除
    this._entities.splice(entityIndex, 1);

    // 清除实体的场景引用
    if (entity.scene === this) {
      entity.scene = null;
    }

    return true;
  }

  // 通过名称查找实体
  findEntityByName(name: string): Entity | null {
    for (const entity of this._entities) {
      if (entity.name === name) {
        return entity;
      }
    }
    return null;
  }

  // 更新场景中的所有实体
  update(deltaTime: number): void {
    if (!this._active) return;

    // 只更新根实体，子实体会在根实体的update中被递归更新
    for (const entity of this._rootEntities) {
      entity.update(deltaTime);
    }
  }

  // 销毁场景
  destroy(): void {
    // 销毁所有实体，从后向前销毁以避免循环引用问题
    for (let i = this._entities.length - 1; i >= 0; i--) {
      this._entities[i].destroy();
    }
    this._entities = [];
    this._rootEntities = [];
  }
}
