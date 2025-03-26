import { describe, it, expect, beforeEach } from "vitest";
import { HashCache } from "../utils/hash-cache";

describe("HashCache", () => {
  let cache: HashCache<string, number>;

  beforeEach(() => {
    cache = new HashCache<string, number>();
  });

  describe("基本操作", () => {
    it("应该能够设置和获取值", () => {
      cache.set("test", 123);
      expect(cache.get("test")).toBe(123);
    });

    it("不存在的键应该返回 undefined", () => {
      expect(cache.get("nonexistent")).toBeUndefined();
    });

    it("应该能够检查键是否存在", () => {
      cache.set("exists", 1);
      expect(cache.has("exists")).toBe(true);
      expect(cache.has("nonexistent")).toBe(false);
    });

    it("应该能够更新现有值", () => {
      cache.set("key", 1);
      cache.set("key", 2);
      expect(cache.get("key")).toBe(2);
    });

    it("应该能够删除值", () => {
      cache.set("delete-me", 1);
      expect(cache.delete("delete-me")).toBe(true);
      expect(cache.get("delete-me")).toBeUndefined();
    });

    it("删除不存在的键应该返回 false", () => {
      expect(cache.delete("nonexistent")).toBe(false);
    });

    it("应该能够清空缓存", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.clear();
      expect(cache.getSize()).toBe(0);
      expect(cache.get("a")).toBeUndefined();
      expect(cache.get("b")).toBeUndefined();
    });
  });

  describe("大小和容量", () => {
    it("应该正确跟踪大小", () => {
      expect(cache.getSize()).toBe(0);
      cache.set("a", 1);
      expect(cache.getSize()).toBe(1);
      cache.set("b", 2);
      expect(cache.getSize()).toBe(2);
      cache.delete("a");
      expect(cache.getSize()).toBe(1);
    });

    it("更新现有键不应改变大小", () => {
      cache.set("key", 1);
      const size = cache.getSize();
      cache.set("key", 2);
      expect(cache.getSize()).toBe(size);
    });
  });

  describe("哈希冲突处理", () => {
    it("应该处理使用相同哈希值的不同键", () => {
      // 创建一个总是返回相同哈希值的哈希函数
      const collisionCache = new HashCache<string, number>(16, () => 1);

      collisionCache.set("a", 1);
      collisionCache.set("b", 2);
      collisionCache.set("c", 3);

      expect(collisionCache.get("a")).toBe(1);
      expect(collisionCache.get("b")).toBe(2);
      expect(collisionCache.get("c")).toBe(3);
    });
  });

  describe("自定义哈希和相等性检查", () => {
    it("应该支持自定义哈希函数", () => {
      const lengthHash = new HashCache<string, number>(16, (str) => str.length);
      lengthHash.set("a", 1);
      lengthHash.set("b", 2);
      expect(lengthHash.get("a")).toBe(1);
      expect(lengthHash.get("b")).toBe(2);
    });

    it("应该支持自定义相等性检查", () => {
      const caseInsensitiveCache = new HashCache<string, number>(
        16,
        (str) => str.toLowerCase().charCodeAt(0),
        (a, b) => a.toLowerCase() === b.toLowerCase(),
      );

      caseInsensitiveCache.set("Hello", 1);
      expect(caseInsensitiveCache.get("HELLO")).toBe(1);
      expect(caseInsensitiveCache.get("hello")).toBe(1);
    });
  });

  describe("边界情况", () => {
    it("应该处理特殊字符键", () => {
      cache.set("", 1);
      cache.set(" ", 2);
      cache.set("🎉", 3);

      expect(cache.get("")).toBe(1);
      expect(cache.get(" ")).toBe(2);
      expect(cache.get("🎉")).toBe(3);
    });

    it("应该处理 null 和 undefined 值", () => {
      const nullCache = new HashCache<string, null | undefined>();
      nullCache.set("null", null);
      nullCache.set("undefined", undefined);

      expect(nullCache.get("null")).toBeNull();
      expect(nullCache.get("undefined")).toBeUndefined();
    });
  });
});
