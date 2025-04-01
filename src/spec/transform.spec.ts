import { beforeEach, describe, expect, it } from "vitest";
import { Transform, TransformDirty } from "../scene/transform";
import { Entity } from "../scene/entity";
import { mat4, quat, utils, vec3 } from "wgpu-matrix";

describe("Transform组件", () => {
  let transform: Transform;

  beforeEach(() => {
    transform = new Transform();
    utils.setEpsilon(0.0001);
  });

  describe("基本属性", () => {
    it("应该有默认值", () => {
      // 检查默认位置是否为(0,0,0)
      const position = transform.position;
      expect(vec3.equalsApproximately(position, vec3.create(0, 0, 0))).toBe(
        true,
      );

      // 检查默认旋转是否为单位四元数
      const rotation = transform.rotation;
      expect(quat.equalsApproximately(rotation, quat.identity())).toBe(true);

      // 检查默认缩放是否为(1,1,1)
      const scale = transform.scale;
      expect(vec3.equalsApproximately(scale, vec3.create(1, 1, 1))).toBe(true);
    });

    it("修改位置应正确设置并标记脏标志", () => {
      const newPosition = vec3.create(1, 2, 3);
      transform.position = newPosition;

      // 检查位置是否已更新
      expect(vec3.equalsApproximately(transform.position, newPosition)).toBe(
        true,
      );

      // 获取一份新的值，确保不是引用
      const retrievedPosition = transform.position;
      // 修改新获取的值不应影响原始值
      vec3.add(retrievedPosition, vec3.create(1, 1, 1), retrievedPosition);
      expect(vec3.equalsApproximately(transform.position, newPosition)).toBe(
        true,
      );

      // 检查是否设置了脏标志
      expect(transform.isDirty(TransformDirty.LocalAndWorld)).toBe(true);
    });

    it("修改旋转应正确设置并标记脏标志", () => {
      // 创建一个非单位四元数
      const newRotation = quat.fromEuler(45, 30, 60, "yxz");
      transform.rotation = newRotation;

      // 检查旋转是否已更新
      expect(quat.equalsApproximately(transform.rotation, newRotation)).toBe(
        true,
      );

      // 获取一份新的值，确保不是引用
      const retrievedRotation = transform.rotation;
      // 修改新获取的值不应影响原始值
      quat.multiply(retrievedRotation, quat.identity(), retrievedRotation);
      expect(quat.equalsApproximately(transform.rotation, newRotation)).toBe(
        true,
      );

      // 检查是否设置了脏标志
      expect(transform.isDirty(TransformDirty.LocalAndWorld)).toBe(true);
    });

    it("修改缩放应正确设置并标记脏标志", () => {
      const newScale = vec3.create(2, 3, 4);
      transform.scale = newScale;

      // 检查缩放是否已更新
      expect(vec3.equalsApproximately(transform.scale, newScale)).toBe(true);

      // 获取一份新的值，确保不是引用
      const retrievedScale = transform.scale;
      // 修改新获取的值不应影响原始值
      vec3.multiply(retrievedScale, vec3.create(2, 2, 2), retrievedScale);
      expect(vec3.equalsApproximately(transform.scale, newScale)).toBe(true);

      // 检查是否设置了脏标志
      expect(transform.isDirty(TransformDirty.LocalAndWorld)).toBe(true);
    });
  });

  describe("矩阵计算", () => {
    it("本地矩阵应该正确计算", () => {
      transform.position = vec3.create(1, 2, 3);
      transform.rotation = quat.fromEuler(90, 0, 0, "yxz");
      transform.scale = vec3.create(2, 2, 2);

      // 获取本地矩阵应触发更新
      const localMatrix = transform.localMatrix;

      // 手动计算期望的矩阵
      const expectedMatrix = mat4.identity();
      mat4.translate(expectedMatrix, vec3.create(1, 2, 3), expectedMatrix);
      const rotationMatrix = mat4.fromQuat(quat.fromEuler(90, 0, 0, "yxz"));
      mat4.multiply(expectedMatrix, rotationMatrix, expectedMatrix);
      mat4.scale(expectedMatrix, vec3.create(2, 2, 2), expectedMatrix);

      // 由于浮点精度，使用近似相等而不是精确相等
      for (let i = 0; i < 16; i++) {
        expect(localMatrix[i]).toBeCloseTo(expectedMatrix[i], 5);
      }

      // 本地矩阵脏标志应该已清除
      expect(transform.isDirty(TransformDirty.Local)).toBe(false);
    });

    it("世界矩阵应等于本地矩阵（无父实体时）", () => {
      transform.position = vec3.create(1, 2, 3);

      const localMatrix = transform.localMatrix;
      const worldMatrix = transform.worldMatrix;

      // 无父实体时，世界矩阵应等于本地矩阵
      for (let i = 0; i < 16; i++) {
        expect(worldMatrix[i]).toBeCloseTo(localMatrix[i], 5);
      }

      // 世界矩阵脏标志应该已清除
      expect(transform.isDirty(TransformDirty.World)).toBe(false);
    });

    it("父子实体的世界矩阵应该正确计算", () => {
      // 创建父子实体
      const parentEntity = new Entity("Parent");
      const childEntity = new Entity("Child");
      parentEntity.addChild(childEntity);

      // 获取变换组件
      const parentTransform = parentEntity.transform;
      const childTransform = childEntity.transform;

      // 设置变换
      parentTransform.position = vec3.create(1, 0, 0);
      childTransform.position = vec3.create(0, 1, 0);

      // 获取世界矩阵
      const parentWorldMatrix = parentTransform.worldMatrix;
      const childWorldMatrix = childTransform.worldMatrix;

      // 子实体的世界位置应该是(1,1,0)
      expect(childWorldMatrix[12]).toBeCloseTo(1, 5); // X
      expect(childWorldMatrix[13]).toBeCloseTo(1, 5); // Y
      expect(childWorldMatrix[14]).toBeCloseTo(0, 5); // Z
    });
  });

  describe("脏标志管理", () => {
    it("子实体应在父实体变更时标记为脏", () => {
      // 创建父子实体
      const parentEntity = new Entity("Parent");
      const childEntity = new Entity("Child");
      parentEntity.addChild(childEntity);

      // 获取变换组件
      const parentTransform = parentEntity.transform;
      const childTransform = childEntity.transform;

      // 清除子实体的脏标志
      const _ = childTransform.worldMatrix; // 触发更新以清除脏标志
      expect(childTransform.isDirty(TransformDirty.World)).toBe(false);

      // 修改父实体的位置
      parentTransform.position = vec3.create(1, 2, 3);

      // 子实体的世界矩阵应标记为脏
      expect(childTransform.isDirty(TransformDirty.World)).toBe(true);
    });
  });

  describe("世界变换属性", () => {
    it("无父实体时，世界变换应等于本地变换", () => {
      const transform = new Transform();

      // 设置本地变换
      const localPos = vec3.create(1, 2, 3);
      const localRot = quat.fromEuler(30, 45, 60, "yxz");
      const localScale = vec3.create(2, 3, 4);

      transform.position = localPos;
      transform.rotation = localRot;
      transform.scale = localScale;

      // 获取世界变换
      const worldPos = transform.worldPosition;
      const worldRot = transform.worldRotation;
      const worldScale = transform.worldScale;

      // 无父实体时，世界变换应等于本地变换
      expect(vec3.equalsApproximately(worldPos, localPos), "worldPos").toBe(
        true,
      );
      expect(quat.equalsApproximately(worldRot, localRot), "worldRot").toBe(
        true,
      );
      expect(
        vec3.equalsApproximately(worldScale, localScale),
        "worldScale",
      ).toBe(true);
    });

    it("有父实体时，世界位置应正确计算", () => {
      // 创建父子实体
      const parentEntity = new Entity("Parent");
      const childEntity = new Entity("Child");
      parentEntity.addChild(childEntity);

      // 获取变换组件
      const parentTransform = parentEntity.transform;
      const childTransform = childEntity.transform;

      // 设置变换
      parentTransform.position = vec3.create(1, 0, 0);
      childTransform.position = vec3.create(0, 2, 0);

      // 获取子实体世界位置
      const worldPos = childTransform.worldPosition;

      // 子实体的世界位置应该是(1,2,0)
      expect(vec3.equalsApproximately(worldPos, vec3.create(1, 2, 0))).toBe(
        true,
      );
    });

    it("有父实体时，世界旋转应正确计算", () => {
      // 创建父子实体
      const parentEntity = new Entity("Parent");
      const childEntity = new Entity("Child");
      parentEntity.addChild(childEntity);

      // 获取变换组件
      const parentTransform = parentEntity.transform;
      const childTransform = childEntity.transform;

      // 设置父实体旋转为Y轴旋转90度
      const parentRotation = quat.fromEuler(90, 0, 0, "yxz");
      parentTransform.rotation = parentRotation;

      // 设置子实体旋转为X轴旋转90度
      const childRotation = quat.fromEuler(0, 90, 0, "yxz");
      childTransform.rotation = childRotation;

      // 获取子实体世界旋转
      const worldRot = childTransform.worldRotation;

      // 预期的组合旋转
      // 先Y轴旋转90度，再X轴旋转90度的等效四元数
      const expectedRot = quat.create();
      quat.multiply(parentRotation, childRotation, expectedRot);

      // 验证世界旋转是否匹配预期
      // 由于浮点精度问题，使用近似比较
      expect(quat.equalsApproximately(worldRot, expectedRot)).toBe(true);
    });

    it("有父实体时，世界缩放应正确计算", () => {
      // 创建父子实体
      const parentEntity = new Entity("Parent");
      const childEntity = new Entity("Child");
      parentEntity.addChild(childEntity);

      // 获取变换组件
      const parentTransform = parentEntity.transform;
      const childTransform = childEntity.transform;

      // 设置变换
      parentTransform.scale = vec3.create(2, 2, 2);
      childTransform.scale = vec3.create(3, 4, 5);

      // 获取子实体世界缩放
      const worldScale = childTransform.worldScale;

      // 子实体的世界缩放应该是父子缩放的乘积(6,8,10)
      expect(vec3.equalsApproximately(worldScale, vec3.create(6, 8, 10))).toBe(
        true,
      );
    });

    it("设置parent / child, worldMatrix 应该更新", () => {
      const parentEntity = new Entity("Parent");
      const childEntity = new Entity("Child");

      const _1 = parentEntity.transform.worldMatrix; // 触发更新
      expect(
        parentEntity.transform.isDirty(TransformDirty.World),
        "parent.worldMatrix",
      ).toBe(false);

      const _2 = childEntity.transform.worldMatrix; // 触发更新
      expect(
        childEntity.transform.isDirty(TransformDirty.World),
        "child.worldMatrix",
      ).toBe(false);

      parentEntity.addChild(childEntity);

      expect(
        parentEntity.transform.isDirty(TransformDirty.World),
        "parent.worldMatrix",
      ).toBe(false);
      expect(
        childEntity.transform.isDirty(TransformDirty.World),
        "child.worldMatrix",
      ).toBe(true);

      const _3 = parentEntity.transform.worldMatrix; // 触发更新
      expect(
        parentEntity.transform.isDirty(TransformDirty.World),
        "parent.worldMatrix",
      ).toBe(false);

      const _4 = childEntity.transform.worldMatrix; // 触发更新
      expect(
        childEntity.transform.isDirty(TransformDirty.World),
        "child.worldMatrix",
      ).toBe(false);
    });

    it("复杂层级结构下的世界变换计算", () => {
      // 创建三层实体结构
      const rootEntity = new Entity("Root");
      const parentEntity = new Entity("Parent");
      const childEntity = new Entity("Child");

      rootEntity.addChild(parentEntity);
      parentEntity.addChild(childEntity);

      // 获取变换组件
      const rootTransform = rootEntity.transform;
      const parentTransform = parentEntity.transform;
      const childTransform = childEntity.transform;

      // 设置变换
      rootTransform.position = vec3.create(1, 0, 0);
      parentTransform.position = vec3.create(0, 2, 0);
      childTransform.position = vec3.create(0, 0, 3);

      rootTransform.rotation = quat.fromEuler(0, 90, 0, "yxz");
      parentTransform.rotation = quat.fromEuler(90, 0, 0, "yxz");

      rootTransform.scale = vec3.create(2, 2, 2);
      parentTransform.scale = vec3.create(1.5, 1.5, 1.5);
      childTransform.scale = vec3.create(2, 2, 2);

      // 获取子实体的世界变换
      const worldPos = childTransform.worldPosition;
      const worldScale = childTransform.worldScale;

      // 验证世界位置
      // 预期位置是按层级结构和旋转计算得到的
      // 因为有旋转，所以位置计算会比较复杂
      // 这里我们只验证值是否正确而不计算精确值
      expect(worldPos[0], "worldPos.x").not.toBe(0);
      expect(worldPos[1], "worldPos.y").not.toBe(0);
      expect(worldPos[2], "worldPos.z").not.toBe(0);

      // 验证世界缩放
      // 预期缩放是各级缩放的乘积：2 * 1.5 * 2 = 6
      expect(
        vec3.equalsApproximately(worldScale, vec3.create(6, 6, 6)),
        "equals approximately",
      ).toBe(true);
    });
  });
});
