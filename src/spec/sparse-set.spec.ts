import { describe, it, expect, beforeEach } from "vitest";
import { SparseSet } from "../utils/sparse-set";

describe("SparseSet", () => {
  let sparseSet: SparseSet;

  beforeEach(() => {
    sparseSet = new SparseSet(10); // 创建一个初始容量为10的SparseSet
  });

  describe("基本操作", () => {
    it("应该能够添加和检查实体", () => {
      expect(sparseSet.has(5)).toBe(false);
      sparseSet.add(5);
      expect(sparseSet.has(5)).toBe(true);
    });

    it("添加已存在的实体应返回false", () => {
      expect(sparseSet.add(1)).toBe(true);
      expect(sparseSet.add(1)).toBe(false);
    });

    it("应该能够移除实体", () => {
      sparseSet.add(10);
      expect(sparseSet.has(10)).toBe(true);
      expect(sparseSet.remove(10)).toBe(true);
      expect(sparseSet.has(10)).toBe(false);
    });

    it("移除不存在的实体应返回false", () => {
      expect(sparseSet.remove(42)).toBe(false);
    });

    it("应该能够清除所有实体", () => {
      sparseSet.add(3);
      sparseSet.add(7);
      sparseSet.add(9);
      expect(sparseSet.size()).toBe(3);

      sparseSet.clear();
      expect(sparseSet.size()).toBe(0);
      expect(sparseSet.has(3)).toBe(false);
      expect(sparseSet.has(7)).toBe(false);
      expect(sparseSet.has(9)).toBe(false);
    });
  });

  describe("容量调整", () => {
    it("应该在添加超出初始容量的实体时自动扩容", () => {
      // 添加超出初始容量的实体
      sparseSet.add(15);
      expect(sparseSet.has(15)).toBe(true);
      expect(sparseSet.capacity).toBeGreaterThanOrEqual(16);
    });

    it("应该在添加大量实体时正确扩容", () => {
      const initialCapacity = sparseSet.capacity;

      // 添加足够多的实体以触发多次扩容
      for (let i = 0; i < initialCapacity * 3; i++) {
        sparseSet.add(i);
      }

      expect(sparseSet.capacity).toBeGreaterThanOrEqual(initialCapacity * 3);
      expect(sparseSet.size()).toBe(initialCapacity * 3);

      // 验证所有实体都被正确添加
      for (let i = 0; i < initialCapacity * 3; i++) {
        expect(sparseSet.has(i)).toBe(true);
      }
    });
  });

  describe("实体管理", () => {
    it("size() 应正确返回实体数量", () => {
      expect(sparseSet.size()).toBe(0);

      sparseSet.add(1);
      expect(sparseSet.size()).toBe(1);

      sparseSet.add(5);
      expect(sparseSet.size()).toBe(2);

      sparseSet.remove(1);
      expect(sparseSet.size()).toBe(1);

      sparseSet.clear();
      expect(sparseSet.size()).toBe(0);
    });

    it("entities() 应返回包含所有实体的数组", () => {
      sparseSet.add(3);
      sparseSet.add(7);
      sparseSet.add(1);

      const entities = sparseSet.entities();
      expect(entities.length).toBe(3);

      // 检查返回的数组是否包含所有添加的实体
      // 注意：entities() 返回的顺序可能与添加顺序不同
      expect([...entities].sort()).toEqual([1, 3, 7]);
    });
  });

  describe("getDenseIndex", () => {
    it("应该返回正确的密集索引", () => {
      sparseSet.add(3);
      sparseSet.add(5);
      sparseSet.add(7);

      expect(sparseSet.getDenseIndex(3)).toBe(0);
      expect(sparseSet.getDenseIndex(5)).toBe(1);
      expect(sparseSet.getDenseIndex(7)).toBe(2);
    });
  });

  describe("边界情况", () => {
    it("应该处理不连续的实体ID", () => {
      sparseSet.add(0);
      sparseSet.add(1000);
      expect(sparseSet.has(0)).toBe(true);
      expect(sparseSet.has(1000)).toBe(true);
      expect(sparseSet.size()).toBe(2);
    });

    it("应该正确处理移除操作中的内部索引更新", () => {
      // 添加几个实体
      sparseSet.add(1);
      sparseSet.add(2);
      sparseSet.add(3);

      // 移除中间的实体
      sparseSet.remove(2);

      // 验证剩余实体仍然可以被正确检索
      expect(sparseSet.has(1)).toBe(true);
      expect(sparseSet.has(2)).toBe(false);
      expect(sparseSet.has(3)).toBe(true);

      // 再添加一个新实体
      sparseSet.add(4);

      // 验证所有实体状态
      expect(sparseSet.has(1)).toBe(true);
      expect(sparseSet.has(2)).toBe(false);
      expect(sparseSet.has(3)).toBe(true);
      expect(sparseSet.has(4)).toBe(true);
      expect(sparseSet.size()).toBe(3);
    });
  });
});
