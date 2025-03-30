# ECS (Entity-Component-System)

## 简介

ECS（实体-组件-系统）是一种架构模式，用于组织游戏或实时应用程序中的代码。这种架构将数据（组件）与逻辑（系统）分离，并通过实体将它们联系起来。本模块实现了一个完整的ECS框架，用于管理游戏或应用程序中的实体、组件和系统。

## 核心概念

- **实体 (Entity)**: 游戏中的一个对象，由一个唯一ID表示。实体本身没有数据或行为，它只是一个ID。
- **组件 (Component)**: 包含数据的纯数据结构，附加在实体上。
- **系统 (System)**: 包含逻辑的函数，处理具有特定组件组合的实体。
- **世界 (World)**: 管理所有实体、组件和系统的容器。
- **原型 (Archetype)**: 具有相同组件结构的实体集合。
- **查询 (Query)**: 根据组件组合查找实体的方法。

## 文件结构

### 1. entity.ts

管理实体的创建、销毁和有效性检查。

```typescript
import { EntityManager } from '@/ecs';

// 创建实体管理器
const entityManager = new EntityManager();

// 创建新实体
const entity = entityManager.create();

// 检查实体是否有效
const isValid = entityManager.isValid(entity);

// 销毁实体
entityManager.destroy(entity);
```

### 2. component.ts

处理组件类型的注册和管理。

```typescript
import { ComponentManager, ComponentConstructor } from '@/ecs';

// 定义组件
class Position {
  x: number = 0;
  y: number = 0;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }
}

// 创建组件管理器
const componentManager = new ComponentManager();

// 注册组件类型
const positionType = componentManager.registerComponent(Position);

// 获取组件类型ID
const typeId = componentManager.getComponentType(Position);

// 创建组件实例
const position = componentManager.createComponent(typeId, 10, 20);
```

### 3. archetype.ts

管理具有相同组件结构的实体集合。原型是ECS性能优化的关键部分，允许高效地组织和访问共享相同组件的实体。

```typescript
import { Archetype, ComponentTypeId } from '@/ecs';

// 创建一个包含特定组件类型的原型
const componentTypeIds: ComponentTypeId[] = [0, 1, 2]; // 假设已注册的组件类型ID
const archetype = new Archetype(componentTypeIds);

// 检查原型是否包含特定实体
const hasEntity = archetype.hasEntity(entityId);

// 检查原型是否包含特定组件类型
const hasComponent = archetype.hasComponent(componentTypeId);

// 获取组件数量
const count = archetype.getComponentCount();
```

### 4. world.ts

ECS的核心类，管理实体、组件、系统和它们之间的交互。

```typescript
import { World } from '@/ecs';

// 创建ECS世界
const world = new World();

// 注册组件类型
class Position { x: number = 0; y: number = 0; }
class Velocity { vx: number = 0; vy: number = 0; }

const positionType = world.registerComponent(Position);
const velocityType = world.registerComponent(Velocity);

// 创建实体并添加组件
const entity = world.createEntity();
world.addComponent(entity, new Position(10, 20));
world.addComponent(entity, new Velocity(1, 2));

// 获取组件
const position = world.getComponent(entity, Position);

// 销毁实体
world.destroyEntity(entity);

// 注册系统
const movementSystem = (world: World, deltaTime: number) => {
  const query = world.createQuery()
    .with('position', Position)
    .with('velocity', Velocity)
    .build();

  for (const { entity, components } of query) {
    const { position, velocity } = components;
    position.x += velocity.vx * deltaTime;
    position.y += velocity.vy * deltaTime;
  }
};

world.registerSystem(movementSystem);

// 更新世界
world.update(1/60); // 传入时间增量
```

### 5. system.ts

定义系统的类型，系统是处理实体和组件的主要逻辑单元。

```typescript
import { World, System } from '@/ecs';

// 定义一个系统
const renderSystem: System = (world: World, deltaTime: number) => {
  // 系统逻辑
  // ...
};

// 在世界中注册系统
world.registerSystem(renderSystem);
```

### 6. query.ts

提供一种类型安全的方式来查询具有特定组件组合的实体。

```typescript
import { World } from '@/ecs';

// 假设我们有以下组件类型
class Position { x: number = 0; y: number = 0; }
class Renderable { color: string = 'white'; }

// 创建查询
const query = world.createQuery()
  .with('position', Position)
  .with('renderable', Renderable)
  .build();

// 迭代查询结果
for (const { entity, components } of query) {
  const { position, renderable } = components;
  console.log(`Entity ${entity} at (${position.x}, ${position.y}) with color ${renderable.color}`);
}

// 获取查询结果数组
const entities = query.getEntities();

// 获取结果数量
const count = query.count();

// 获取第一个结果
const first = query.first();

// 刷新查询（当世界状态发生重大变化后）
query.refresh();
```

## 性能考量

ECS架构的关键优势之一是性能。通过将相同结构的实体组织在一起（Archetype），ECS可以优化内存访问模式，减少缓存未命中，并支持面向数据的设计。

## 示例用法

下面是一个完整的示例，演示如何使用ECS构建一个简单的粒子系统：

```typescript
import { World } from '@/ecs';

// 定义组件
class Position {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}
}

class Velocity {
  constructor(public vx: number = 0, public vy: number = 0, public vz: number = 0) {}
}

class Particle {
  constructor(public lifetime: number = 1, public size: number = 1) {}
}

// 创建世界
const world = new World();

// 注册组件
world.registerComponent(Position);
world.registerComponent(Velocity);
world.registerComponent(Particle);

// 创建粒子系统
function createParticle(x: number, y: number, z: number) {
  const entity = world.createEntity();
  world.addComponent(entity, new Position(x, y, z));
  world.addComponent(entity, new Velocity(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  ));
  world.addComponent(entity, new Particle(
    Math.random() * 2 + 1,
    Math.random() * 0.5 + 0.5
  ));
  return entity;
}

// 创建一些粒子
for (let i = 0; i < 1000; i++) {
  createParticle(0, 0, 0);
}

// 定义系统
// 移动系统
const moveSystem = (world: World, deltaTime: number) => {
  const query = world.createQuery()
    .with('position', Position)
    .with('velocity', Velocity)
    .build();

  for (const { components } of query) {
    const { position, velocity } = components;
    position.x += velocity.vx * deltaTime;
    position.y += velocity.vy * deltaTime;
    position.z += velocity.vz * deltaTime;
  }
};

// 生命周期系统
const lifetimeSystem = (world: World, deltaTime: number) => {
  const query = world.createQuery()
    .with('particle', Particle)
    .build();

  for (const { entity, components } of query) {
    const { particle } = components;
    particle.lifetime -= deltaTime;

    // 当粒子生命结束时销毁它
    if (particle.lifetime <= 0) {
      world.destroyEntity(entity);
    }
  }
};

// 注册系统
world.registerSystem(moveSystem);
world.registerSystem(lifetimeSystem);

// 游戏循环
function gameLoop(time: number) {
  const deltaTime = time / 1000;
  world.update(deltaTime);
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

# ECS (Entity-Component-System) - English

## Introduction

ECS (Entity-Component-System) is an architectural pattern used to organize code in games or real-time applications. This architecture separates data (components) from logic (systems) and connects them through entities. This module implements a complete ECS framework for managing entities, components, and systems in games or applications.

## Core Concepts

- **Entity**: An object in the game, represented by a unique ID. Entities themselves have no data or behavior; they are just IDs.
- **Component**: Pure data structures that contain data and are attached to entities.
- **System**: Functions containing logic that process entities with specific component combinations.
- **World**: A container that manages all entities, components, and systems.
- **Archetype**: A collection of entities that share the same component structure.
- **Query**: A method to find entities based on component combinations.

## File Structure

### 1. entity.ts

Manages entity creation, destruction, and validity checking.

```typescript
import { EntityManager } from '@/ecs';

// Create entity manager
const entityManager = new EntityManager();

// Create a new entity
const entity = entityManager.create();

// Check if entity is valid
const isValid = entityManager.isValid(entity);

// Destroy entity
entityManager.destroy(entity);
```

### 2. component.ts

Handles registration and management of component types.

```typescript
import { ComponentManager, ComponentConstructor } from '@/ecs';

// Define a component
class Position {
  x: number = 0;
  y: number = 0;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }
}

// Create component manager
const componentManager = new ComponentManager();

// Register component type
const positionType = componentManager.registerComponent(Position);

// Get component type ID
const typeId = componentManager.getComponentType(Position);

// Create component instance
const position = componentManager.createComponent(typeId, 10, 20);
```

### 3. archetype.ts

Manages collections of entities with the same component structure. Archetypes are a key part of ECS performance optimization, allowing efficient organization and access to entities that share the same components.

```typescript
import { Archetype, ComponentTypeId } from '@/ecs';

// Create an archetype with specific component types
const componentTypeIds: ComponentTypeId[] = [0, 1, 2]; // Assuming registered component type IDs
const archetype = new Archetype(componentTypeIds);

// Check if archetype contains specific entity
const hasEntity = archetype.hasEntity(entityId);

// Check if archetype contains specific component type
const hasComponent = archetype.hasComponent(componentTypeId);

// Get component count
const count = archetype.getComponentCount();
```

### 4. world.ts

The core class of the ECS, managing entities, components, systems, and their interactions.

```typescript
import { World } from '@/ecs';

// Create ECS world
const world = new World();

// Register component types
class Position { x: number = 0; y: number = 0; }
class Velocity { vx: number = 0; vy: number = 0; }

const positionType = world.registerComponent(Position);
const velocityType = world.registerComponent(Velocity);

// Create entity and add components
const entity = world.createEntity();
world.addComponent(entity, new Position(10, 20));
world.addComponent(entity, new Velocity(1, 2));

// Get component
const position = world.getComponent(entity, Position);

// Destroy entity
world.destroyEntity(entity);

// Register system
const movementSystem = (world: World, deltaTime: number) => {
  const query = world.createQuery()
    .with('position', Position)
    .with('velocity', Velocity)
    .build();

  for (const { entity, components } of query) {
    const { position, velocity } = components;
    position.x += velocity.vx * deltaTime;
    position.y += velocity.vy * deltaTime;
  }
};

world.registerSystem(movementSystem);

// Update world
world.update(1/60); // Pass time delta
```

### 5. system.ts

Defines the type for systems, which are the main units of logic that process entities and components.

```typescript
import { World, System } from '@/ecs';

// Define a system
const renderSystem: System = (world: World, deltaTime: number) => {
  // System logic
  // ...
};

// Register system in world
world.registerSystem(renderSystem);
```

### 6. query.ts

Provides a type-safe way to query for entities with specific component combinations.

```typescript
import { World } from '@/ecs';

// Assume we have the following component types
class Position { x: number = 0; y: number = 0; }
class Renderable { color: string = 'white'; }

// Create query
const query = world.createQuery()
  .with('position', Position)
  .with('renderable', Renderable)
  .build();

// Iterate query results
for (const { entity, components } of query) {
  const { position, renderable } = components;
  console.log(`Entity ${entity} at (${position.x}, ${position.y}) with color ${renderable.color}`);
}

// Get query results as array
const entities = query.getEntities();

// Get result count
const count = query.count();

// Get first result
const first = query.first();

// Refresh query (after major world state changes)
query.refresh();
```

## Performance Considerations

One of the key advantages of the ECS architecture is performance. By organizing entities with the same structure together (Archetypes), ECS can optimize memory access patterns, reduce cache misses, and support data-oriented design.

## Example Usage

Here's a complete example demonstrating how to use the ECS to build a simple particle system:

```typescript
import { World } from '@/ecs';

// Define components
class Position {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}
}

class Velocity {
  constructor(public vx: number = 0, public vy: number = 0, public vz: number = 0) {}
}

class Particle {
  constructor(public lifetime: number = 1, public size: number = 1) {}
}

// Create world
const world = new World();

// Register components
world.registerComponent(Position);
world.registerComponent(Velocity);
world.registerComponent(Particle);

// Create particle system
function createParticle(x: number, y: number, z: number) {
  const entity = world.createEntity();
  world.addComponent(entity, new Position(x, y, z));
  world.addComponent(entity, new Velocity(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  ));
  world.addComponent(entity, new Particle(
    Math.random() * 2 + 1,
    Math.random() * 0.5 + 0.5
  ));
  return entity;
}

// Create some particles
for (let i = 0; i < 1000; i++) {
  createParticle(0, 0, 0);
}

// Define systems
// Movement system
const moveSystem = (world: World, deltaTime: number) => {
  const query = world.createQuery()
    .with('position', Position)
    .with('velocity', Velocity)
    .build();

  for (const { components } of query) {
    const { position, velocity } = components;
    position.x += velocity.vx * deltaTime;
    position.y += velocity.vy * deltaTime;
    position.z += velocity.vz * deltaTime;
  }
};

// Lifetime system
const lifetimeSystem = (world: World, deltaTime: number) => {
  const query = world.createQuery()
    .with('particle', Particle)
    .build();

  for (const { entity, components } of query) {
    const { particle } = components;
    particle.lifetime -= deltaTime;

    // Destroy particle when lifetime ends
    if (particle.lifetime <= 0) {
      world.destroyEntity(entity);
    }
  }
};

// Register systems
world.registerSystem(moveSystem);
world.registerSystem(lifetimeSystem);

// Game loop
function gameLoop(time: number) {
  const deltaTime = time / 1000;
  world.update(deltaTime);
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

