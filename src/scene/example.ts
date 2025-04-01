import { Scene } from "./scene";
import { Entity } from "./entity";
import { Component } from "./component";
import { vec3 } from "wgpu-matrix";

// 自定义组件示例：旋转器组件
class Rotator extends Component {
  public rotationSpeed: number = 1.0;
  public rotationAxis = vec3.create(0, 1, 0);

  update(deltaTime: number): void {
    if (!this.entity) return;

    // 获取实体的Transform组件
    const transform = this.entity.transform;

    // 绕Y轴旋转
    transform.rotateAround(this.rotationAxis, this.rotationSpeed * deltaTime);
  }
}

// 自定义组件示例：移动器组件
class Mover extends Component {
  public moveSpeed: number = 2.0;
  public moveDirection = vec3.create(1, 0, 0);
  private _time: number = 0;

  update(deltaTime: number): void {
    if (!this.entity) return;

    this._time += deltaTime;

    // 获取实体的Transform组件
    const transform = this.entity.transform;

    // 计算移动方向
    const direction = vec3.clone(this.moveDirection);
    vec3.scale(
      direction,
      Math.sin(this._time) * this.moveSpeed * deltaTime,
      direction,
    );

    // 移动实体
    transform.translate(direction);
  }
}

// EC系统使用示例
export function createExampleScene(): Scene {
  // 创建场景
  const scene = new Scene("ExampleScene");

  // 创建一个父实体
  const parent = scene.createEntity("Parent");
  parent.transform.setPosition(0, 0, 0);

  // 添加旋转器组件到父实体
  const parentRotator = parent.addComponent(Rotator);
  parentRotator.rotationSpeed = 0.5;
  parentRotator.rotationAxis = vec3.create(0, 1, 0);

  // 创建一个子实体
  const child = scene.createEntity("Child");
  child.transform.setPosition(3, 0, 0);
  child.transform.setScale(0.5, 0.5, 0.5);

  // 设置父子关系
  child.parent = parent;

  // 添加移动器组件到子实体
  const childMover = child.addComponent(Mover);
  childMover.moveSpeed = 1.0;
  childMover.moveDirection = vec3.create(0, 1, 0);

  // 创建另一个子实体
  const child2 = scene.createEntity("Child2");
  child2.transform.setPosition(0, 0, 3);
  child2.parent = parent;

  // 添加旋转器组件到第二个子实体
  const child2Rotator = child2.addComponent(Rotator);
  child2Rotator.rotationSpeed = 2.0;
  child2Rotator.rotationAxis = vec3.create(1, 0, 0);

  return scene;
}

// 场景更新示例
export function updateScene(scene: Scene, deltaTime: number): void {
  // 更新场景中的所有实体和组件
  scene.update(deltaTime);
}

// 用法示例:
//
// 创建示例场景
const scene = createExampleScene();

// 游戏循环
let lastTime = 0;
function gameLoop(currentTime: number) {
  const deltaTime = (currentTime - lastTime) / 1000; // 转换为秒
  lastTime = currentTime;

  // 更新场景
  updateScene(scene, deltaTime);

  // 渲染场景 (这部分会集成到渲染引擎中)
  // renderer.render(scene);

  requestAnimationFrame(gameLoop);
}

// 启动游戏循环
requestAnimationFrame(gameLoop);
