import { World } from "./world";

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

const world = new World();
const ENTITY_COUNT = 5;

world.registerComponent(Position);
world.registerComponent(Velocity);
world.registerComponent(Health);

for (let i = 0; i < ENTITY_COUNT; i++) {
  const entity = world.createEntity();
  world.addComponent(entity, new Position(i, i, i));
  world.addComponent(entity, new Velocity(1, 1, 1));
  if (i % 20 === 0) {
    world.addComponent(entity, new Health(100));
  }
}

const query = world
  .createQuery()
  .with(Position)
  .with(Velocity)
  .without(Health)
  .build();

console.log("query", query.count());
export function test() {
  query.forEach((entity, position, velocity) => {
    position.x += velocity.x;
    position.y += velocity.y;
    position.z += velocity.z;
    console.log(entity, position, velocity);
  });
}
