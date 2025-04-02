import { Mat4, mat4 } from "wgpu-matrix";
import { Component } from "../component";
import { Transform } from "../transform";
import { TransformSpace } from "../transform";

export enum ProjectionType {
  Perspective,
  Orthographic,
}

export class Camera extends Component {
  private _projectionType: ProjectionType = ProjectionType.Perspective;

  // 用于透视投影的参数
  private _fov: number = Math.PI / 4; // 45度视角，弧度制
  private _aspect: number = 16 / 9; // 默认宽高比
  private _near: number = 0.1; // 近平面
  private _far: number = 1000; // 远平面

  // 用于正交投影的参数
  private _left: number = -10;
  private _right: number = 10;
  private _bottom: number = -10;
  private _top: number = 10;

  // 视图和投影矩阵
  private _viewMatrix: Mat4 = mat4.identity();
  private _projectionMatrix: Mat4 = mat4.identity();
  private _viewProjectionMatrix: Mat4 = mat4.identity();

  // 矩阵脏标记
  private _viewMatrixDirty: boolean = true;
  private _projectionMatrixDirty: boolean = true;

  // 透视投影参数的getter和setter
  get projectionType(): ProjectionType {
    return this._projectionType;
  }

  set projectionType(value: ProjectionType) {
    this._projectionType = value;
    this._projectionMatrixDirty = true;
  }

  get fov(): number {
    return this._fov;
  }

  set fov(value: number) {
    this._fov = value;
    this._projectionMatrixDirty = true;
  }

  get aspect(): number {
    return this._aspect;
  }

  set aspect(value: number) {
    this._aspect = value;
    this._projectionMatrixDirty = true;
  }

  get near(): number {
    return this._near;
  }

  set near(value: number) {
    this._near = value;
    this._projectionMatrixDirty = true;
  }

  get far(): number {
    return this._far;
  }

  set far(value: number) {
    this._far = value;
    this._projectionMatrixDirty = true;
  }

  // 正交投影参数的getter和setter
  get left(): number {
    return this._left;
  }

  set left(value: number) {
    this._left = value;
    this._projectionMatrixDirty = true;
  }

  get right(): number {
    return this._right;
  }

  set right(value: number) {
    this._right = value;
    this._projectionMatrixDirty = true;
  }

  get bottom(): number {
    return this._bottom;
  }

  set bottom(value: number) {
    this._bottom = value;
    this._projectionMatrixDirty = true;
  }

  get top(): number {
    return this._top;
  }

  set top(value: number) {
    this._top = value;
    this._projectionMatrixDirty = true;
  }

  // 矩阵的getter
  get viewMatrix(): Mat4 {
    this.updateViewMatrix();
    return this._viewMatrix;
  }

  get projectionMatrix(): Mat4 {
    this.updateProjectionMatrix();
    return this._projectionMatrix;
  }

  get viewProjectionMatrix(): Mat4 {
    this.updateViewMatrix();
    this.updateProjectionMatrix();
    mat4.multiply(
      this._projectionMatrix,
      this._viewMatrix,
      this._viewProjectionMatrix,
    );
    return this._viewProjectionMatrix;
  }

  // 根据Transform更新视图矩阵
  private updateViewMatrix(): void {
    if (!this._viewMatrixDirty) return;

    const transform = this.entity.transform;
    mat4.copy(transform.worldMatrixInverse, this._viewMatrix);

    this._viewMatrixDirty = false;
  }

  // 更新投影矩阵
  private updateProjectionMatrix(): void {
    if (!this._projectionMatrixDirty) return;

    if (this._projectionType === ProjectionType.Perspective) {
      // 透视投影
      mat4.perspective(
        this._fov,
        this._aspect,
        this._near,
        this._far,
        this._projectionMatrix,
      );
    } else {
      // 正交投影
      mat4.ortho(
        this._left,
        this._right,
        this._bottom,
        this._top,
        this._near,
        this._far,
        this._projectionMatrix,
      );
    }

    this._projectionMatrixDirty = false;
  }

  // 当相机属性改变时调用
  onEnable(): void {
    this._viewMatrixDirty = true;
    this._projectionMatrixDirty = true;
  }

  // 重写更新方法，每帧更新视图矩阵
  update(deltaTime: number): void {
    super.update(deltaTime);
    this._viewMatrixDirty = true;
  }

  // 根据屏幕尺寸设置宽高比
  setAspectFromScreenSize(width: number, height: number): void {
    this.aspect = width / height;
    this._projectionMatrixDirty = true;
  }

  // 辅助方法：设置透视投影参数
  setPerspective(fov: number, aspect: number, near: number, far: number): void {
    this._fov = fov;
    this._aspect = aspect;
    this._near = near;
    this._far = far;
    this._projectionType = ProjectionType.Perspective;
    this._projectionMatrixDirty = true;
  }

  // 辅助方法：设置正交投影参数
  setOrthographic(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
  ): void {
    this._left = left;
    this._right = right;
    this._bottom = bottom;
    this._top = top;
    this._near = near;
    this._far = far;
    this._projectionType = ProjectionType.Orthographic;
    this._projectionMatrixDirty = true;
  }
}
