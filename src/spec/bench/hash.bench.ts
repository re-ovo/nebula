import { describe, bench } from "vitest";
import { hash, hashString, hashNumber, hashBoolean } from "../../core/hash";

describe("Hash Functions Benchmarks", () => {
  // 基础哈希函数测试
  describe("hash", () => {
    bench("单个数字哈希", () => {
      hash(42);
    });

    bench("带前值的数字哈希", () => {
      hash(42, 12345);
    });
  });

  // 字符串哈希测试
  describe("hashString", () => {
    bench("空字符串", () => {
      hashString("");
    });

    bench("短字符串", () => {
      hashString("hello");
    });

    bench("中等长度字符串", () => {
      hashString("this is a medium length string for testing performance");
    });

    bench("长字符串", () => {
      hashString("a".repeat(1000));
    });

    bench("带特殊字符的字符串", () => {
      hashString("特殊字符测试 🚀 !@#$%^&*()");
    });
  });

  // 数字哈希测试
  describe("hashNumber", () => {
    bench("单个整数", () => {
      hashNumber(42);
    });

    bench("单个浮点数", () => {
      hashNumber(3.14159);
    });

    bench("小数组", () => {
      hashNumber([1, 2, 3, 4, 5]);
    });

    bench("中等大小数组", () => {
      hashNumber(Array.from({ length: 100 }, (_, i) => i));
    });

    bench("大数组", () => {
      hashNumber(Array.from({ length: 1000 }, (_, i) => i));
    });
  });

  // 布尔值哈希测试
  describe("hashBoolean", () => {
    bench("true", () => {
      hashBoolean(true);
    });

    bench("false", () => {
      hashBoolean(false);
    });
  });

  // 组合测试
  describe("组合哈希场景", () => {
    bench("哈希复杂对象", () => {
      const obj = {
        id: 123456,
        name: "测试对象",
        active: true,
        tags: ["tag1", "tag2", "tag3"],
      };

      // 模拟复杂对象哈希计算
      let result = hashNumber(obj.id);
      result = hashString(obj.name, result);
      result = hashBoolean(obj.active, result);

      for (const tag of obj.tags) {
        result = hashString(tag, result);
      }
    });

    bench("批量字符串哈希", () => {
      const strings = [
        "first",
        "second",
        "third",
        "fourth",
        "fifth",
        "sixth",
        "seventh",
        "eighth",
        "ninth",
        "tenth",
      ];

      for (const str of strings) {
        hashString(str);
      }
    });
  });
});
