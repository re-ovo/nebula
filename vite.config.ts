import dts from "vite-plugin-dts";
import path from "path";
import react from "@vitejs/plugin-react";
import wesl from "wesl-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { staticBuildExtension } from "wesl-plugin";
import { defineConfig, UserConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [
    wesl({
      extensions: [staticBuildExtension],
    }),
    dts({ rollupTypes: true }),
    tailwindcss(),
    react(),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "mylib",
      formats: ["es", "cjs", "umd", "iife"],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
} satisfies UserConfig);
