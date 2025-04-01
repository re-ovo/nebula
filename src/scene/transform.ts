import { Component } from "./component";
import { mat4, vec3, quat } from "wgpu-matrix";
import type { Mat4, Vec3, Quat } from "wgpu-matrix";

export class Transform extends Component {
  private _position: Vec3 = vec3.create(0, 0, 0);
  private _rotation: Quat = quat.identity();
  private _scale: Vec3 = vec3.create(1, 1, 1);
  private _localMatrix: Mat4 = mat4.identity();
  private _worldMatrix: Mat4 = mat4.identity();
  private _isDirty: boolean = true;

  // 位置
  get position(): Vec3 {
    return vec3.clone(this._position);
  }

  set position(value: Vec3) {
    vec3.copy(value, this._position);
    this._isDirty = true;
  }

  // 旋转（四元数）
  get rotation(): Quat {
    return quat.clone(this._rotation);
  }

  set rotation(value: Quat) {
    quat.copy(value, this._rotation);
    this._isDirty = true;
  }

  // 缩放
  get scale(): Vec3 {
    return vec3.clone(this._scale);
  }

  set scale(value: Vec3) {
    vec3.copy(value, this._scale);
    this._isDirty = true;
  }

  // 获取本地矩阵
  get localMatrix(): Mat4 {
    if (this._isDirty) {
      this.updateLocalMatrix();
    }
    return mat4.clone(this._localMatrix);
  }

  // 获取世界矩阵
  get worldMatrix(): Mat4 {
    if (this._isDirty) {
      this.updateWorldMatrix();
    }
    return mat4.clone(this._worldMatrix);
  }

  // 更新本地矩阵
  private updateLocalMatrix(): void {
    mat4.identity(this._localMatrix);
    mat4.translate(this._localMatrix, this._position, this._localMatrix);

    const rotationMatrix = mat4.fromQuat(this._rotation);
    mat4.multiply(this._localMatrix, rotationMatrix, this._localMatrix);

    mat4.scale(this._localMatrix, this._scale, this._localMatrix);

    this._isDirty = false;
  }

  // 更新世界矩阵
  private updateWorldMatrix(): void {
    if (this._isDirty) {
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
    } else {
      // 没有父实体，世界矩阵等于本地矩阵
      mat4.copy(this._localMatrix, this._worldMatrix);
    }
  }

  // 向前方向（Z轴负方向）
  get forward(): Vec3 {
    const worldMatrix = this.worldMatrix;
    return vec3.normalize(
      vec3.create(-worldMatrix[8], -worldMatrix[9], -worldMatrix[10]),
    );
  }

  // 向上方向（Y轴正方向）
  get up(): Vec3 {
    const worldMatrix = this.worldMatrix;
    return vec3.normalize(
      vec3.create(worldMatrix[4], worldMatrix[5], worldMatrix[6]),
    );
  }

  // 向右方向（X轴正方向）
  get right(): Vec3 {
    const worldMatrix = this.worldMatrix;
    return vec3.normalize(
      vec3.create(worldMatrix[0], worldMatrix[1], worldMatrix[2]),
    );
  }
}
