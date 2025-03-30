export type Entity = number;

export class EntityManager {
  private nextEntityId: number = 0;
  private freeEntities: number[] = [];

  create(): Entity {
    if (this.freeEntities.length > 0) {
      return this.freeEntities.pop()!;
    }
    return this.nextEntityId++;
  }

  destroy(entity: Entity): void {
    this.freeEntities.push(entity);
  }

  isValid(entity: Entity): boolean {
    return (
      entity >= 0 &&
      entity < this.nextEntityId &&
      !this.freeEntities.includes(entity)
    );
  }
}
