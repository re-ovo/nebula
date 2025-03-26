import { hash, hashString } from "@/core";

type Hasher<K> = (key: K) => number;

type EqualityChecker<K> = (a: K, b: K) => boolean;

interface CacheEntry<K, V> {
  key: K;
  value: V;
  next: CacheEntry<K, V> | null;
}

export class HashCache<K, V> {
  private table: Array<CacheEntry<K, V> | null>;
  private size: number;
  private hasher: Hasher<K>;
  private equals: EqualityChecker<K>;
  private capacity: number;

  constructor(
    capacity: number = 16,
    hasher: Hasher<K> = (k: K) => {
      if (typeof k === "number") return hash(k);
      if (typeof k === "string") return hashString(k);
      throw new Error(
        "Unsupported key type, please provide a custom hasher function",
      );
    },
    equals: EqualityChecker<K> = (a: K, b: K) => a === b,
  ) {
    this.capacity = capacity;
    this.table = new Array(capacity).fill(null);
    this.size = 0;
    this.hasher = hasher;
    this.equals = equals;
  }

  private getIndex(key: K): number {
    const hash = this.hasher(key);
    return Math.abs(hash) % this.capacity;
  }

  set(key: K, value: V): void {
    const index = this.getIndex(key);
    let entry = this.table[index];

    // Check if key already exists
    while (entry !== null) {
      if (this.equals(entry.key, key)) {
        entry.value = value; // Update existing value
        return;
      }
      entry = entry.next;
    }

    // Create new entry
    const newEntry: CacheEntry<K, V> = {
      key,
      value,
      next: this.table[index],
    };

    this.table[index] = newEntry;
    this.size++;

    // Resize if load factor exceeds 0.75
    if (this.size > this.capacity * 0.75) {
      this.resize();
    }
  }

  get(key: K): V | undefined {
    const index = this.getIndex(key);
    let entry = this.table[index];

    while (entry !== null) {
      if (this.equals(entry.key, key)) {
        return entry.value;
      }
      entry = entry.next;
    }

    return undefined;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    const index = this.getIndex(key);
    let entry = this.table[index];
    let prev: CacheEntry<K, V> | null = null;

    while (entry !== null) {
      if (this.equals(entry.key, key)) {
        if (prev === null) {
          this.table[index] = entry.next;
        } else {
          prev.next = entry.next;
        }
        this.size--;
        return true;
      }
      prev = entry;
      entry = entry.next;
    }

    return false;
  }

  clear(): void {
    this.table = new Array(this.capacity).fill(null);
    this.size = 0;
  }

  getSize(): number {
    return this.size;
  }

  private resize(): void {
    const oldTable = this.table;
    this.capacity *= 2;
    this.table = new Array(this.capacity).fill(null);
    this.size = 0;

    for (const bucket of oldTable) {
      let entry = bucket;
      while (entry !== null) {
        this.set(entry.key, entry.value);
        entry = entry.next;
      }
    }
  }
}
