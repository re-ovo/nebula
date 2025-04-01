import { Component } from "./component";
import { Transform } from "./transform";
import { Scene } from "./scene";

export class Entity {
  private _name: string;
  private _components: Map<new (...args: unknown[]) => Component, Component> =
    new Map();
  private _children: Entity[] = [];
  private _parent: Entity | null = null;
  private _active: boolean = true;
  private _transform: Transform;
  private _scene: Scene | null = null;

  constructor(name: string = "Entity") {
    this._name = name;
    // 每个实体默认有一个Transform组件
    this._transform = this.addComponent(Transform);
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get transform(): Transform {
    return this._transform;
  }

  get active(): boolean {
    return this._active;
  }

  set active(value: boolean) {
    if (this._active !== value) {
      this._active = value;
      // 激活状态变化时调用组件的生命周期方法
      for (const component of this._components.values()) {
        component.enabled = value;
      }
      // 递归设置子实体的激活状态
      for (const child of this._children) {
        child.active = value;
      }
    }
  }

  get parent(): Entity | null {
    return this._parent;
  }

  set parent(value: Entity | null) {
    if (this._parent === value) return;

    const wasRoot = this._parent === null;

    // 从原父实体中移除
    if (this._parent) {
      const index = this._parent._children.indexOf(this);
      if (index !== -1) {
        this._parent._children.splice(index, 1);
      }
    }

    this._parent = value;

    // 添加到新父实体
    if (value) {
      value._children.push(this);
    }

    // 更新场景的根实体列表
    if (this._scene) {
      const isRoot = this._parent === null;

      // 如果从根实体变成非根实体，从根实体列表中移除
      if (wasRoot && !isRoot) {
        this._scene.updateRootEntityStatus(this, false);
      }
      // 如果从非根实体变成根实体，添加到根实体列表
      else if (!wasRoot && isRoot) {
        this._scene.updateRootEntityStatus(this, true);
      }
    }
  }

  get scene(): Scene | null {
    return this._scene;
  }

  set scene(value: Scene | null) {
    if (this._scene === value) return;

    const oldScene = this._scene;
    this._scene = value;

    // 如果是根实体，更新场景的根实体列表
    if (this._parent === null) {
      if (oldScene) {
        oldScene.updateRootEntityStatus(this, false);
      }
      if (value) {
        value.updateRootEntityStatus(this, true);
      }
    }
  }

  get children(): readonly Entity[] {
    return this._children;
  }

  addChild(child: Entity): Entity {
    child.parent = this;
    return child;
  }

  removeChild(child: Entity): void {
    child.parent = null;
  }

  // 添加组件
  addComponent<T extends Component>(
    componentType: new (...args: unknown[]) => T,
  ): T {
    if (this._components.has(componentType)) {
      return this._components.get(componentType) as T;
    }

    const component = new componentType();
    component.entity = this;
    this._components.set(componentType, component);

    // 调用生命周期方法
    component.onAwake();
    if (this._active) {
      component.enabled = true;
    }

    return component;
  }

  // 获取组件
  getComponent<T extends Component>(
    componentType: new (...args: unknown[]) => T,
  ): T | null {
    return (this._components.get(componentType) as T) || null;
  }

  // 移除组件
  removeComponent<T extends Component>(
    componentType: new (...args: unknown[]) => T,
  ): boolean {
    // 不能移除Transform组件
    // @ts-expect-error 不能移除Transform组件
    if (componentType === Transform) {
      console.warn("Cannot remove Transform component");
      return false;
    }

    const component = this._components.get(componentType);
    if (component) {
      component.onDestroy();
      component.entity = null;
      this._components.delete(componentType);
      return true;
    }
    return false;
  }

  // 更新所有组件
  update(deltaTime: number): void {
    if (!this._active) return;

    // 更新自身组件
    for (const component of this._components.values()) {
      if (component.enabled) {
        component.update(deltaTime);
      }
    }

    // 更新子实体
    for (const child of this._children) {
      child.update(deltaTime);
    }
  }

  // 销毁实体
  destroy(): void {
    // 销毁所有子实体
    while (this._children.length > 0) {
      this._children[0].destroy();
    }

    // 销毁所有组件
    for (const component of this._components.values()) {
      component.onDestroy();
      component.entity = null;
    }
    this._components.clear();

    // 从父实体中移除
    if (this._parent) {
      this._parent.removeChild(this);
    }

    // 从场景中移除
    if (this._scene) {
      this._scene.removeEntity(this);
    }
  }
}
