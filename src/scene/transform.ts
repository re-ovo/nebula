import { Component } from "./component";
import { mat4, vec3, quat } from "wgpu-matrix";
import type { Mat4, Vec3, Quat } from "wgpu-matrix";

export class Transform extends Component {
  private _position: Vec3 = vec3.create(0, 0, 0);
  private _rotation: Quat = quat.identity();
  private _scale: Vec3 = vec3.create(1, 1, 1);

  private _worldPosition: Vec3 = vec3.create(0, 0, 0);
  private _worldRotation: Quat = quat.identity();
  private _worldScale: Vec3 = vec3.create(1, 1, 1);

  private _localMatrix: Mat4 = mat4.identity();
  private _worldMatrix: Mat4 = mat4.identity();

  private _dirtyFlags: TransformDirty = TransformDirty.LocalAndWorld;

  // 位置
  get position(): Vec3 {
    return vec3.clone(this._position);
  }

  set position(value: Vec3) {
    vec3.copy(value, this._position);
    this.setDirty(TransformDirty.LocalAndWorld);
  }

  // 旋转（四元数）
  get rotation(): Quat {
    return quat.clone(this._rotation);
  }

  set rotation(value: Quat) {
    quat.copy(value, this._rotation);
    this.setDirty(TransformDirty.LocalAndWorld);
  }

  // 缩放
  get scale(): Vec3 {
    return vec3.clone(this._scale);
  }

  set scale(value: Vec3) {
    vec3.copy(value, this._scale);
    this.setDirty(TransformDirty.LocalAndWorld);
  }

  get worldPosition(): Vec3 {
    if (this.isDirty(TransformDirty.World)) {
      this.updateWorldMatrix();
    }
    return vec3.clone(this._worldPosition);
  }

  get worldRotation(): Quat {
    if (this.isDirty(TransformDirty.World)) {
      this.updateWorldMatrix();
    }
    return quat.clone(this._worldRotation);
  }

  get worldScale(): Vec3 {
    if (this.isDirty(TransformDirty.World)) {
      this.updateWorldMatrix();
    }
    return vec3.clone(this._worldScale);
  }

  // 获取本地矩阵
  get localMatrix(): Mat4 {
    if (this.isDirty(TransformDirty.Local)) {
      this.updateLocalMatrix();
    }
    return this._localMatrix;
  }

  // 获取世界矩阵
  get worldMatrix(): Mat4 {
    if (this.isDirty(TransformDirty.World)) {
      this.updateWorldMatrix();
    }
    return this._worldMatrix;
  }

  setDirty(flags: TransformDirty): void {
    this._dirtyFlags |= flags;
    this.notifyChildren();
  }

  isDirty(flags: TransformDirty): boolean {
    return (this._dirtyFlags & flags) !== 0;
  }

  clearDirty(flags: TransformDirty): void {
    this._dirtyFlags &= ~flags;
  }

  private notifyChildren(): void {
    const entity = this.entity;
    if (entity && entity.children) {
      for (const child of entity.children) {
        if (child.transform) {
          child.transform.setDirty(TransformDirty.World);
        }
      }
    }
  }

  // 更新本地矩阵
  updateLocalMatrix(): void {
    mat4.identity(this._localMatrix);
    mat4.translate(this._localMatrix, this._position, this._localMatrix);

    const rotationMatrix = mat4.fromQuat(this._rotation);
    mat4.multiply(this._localMatrix, rotationMatrix, this._localMatrix);

    mat4.scale(this._localMatrix, this._scale, this._localMatrix);

    this.clearDirty(TransformDirty.Local);
  }

  // 更新世界矩阵
  updateWorldMatrix(): void {
    if (this.isDirty(TransformDirty.Local)) {
      this.updateLocalMatrix();
    }

    const entity = this.entity;
    if (entity && entity.parent && entity.parent.transform) {
      // 如果有父实体，将本地矩阵与父实体的世界矩阵相乘
      mat4.multiply(
        entity.parent.transform.worldMatrix,
        this._localMatrix,
        this._worldMatrix,
      );

      // 更新世界位置
      vec3.transformMat4(
        this._position,
        entity.parent.transform.worldMatrix,
        this._worldPosition,
      );

      // 更新世界旋转
      quat.fromMat(this._worldMatrix, this._worldRotation);

      // 更新世界缩放
      mat4.getScaling(this._worldMatrix, this._worldScale);
    } else {
      // 没有父实体，世界矩阵等于本地矩阵
      mat4.copy(this._localMatrix, this._worldMatrix);
      vec3.copy(this._position, this._worldPosition);
      quat.copy(this._rotation, this._worldRotation);
      vec3.copy(this._scale, this._worldScale);
    }

    this.clearDirty(TransformDirty.World);
  }

  // 向前方向（Z轴负方向）
  getForward(space: TransformSpace = "world"): Vec3 {
    const forward = vec3.create(0, 0, -1);
    if (space === "local") {
      vec3.transformQuat(this.rotation, forward, forward);
    } else {
      // TODO: 世界空间
    }
    return forward;
  }

  // 向上方向（Y轴正方向）
  getUp(space: TransformSpace = "world"): Vec3 {
    const up = vec3.create(0, 1, 0);
    if (space === "local") {
      vec3.transformQuat(this.rotation, up, up);
    }
    return up;
  }

  // 向右方向（X轴正方向）
  getRight(space: TransformSpace = "world"): Vec3 {
    const right = vec3.create(1, 0, 0);
    if (space === "local") {
      vec3.transformQuat(this.rotation, right, right);
    }
    return right;
  }
}

export enum TransformDirty {
  Local = 1 << 0,
  World = 1 << 1,
  LocalAndWorld = Local | World,
}

export type TransformSpace = "local" | "world";
