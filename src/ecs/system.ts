import { World } from "./world";

/**
 * 系统接口
 * 所有游戏系统必须实现此接口
 */
export interface System {
  /** 系统名称 */
  readonly name: string;

  /**
   * 系统初始化方法，在游戏开始前调用
   * @param world 世界实例
   */
  init?(world: World): void;

  /**
   * 系统更新方法，每帧调用
   * @param world 世界实例
   * @param deltaTime 距离上一帧的时间间隔(秒)
   */
  update(world: World, deltaTime: number): void;

  /**
   * 系统销毁方法，在游戏结束时调用
   * @param world 世界实例
   */
  destroy?(world: World): void;
}

/**
 * 系统管理器
 * 负责管理和更新所有系统
 */
export class SystemManager {
  /** 已注册的系统 */
  private systems: System[] = [];

  /**
   * 注册一个系统
   * @param system 系统实例
   */
  registerSystem(system: System): void {
    this.systems.push(system);
  }

  /**
   * 初始化所有系统
   * @param world 世界实例
   */
  initSystems(world: World): void {
    for (const system of this.systems) {
      if (system.init) {
        system.init(world);
      }
    }
  }

  /**
   * 更新所有系统
   * @param world 世界实例
   * @param deltaTime 距离上一帧的时间间隔(秒)
   */
  updateSystems(world: World, deltaTime: number): void {
    for (const system of this.systems) {
      system.update(world, deltaTime);
    }
  }

  /**
   * 销毁所有系统
   * @param world 世界实例
   */
  destroySystems(world: World): void {
    for (const system of this.systems) {
      if (system.destroy) {
        system.destroy(world);
      }
    }
  }
}
