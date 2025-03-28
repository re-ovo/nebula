import { describe, it, expect, beforeEach } from "vitest";
import { LRUCache } from "../utils/lru-cache";

describe("LRUCache", () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>(3); // 使用容量为3的缓存进行测试
  });

  it("should store and retrieve values correctly", () => {
    cache.put("a", 1);
    cache.put("b", 2);

    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBeUndefined();
  });

  it("should respect capacity limit and remove least recently used item", () => {
    cache.put("a", 1);
    cache.put("b", 2);
    cache.put("c", 3);
    cache.put("d", 4);

    // 'a' should be evicted as it's the least recently used
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
    expect(cache.get("d")).toBe(4);
  });

  it("should update access order when getting items", () => {
    cache.put("a", 1);
    cache.put("b", 2);
    cache.put("c", 3);

    // Access 'a' to make it most recently used
    cache.get("a");
    cache.put("d", 4);

    // 'b' should be evicted as it's now the least recently used
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
    expect(cache.get("d")).toBe(4);
  });

  it("should update existing values without affecting order", () => {
    cache.put("a", 1);
    cache.put("b", 2);
    cache.put("a", 10); // Update existing value

    expect(cache.get("a")).toBe(10);
    expect(cache.size).toBe(2);
  });

  it("should correctly implement has() method", () => {
    cache.put("a", 1);

    expect(cache.has("a")).toBe(true);
    expect(cache.has("b")).toBe(false);
  });

  it("should clear all items", () => {
    cache.put("a", 1);
    cache.put("b", 2);
    cache.clear();

    expect(cache.size).toBe(0);
    expect(cache.has("a")).toBe(false);
    expect(cache.has("b")).toBe(false);
  });

  it("should maintain correct size", () => {
    expect(cache.size).toBe(0);

    cache.put("a", 1);
    expect(cache.size).toBe(1);

    cache.put("b", 2);
    expect(cache.size).toBe(2);

    cache.put("c", 3);
    expect(cache.size).toBe(3);

    cache.put("d", 4); // This should evict 'a'
    expect(cache.size).toBe(3);
  });
});
