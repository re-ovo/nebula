export abstract class Component {
  private _entity: Entity | null = null;
  private _enabled: boolean = true;

  get entity(): Entity | null {
    return this._entity;
  }

  set entity(value: Entity | null) {
    this._entity = value;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    if (this._enabled !== value) {
      this._enabled = value;
      if (value) {
        this.onEnable();
      } else {
        this.onDisable();
      }
    }
  }

  // 生命周期方法
  onAwake(): void {}
  onEnable(): void {}
  onDisable(): void {}
  onDestroy(): void {}

  // 更新方法
  update(deltaTime: number): void {}
}

// 导入循环引用，需要延迟加载
import { Entity } from "./entity";
