import { beforeEach, describe, expect, it } from "vitest";
import { ComponentManager, EntityManager, World } from "../ecs";

// 测试用的组件类
class PositionComponent {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
  ) {}
}

class VelocityComponent {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
  ) {}
}

class HealthComponent {
  constructor(
    public current: number = 100,
    public max: number = 100,
  ) {}
}

describe("ECS", () => {
  describe("EntityManager", () => {
    let entityManager: EntityManager;

    beforeEach(() => {
      entityManager = new EntityManager();
    });

    it("应该能创建实体", () => {
      const entity = entityManager.create();
      expect(entity).toBeGreaterThanOrEqual(0);
      expect(entityManager.isValid(entity)).toBe(true);
    });

    it("应该能销毁实体", () => {
      const entity = entityManager.create();
      entityManager.destroy(entity);
      expect(entityManager.isValid(entity)).toBe(false);
    });

    it("应该能重用被销毁的实体ID", () => {
      const entity1 = entityManager.create();
      entityManager.destroy(entity1);
      const entity2 = entityManager.create();
      expect(entity2).toBe(entity1);
    });
  });

  describe("ComponentManager", () => {
    let componentManager: ComponentManager;

    beforeEach(() => {
      componentManager = new ComponentManager();
    });

    it("应该能注册组件类型", () => {
      const typeId = componentManager.registerComponent(PositionComponent);
      expect(typeId).toBeGreaterThanOrEqual(0);
    });

    it("应该能获取已注册组件的类型ID", () => {
      const typeId1 = componentManager.registerComponent(PositionComponent);
      const typeId2 = componentManager.getComponentType(PositionComponent);
      expect(typeId2).toBe(typeId1);
    });

    it("应该为不同组件类型分配不同ID", () => {
      const typeId1 = componentManager.registerComponent(PositionComponent);
      const typeId2 = componentManager.registerComponent(VelocityComponent);
      expect(typeId2).not.toBe(typeId1);
    });

    it("应该能创建组件实例", () => {
      const typeId = componentManager.registerComponent(PositionComponent);
      const component = componentManager.createComponent<PositionComponent>(
        typeId,
        10,
        20,
        30,
      );
      expect(component).toBeInstanceOf(PositionComponent);
      expect(component.x).toBe(10);
      expect(component.y).toBe(20);
      expect(component.z).toBe(30);
    });
  });

  describe("World", () => {
    let world: World;

    beforeEach(() => {
      world = new World();
      world.registerComponent(PositionComponent);
      world.registerComponent(VelocityComponent);
      world.registerComponent(HealthComponent);
    });

    it("应该能创建实体", () => {
      const entity = world.createEntity();
      expect(entity).toBeGreaterThanOrEqual(0);
      expect(world.hasEntity(entity)).toBe(true);
    });

    it("应该能销毁实体", () => {
      const entity = world.createEntity();
      world.destroyEntity(entity);
      expect(world.hasEntity(entity)).toBe(false);
    });

    it("应该能为实体添加组件", () => {
      const entity = world.createEntity();
      const position = new PositionComponent(1, 2, 3);
      world.addComponent(entity, position);

      const retrievedPosition = world.getComponent(entity, PositionComponent);
      expect(retrievedPosition).not.toBeUndefined();
      expect(retrievedPosition).toEqual(position);
    });

    it("应该能移除实体的组件", () => {
      const entity = world.createEntity();
      world.addComponent(entity, new PositionComponent(1, 2, 3));
      world.removeComponent(entity, PositionComponent);

      const position = world.getComponent(entity, PositionComponent);
      expect(position).toBeUndefined();
    });

    it("应该能正确移动实体在Archetype之间", () => {
      const entity = world.createEntity();
      world.addComponent(entity, new PositionComponent(1, 2, 3));
      world.addComponent(entity, new VelocityComponent(0.5, 1, 0));

      expect(world.getComponent(entity, PositionComponent)).toEqual(
        new PositionComponent(1, 2, 3),
      );
      expect(world.getComponent(entity, VelocityComponent)).toEqual(
        new VelocityComponent(0.5, 1, 0),
      );
      const archetype = world.getEntityArchetype(entity);

      world.removeComponent(entity, VelocityComponent);
      expect(world.getComponent(entity, VelocityComponent)).toBeUndefined();

      const archetype2 = world.getEntityArchetype(entity);
      expect(archetype2).not.toBe(archetype);
    });
  });
});
