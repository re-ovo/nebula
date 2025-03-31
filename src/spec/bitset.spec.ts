import { describe, it, expect, beforeEach } from "vitest";
import { Bitset } from "../utils/bitset";

describe("Bitset", () => {
  let bitset: Bitset;

  beforeEach(() => {
    bitset = new Bitset(100); // 创建一个可容纳100位的Bitset
  });

  describe("基本操作", () => {
    it("应该能够设置和测试位", () => {
      bitset.set(5);
      expect(bitset.test(5)).toBe(true);
      expect(bitset.test(6)).toBe(false);
    });

    it("应该能够清除位", () => {
      bitset.set(10);
      expect(bitset.test(10)).toBe(true);
      bitset.clear(10);
      expect(bitset.test(10)).toBe(false);
    });

    it("应该能够切换位", () => {
      expect(bitset.test(15)).toBe(false);
      bitset.toggle(15);
      expect(bitset.test(15)).toBe(true);
      bitset.toggle(15);
      expect(bitset.test(15)).toBe(false);
    });

    it("应该能够清除所有位", () => {
      bitset.set(3);
      bitset.set(7);
      bitset.set(42);
      bitset.clearAll();
      expect(bitset.test(3)).toBe(false);
      expect(bitset.test(7)).toBe(false);
      expect(bitset.test(42)).toBe(false);
      expect(bitset.popCount()).toBe(0);
    });

    it("应该能够设置所有位", () => {
      bitset.setAll();
      // 测试几个随机位
      expect(bitset.test(0)).toBe(true);
      expect(bitset.test(31)).toBe(true);
      expect(bitset.test(32)).toBe(true);
      expect(bitset.test(99)).toBe(true);
    });
  });

  describe("位计数", () => {
    it("popCount() 应正确计算设置的位数", () => {
      expect(bitset.popCount()).toBe(0);

      bitset.set(5);
      expect(bitset.popCount()).toBe(1);

      bitset.set(50);
      expect(bitset.popCount()).toBe(2);

      bitset.clear(5);
      expect(bitset.popCount()).toBe(1);

      bitset.clearAll();
      expect(bitset.popCount()).toBe(0);
    });
  });

  describe("边界情况", () => {
    it("应该处理跨越32位边界的操作", () => {
      // 测试32位边界的两侧
      bitset.set(31);
      bitset.set(32);
      expect(bitset.test(31)).toBe(true);
      expect(bitset.test(32)).toBe(true);

      bitset.clear(31);
      expect(bitset.test(31)).toBe(false);
      expect(bitset.test(32)).toBe(true);
    });

    it("应该处理接近容量上限的位置", () => {
      bitset.set(99); // 最大索引位置（基于我们的100位初始化）
      expect(bitset.test(99)).toBe(true);
    });
  });

  describe("多位操作", () => {
    it("应该正确处理多个位的设置和清除", () => {
      for (let i = 0; i < 100; i += 2) {
        bitset.set(i); // 设置所有偶数位
      }

      for (let i = 0; i < 100; i++) {
        if (i % 2 === 0) {
          expect(bitset.test(i)).toBe(true);
        } else {
          expect(bitset.test(i)).toBe(false);
        }
      }

      expect(bitset.popCount()).toBe(50); // 应该有50个设置的位

      bitset.clearAll();
      expect(bitset.popCount()).toBe(0);
    });
  });

  describe("equals", () => {
    it("应该正确比较两个Bitset", () => {
      const bitset1 = new Bitset(50);
      const bitset2 = new Bitset(100);

      bitset1.set(0);
      bitset2.set(0);
      expect(bitset1.equals(bitset2)).toBe(true);

      bitset1.set(1);
      expect(bitset1.equals(bitset2)).toBe(false);

      bitset2.set(1);
      expect(bitset1.equals(bitset2)).toBe(true);
    });
  });

  describe("toArray", () => {
    it("应该正确将Bitset转换为数组", () => {
      const bitset = new Bitset(100);
      bitset.set(5);
      bitset.set(10);
      expect(bitset.toArray()).toEqual([5, 10]);
    });
  });
});
