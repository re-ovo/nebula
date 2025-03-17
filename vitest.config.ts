import { mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(viteConfig, {
  extends: "vite.config.ts",
  test: {
    browser: {
      enabled: true,
      provider: "playwright",
      // https://vitest.dev/guide/browser/playwright
      instances: [{ browser: "chromium" }],
      headless: true, // 无头模式，不打开浏览器UI
      providerOptions: {
        launch: {
          args: ["--enable-gpu", "--enable-unsafe-webgpu"],
        },
      },
    },
  },
});
