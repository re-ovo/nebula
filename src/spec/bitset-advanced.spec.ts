import { describe, it, expect } from "vitest";
import { Bitset } from "../utils/bitset";

describe("Bitset 高级特性", () => {
  describe("不同大小的Bitset", () => {
    it("应该处理小于32位的Bitset", () => {
      const smallBitset = new Bitset(10);
      smallBitset.set(5);
      smallBitset.set(9);
      expect(smallBitset.test(5)).toBe(true);
      expect(smallBitset.test(9)).toBe(true);
      expect(smallBitset.popCount()).toBe(2);
    });

    it("应该处理刚好32位的Bitset", () => {
      const bitset32 = new Bitset(32);
      bitset32.set(0);
      bitset32.set(31);
      expect(bitset32.test(0)).toBe(true);
      expect(bitset32.test(31)).toBe(true);
      expect(bitset32.popCount()).toBe(2);
    });

    it("应该处理大型Bitset（超过32位的多个单元）", () => {
      const largeBitset = new Bitset(200);
      largeBitset.set(31);
      largeBitset.set(32);
      largeBitset.set(63);
      largeBitset.set(64);
      largeBitset.set(199);

      expect(largeBitset.test(31)).toBe(true);
      expect(largeBitset.test(32)).toBe(true);
      expect(largeBitset.test(63)).toBe(true);
      expect(largeBitset.test(64)).toBe(true);
      expect(largeBitset.test(199)).toBe(true);
      expect(largeBitset.popCount()).toBe(5);
    });
  });

  describe("性能测试", () => {
    it("应该能高效处理大量位操作", () => {
      const perfBitset = new Bitset(1000);

      // 设置所有位
      for (let i = 0; i < 1000; i++) {
        perfBitset.set(i);
      }
      expect(perfBitset.popCount()).toBe(1000);

      // 清除所有偶数位
      for (let i = 0; i < 1000; i += 2) {
        perfBitset.clear(i);
      }
      expect(perfBitset.popCount()).toBe(500);

      // 确认状态正确
      for (let i = 0; i < 1000; i++) {
        expect(perfBitset.test(i)).toBe(i % 2 === 1);
      }
    });
  });

  describe("位操作组合", () => {
    it("应该正确处理一系列混合操作", () => {
      const mixedOps = new Bitset(64);

      // 设置几个位
      mixedOps.set(10);
      mixedOps.set(20);
      mixedOps.set(30);
      mixedOps.set(40);
      expect(mixedOps.popCount()).toBe(4);

      // 切换一些位（开和关）
      mixedOps.toggle(20); // 现在应该是关的
      mixedOps.toggle(25); // 原本是关的，现在应该是开的
      expect(mixedOps.test(20)).toBe(false);
      expect(mixedOps.test(25)).toBe(true);
      expect(mixedOps.popCount()).toBe(4); // 总数应该仍然是4

      // 清除一个位
      mixedOps.clear(30);
      expect(mixedOps.test(30)).toBe(false);
      expect(mixedOps.popCount()).toBe(3);

      // 设置所有位
      mixedOps.setAll();
      expect(mixedOps.popCount()).toBe(64);

      // 清除所有位
      mixedOps.clearAll();
      expect(mixedOps.popCount()).toBe(0);
    });
  });

  describe("极端情况", () => {
    it("应该处理0位的Bitset", () => {
      const zeroBitset = new Bitset(0);
      expect(zeroBitset.popCount()).toBe(0);
      // 不应该抛出错误
      zeroBitset.setAll();
      zeroBitset.clearAll();
      expect(zeroBitset.popCount()).toBe(0);
    });

    it("应该优雅地处理越界访问", () => {
      const bitset = new Bitset(10);

      // 这些操作不应该导致错误
      bitset.set(100); // 超出范围
      expect(bitset.test(100)).toBe(false); // 应该返回false而不是崩溃

      bitset.clear(100);
      bitset.toggle(100);
    });
  });
});
