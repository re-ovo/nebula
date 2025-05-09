import { describe, it, expect, beforeEach } from "vitest";
import { Scene } from "../scene/scene";
import { Entity } from "../scene/entity";
import { Transform } from "../scene/transform";
import { Component } from "../scene/component";

// 创建一个测试用组件
class TestComponent extends Component {
  testValue: number = 0;
  enableCalled: boolean = false;
  disableCalled: boolean = false;
  destroyCalled: boolean = false;
  updateCalled: boolean = false;

  constructor() {
    super();
  }

  onEnable(): void {
    this.enableCalled = true;
  }

  onDisable(): void {
    this.disableCalled = true;
  }

  onDestroy(): void {
    this.destroyCalled = true;
  }

  update(deltaTime: number): void {
    this.updateCalled = true;
    this.testValue += deltaTime;
  }
}

describe("Scene系统", () => {
  let scene: Scene;

  beforeEach(() => {
    scene = new Scene("TestScene");
  });

  describe("场景基本功能", () => {
    it("应该正确创建场景", () => {
      expect(scene.name).toBe("TestScene");
      expect(scene.active).toBe(true);
      expect(scene.entities.length).toBe(0);
      expect(scene.rootEntities.length).toBe(0);
    });

    it("应该能够修改场景名称", () => {
      scene.name = "NewSceneName";
      expect(scene.name).toBe("NewSceneName");
    });

    it("应该能够修改场景激活状态", () => {
      scene.active = false;
      expect(scene.active).toBe(false);
    });
  });

  describe("实体管理", () => {
    it("应该能够创建和添加实体", () => {
      const entity = scene.createEntity("TestEntity");
      expect(entity.name).toBe("TestEntity");
      expect(scene.entities.length).toBe(1);
      expect(scene.rootEntities.length).toBe(1);
      expect(scene.entities[0]).toBe(entity);
      expect(scene.rootEntities[0]).toBe(entity);
    });

    it("应该能够添加现有实体", () => {
      const entity = new Entity("ExistingEntity");
      scene.addEntity(entity);
      expect(scene.entities.length).toBe(1);
      expect(scene.rootEntities.length).toBe(1);
      expect(scene.entities[0]).toBe(entity);
    });

    it("应该能够移除实体", () => {
      const entity = scene.createEntity("ToBeRemoved");
      expect(scene.entities.length).toBe(1);

      const result = scene.removeEntity(entity);
      expect(result).toBe(true);
      expect(scene.entities.length).toBe(0);
      expect(scene.rootEntities.length).toBe(0);
    });

    it("移除不存在的实体应返回false", () => {
      const entity = new Entity("NonExistentEntity");
      const result = scene.removeEntity(entity);
      expect(result).toBe(false);
    });

    it("应该能够通过名称查找实体", () => {
      const entity1 = scene.createEntity("Entity1");
      const entity2 = scene.createEntity("Entity2");

      const found = scene.findEntityByName("Entity1");
      expect(found).toBe(entity1);

      const notFound = scene.findEntityByName("NonExistent");
      expect(notFound).toBeNull();
    });
  });

  describe("实体层级", () => {
    it("应该正确处理父子关系", () => {
      const parent = scene.createEntity("Parent");
      const child = scene.createEntity("Child");

      // 添加子实体
      parent.addChild(child);

      // 检查关系是否正确
      expect(child.parent).toBe(parent);
      expect(parent.children.length).toBe(1);
      expect(parent.children[0]).toBe(child);

      // 子实体不应该是根实体
      expect(scene.rootEntities.length).toBe(1);
      expect(scene.rootEntities[0]).toBe(parent);

      // 总实体数应该是2
      expect(scene.entities.length).toBe(2);
    });

    it("应该正确处理移除子实体", () => {
      const parent = scene.createEntity("Parent");
      const child = scene.createEntity("Child");

      parent.addChild(child);
      expect(parent.children.length).toBe(1);

      parent.removeChild(child);
      expect(parent.children.length).toBe(0);
      expect(child.parent).toBeNull();

      // 子实体变为根实体
      expect(scene.rootEntities.length).toBe(2);
    });

    it("移除父实体时应级联移除所有子实体", () => {
      const parent = scene.createEntity("Parent");
      const child1 = scene.createEntity("Child1");
      const child2 = scene.createEntity("Child2");

      parent.addChild(child1);
      parent.addChild(child2);

      expect(scene.entities.length).toBe(3);
      expect(scene.rootEntities.length).toBe(1);

      scene.removeEntity(parent);

      // 所有实体应该被移除
      expect(scene.entities.length).toBe(0);
      expect(scene.rootEntities.length).toBe(0);
    });
  });

  describe("组件系统", () => {
    it("实体应该默认有Transform组件", () => {
      const entity = scene.createEntity();
      const transform = entity.getComponent(Transform);
      expect(transform).not.toBeNull();
    });

    it("应该能够添加组件", () => {
      const entity = scene.createEntity();
      const component = entity.addComponent(TestComponent);

      expect(component).toBeInstanceOf(TestComponent);
      expect(entity.getComponent(TestComponent)).toBe(component);
    });

    it("应该能够移除组件", () => {
      const entity = scene.createEntity();
      const component = entity.addComponent(TestComponent);

      const result = entity.removeComponent(TestComponent);
      expect(result).toBe(true);
      expect(entity.getComponent(TestComponent)).toBeNull();

      // 验证onDestroy被调用
      expect(component.destroyCalled).toBe(true);
    });

    it("不能移除Transform组件", () => {
      const entity = scene.createEntity();
      const transformBefore = entity.getComponent(Transform);

      const result = entity.removeComponent(Transform);
      expect(result).toBe(false);

      const transformAfter = entity.getComponent(Transform);
      expect(transformAfter).toBe(transformBefore);
    });
  });

  describe("生命周期", () => {
    it("设置实体激活状态时应调用组件的生命周期方法", () => {
      const entity = scene.createEntity();
      const component = entity.addComponent(TestComponent);

      // 重置标记
      component.enableCalled = false;
      component.disableCalled = false;

      entity.active = false;
      expect(component.disableCalled).toBe(true);
      expect(component.enabled).toBe(false);

      entity.active = true;
      expect(component.enableCalled).toBe(true);
      expect(component.enabled).toBe(true);
    });

    it("设置场景激活状态应影响所有根实体", () => {
      const entity1 = scene.createEntity("Entity1");
      const entity2 = scene.createEntity("Entity2");

      scene.active = false;
      expect(entity1.active).toBe(false);
      expect(entity2.active).toBe(false);

      scene.active = true;
      expect(entity1.active).toBe(true);
      expect(entity2.active).toBe(true);
    });

    it("父实体状态应影响子实体状态", () => {
      const parent = scene.createEntity("Parent");
      const child = scene.createEntity("Child");

      parent.addChild(child);
      expect(child.active).toBe(true);

      parent.active = false;
      expect(child.active).toBe(false);

      parent.active = true;
      expect(child.active).toBe(true);
    });
  });

  describe("更新机制", () => {
    it("应正确更新所有活跃实体和组件", () => {
      const entity1 = scene.createEntity("Entity1");
      const entity2 = scene.createEntity("Entity2");

      const comp1 = entity1.addComponent(TestComponent);
      const comp2 = entity2.addComponent(TestComponent);

      scene.update(1.0);

      expect(comp1.updateCalled).toBe(true);
      expect(comp1.testValue).toBe(1.0);
      expect(comp2.updateCalled).toBe(true);
      expect(comp2.testValue).toBe(1.0);
    });

    it("非活跃实体不应该被更新", () => {
      const entity = scene.createEntity();
      const component = entity.addComponent(TestComponent);

      entity.active = false;
      scene.update(1.0);

      expect(component.updateCalled).toBe(false);
      expect(component.testValue).toBe(0);
    });

    it("非活跃场景下不应更新任何实体", () => {
      const entity = scene.createEntity();
      const component = entity.addComponent(TestComponent);

      scene.active = false;
      scene.update(1.0);

      expect(component.updateCalled).toBe(false);
    });

    it("应正确递归更新子实体", () => {
      const parent = scene.createEntity("Parent");
      const child = scene.createEntity("Child");
      parent.addChild(child);

      const parentComp = parent.addComponent(TestComponent);
      const childComp = child.addComponent(TestComponent);

      scene.update(0.5);

      expect(parentComp.updateCalled).toBe(true);
      expect(childComp.updateCalled).toBe(true);
      expect(parentComp.testValue).toBe(0.5);
      expect(childComp.testValue).toBe(0.5);
    });
  });

  describe("销毁机制", () => {
    it("销毁场景时应销毁所有实体", () => {
      const entity1 = scene.createEntity();
      const entity2 = scene.createEntity();
      const comp1 = entity1.addComponent(TestComponent);
      const comp2 = entity2.addComponent(TestComponent);

      scene.destroy();

      expect(scene.entities.length).toBe(0);
      expect(scene.rootEntities.length).toBe(0);
      expect(comp1.destroyCalled).toBe(true);
      expect(comp2.destroyCalled).toBe(true);
    });

    it("销毁实体时应销毁其组件", () => {
      const entity = scene.createEntity();
      const component = entity.addComponent(TestComponent);

      entity.destroy();

      expect(scene.entities.length).toBe(0);
      expect(component.destroyCalled).toBe(true);
    });

    it("销毁实体时应级联销毁子实体", () => {
      const parent = scene.createEntity("Parent");
      const child = scene.createEntity("Child");
      parent.addChild(child);

      const childComp = child.addComponent(TestComponent);

      parent.destroy();

      expect(scene.entities.length).toBe(0);
      expect(scene.rootEntities.length).toBe(0);
      expect(childComp.destroyCalled).toBe(true);
    });
  });
});
