import { describe, bench, beforeEach } from "vitest";
import { World } from "../../ecs/world";
import { Query } from "../../ecs/query";

// 定义测试用的组件
class Position {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
  ) {}
}

class Velocity {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
  ) {}
}

class Health {
  constructor(public value: number = 100) {}
}

// 传统方法：使用类和对象
class TraditionalEntity {
  id: number;
  position?: Position;
  velocity?: Velocity;
  health?: Health;

  constructor(id: number) {
    this.id = id;
  }
}

describe("ECS", () => {
  const ENTITY_COUNT = 10000;

  describe("Entity Creation", () => {
    bench("ECS - Create entities with components", () => {
      const world = new World();
      world.registerComponent(Position);
      world.registerComponent(Velocity);
      world.registerComponent(Health);

      for (let i = 0; i < ENTITY_COUNT; i++) {
        const entity = world.createEntity();
        world.addComponent(entity, new Position(i, i, i));
        world.addComponent(entity, new Velocity(1, 1, 1));
        world.addComponent(entity, new Health(100));
      }
    });

    bench("Traditional - Create objects with properties", () => {
      const entities: TraditionalEntity[] = [];

      for (let i = 0; i < ENTITY_COUNT; i++) {
        const entity = new TraditionalEntity(i);
        entity.position = new Position(i, i, i);
        entity.velocity = new Velocity(1, 1, 1);
        entity.health = new Health(100);
        entities.push(entity);
      }
    });
  });

  describe("Query and Update", () => {
    const ecsWorld: World = new World();

    ecsWorld.registerComponent(Position);
    ecsWorld.registerComponent(Velocity);
    ecsWorld.registerComponent(Health);

    for (let i = 0; i < ENTITY_COUNT; i++) {
      const entity = ecsWorld.createEntity();
      ecsWorld.addComponent(entity, new Position(i, i, i));
      ecsWorld.addComponent(entity, new Velocity(1, 2, 3));
      if (i % 10 === 0) {
        ecsWorld.addComponent(entity, new Health(100));
      }
    }

    const ecsQuery: Query<{ position: Position; velocity: Velocity }> = ecsWorld
      .createQuery()
      .with("position", Position)
      .with("velocity", Velocity)
      .without(Health)
      .build();

    const traditionalEntities: TraditionalEntity[] = [];

    for (let i = 0; i < ENTITY_COUNT; i++) {
      const entity = new TraditionalEntity(i);
      entity.position = new Position(i, i, i);
      entity.velocity = new Velocity(1, 2, 3);
      if (i % 10 === 0) {
        entity.health = new Health(100);
      }
      traditionalEntities.push(entity);
    }

    bench("ECS - Query and update with cached query", () => {
      for (const { components } of ecsQuery) {
        const position = components.position;
        const velocity = components.velocity;

        position.x += velocity.x;
        position.y += velocity.y;
        position.z += velocity.z;
      }
    });

    bench("Traditional - Update objects", () => {
      // 只测试更新位置的性能
      for (const entity of traditionalEntities) {
        if (entity.position && entity.velocity && !entity.health) {
          entity.position.x += entity.velocity.x;
          entity.position.y += entity.velocity.y;
          entity.position.z += entity.velocity.z;
        }
      }
    });
  });
});
