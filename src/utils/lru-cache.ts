class LRUCache<K, V> {
  private readonly capacity: number;
  private readonly cache: Map<K, V>;
  private readonly keyOrder: K[];

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map<K, V>();
    this.keyOrder = [];
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // Move the accessed key to the end of the array (most recently used)
    this.keyOrder.splice(this.keyOrder.indexOf(key), 1);
    this.keyOrder.push(key);

    return this.cache.get(key);
  }

  put(key: K, value: V): void {
    // If the key already exists, remove it from the order array
    if (this.cache.has(key)) {
      this.keyOrder.splice(this.keyOrder.indexOf(key), 1);
    }
    // If at capacity and adding a new key, remove the least recently used item
    else if (this.keyOrder.length >= this.capacity) {
      const lruKey = this.keyOrder.shift()!;
      this.cache.delete(lruKey);
    }

    // Add the new key-value pair and update the order
    this.cache.set(key, value);
    this.keyOrder.push(key);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    this.keyOrder.length = 0;
  }

  get size(): number {
    return this.cache.size;
  }
}

export { LRUCache };
