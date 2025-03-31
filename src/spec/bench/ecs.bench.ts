import { describe, bench, beforeEach } from "vitest";
import { World } from "../../ecs/world";
import { Query } from "../../ecs/query";
import * as uecs from "uecs";

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
  const ENTITY_COUNT = 50000;

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
      if (i % 3 === 0) {
        ecsWorld.addComponent(entity, new Position(i, i, i));
        ecsWorld.addComponent(entity, new Velocity(1, 2, 3));
      } else if (i % 3 === 1) {
        ecsWorld.addComponent(entity, new Position(i, i, i));
        ecsWorld.addComponent(entity, new Velocity(1, 2, 3));
        ecsWorld.addComponent(entity, new Health(100));
      } else {
        ecsWorld.addComponent(entity, new Health(100));
      }
    }

    const ecsQuery = ecsWorld
      .createQuery()
      .with(Position)
      .with(Velocity)
      .without(Health)
      .build();

    const traditionalEntities: TraditionalEntity[] = [];

    for (let i = 0; i < ENTITY_COUNT; i++) {
      const entity = new TraditionalEntity(i);
      if (i % 3 === 0) {
        entity.position = new Position(i, i, i);
        entity.velocity = new Velocity(1, 2, 3);
      } else if (i % 3 === 1) {
        entity.position = new Position(i, i, i);
        entity.velocity = new Velocity(1, 2, 3);
        entity.health = new Health(100);
      } else {
        entity.health = new Health(100);
      }
      traditionalEntities.push(entity);
    }

    const uecsWorld = new uecs.World();
    for (let i = 0; i < ENTITY_COUNT; i++) {
      if (i % 3 === 0) {
        uecsWorld.create(new Position(0, 0, 0), new Velocity(1, 2, 3));
      } else if (i % 3 === 1) {
        uecsWorld.create(
          new Position(0, 0, 0),
          new Velocity(1, 2, 3),
          new Health(100),
        );
      } else {
        uecsWorld.create(new Health(100));
      }
    }
    const uecsView = uecsWorld.view(Position, Velocity);

    bench("ECS - Query and update with cached query", () => {
      ecsQuery.forEach((entity, position, velocity) => {
        position.x += velocity.x;
        position.y += velocity.y;
        position.z += velocity.z;
      });
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

    bench("uecs - update objects", () => {
      uecsView.each((entity, position, velocity) => {
        position.x += velocity.x;
        position.y += velocity.y;
        position.z += velocity.z;
      });
    });
  });
});
