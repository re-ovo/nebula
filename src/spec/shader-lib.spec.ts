import { ShaderLib } from "@/shader/shader-lib";
import { ShaderOptions } from "@/shader/shader-options";
import { ShaderSource } from "@/shader/shader-source";
import { ShaderVariant } from "@/shader/shader-variant";
import { beforeEach, describe, expect, it } from "vitest";

describe("ShaderLib", () => {
  let shaderLib: ShaderLib;
  let testShaderSource: ShaderSource;
  let testShaderOptions: ShaderOptions;

  beforeEach(() => {
    shaderLib = new ShaderLib();
    testShaderSource = new ShaderSource("test.wesl", "fn main() { return; }");
    testShaderOptions = {
      constants: { PI: 3.14 },
      conditions: { USE_NORMAL_MAP: true },
    };
  });

  it("应该正确注册和获取着色器源", () => {
    shaderLib.registerShaderSource(testShaderSource);
    const retrievedSource = shaderLib.getShaderSource("test.wesl");

    expect(retrievedSource).toBe(testShaderSource);
  });

  it("应该正确注销着色器源", () => {
    shaderLib.registerShaderSource(testShaderSource);
    shaderLib.unregisterShaderSource(testShaderSource);
    const retrievedSource = shaderLib.getShaderSource("test.wesl");

    expect(retrievedSource).toBeUndefined();
  });

  it("应该能获取着色器变体", async () => {
    // 注册测试着色器源
    shaderLib.registerShaderSource(testShaderSource);

    // 获取着色器变体
    const variant = await shaderLib.getShaderVariant(
      testShaderSource,
      testShaderOptions,
    );

    // 验证结果是否为ShaderVariant实例
    expect(variant).toBeInstanceOf(ShaderVariant);
    // 验证选项是否正确传递
    expect(variant.getOptions()).toBe(testShaderOptions);
  });

  it("应该缓存相同选项的着色器变体", async () => {
    // 注册测试着色器源
    shaderLib.registerShaderSource(testShaderSource);

    // 获取着色器变体两次
    const variant1 = await shaderLib.getShaderVariant(
      testShaderSource,
      testShaderOptions,
    );
    const variant2 = await shaderLib.getShaderVariant(
      testShaderSource,
      testShaderOptions,
    );

    // 验证缓存是否生效（应该是同一个实例）
    expect(variant1).toBe(variant2);
  });

  it("应该为不同选项创建不同的着色器变体", async () => {
    // 注册测试着色器源
    shaderLib.registerShaderSource(testShaderSource);

    // 准备不同的选项
    const otherOptions: ShaderOptions = {
      constants: { PI: 3.14159 },
      conditions: { USE_NORMAL_MAP: false },
    };

    // 获取两个不同选项的着色器变体
    const variant1 = await shaderLib.getShaderVariant(
      testShaderSource,
      testShaderOptions,
    );
    const variant2 = await shaderLib.getShaderVariant(
      testShaderSource,
      otherOptions,
    );

    // 验证是否为不同实例
    expect(variant1).not.toBe(variant2);
  });

  it("应该处理多个着色器源", async () => {
    // 创建并注册第二个着色器源
    const secondShaderSource = new ShaderSource(
      "second.wesl",
      "fn second() { return 12; }",
    );
    shaderLib.registerShaderSource(testShaderSource);
    shaderLib.registerShaderSource(secondShaderSource);

    // 验证两个源都能被获取
    expect(shaderLib.getShaderSource("test.wesl")).toBe(testShaderSource);
    expect(shaderLib.getShaderSource("second.wesl")).toBe(secondShaderSource);

    // 获取两个源的变体
    const variant1 = await shaderLib.getShaderVariant(
      testShaderSource,
      testShaderOptions,
    );
    const variant2 = await shaderLib.getShaderVariant(
      secondShaderSource,
      testShaderOptions,
    );

    // 验证变体是否成功创建且不同
    expect(variant1).not.toBe(variant2);
  });

  it("应该正确处理实际着色器代码的链接", async () => {
    // 创建两个相互依赖的着色器源
    const mainShader = new ShaderSource(
      "main.wesl",
      `
      import package::utils::calculate;

      @fragment
      fn main() -> @location(0) vec4f {
        let value = calculate();
        return vec4f(value, value, value, 1.0);
      }
      `,
    );

    const utilsShader = new ShaderSource(
      "utils.wesl",
      `
      fn calculate() -> f32 {
        @if(USE_HIGH_PRECISION)
        return 0.5;
        @if(!USE_HIGH_PRECISION)
        return 0.1;
      }
      `,
    );
    // 注册着色器源
    shaderLib.registerShaderSource(mainShader);
    shaderLib.registerShaderSource(utilsShader);

    // 使用条件编译选项
    const options: ShaderOptions = {
      constants: {},
      conditions: { USE_HIGH_PRECISION: true },
    };

    // 获取编译后的着色器变体
    const variant = await shaderLib.getShaderVariant(mainShader, options);

    // 验证链接后的代码
    const code = variant.getCode();
    expect(code).toContain("fn main()");
    expect(code).toContain("return 0.5");
    expect(code).not.toContain("return 0.1"); // 条件编译应该排除这部分
    expect(code).not.toContain("import"); // WESL的import应该被处理
  });
});
