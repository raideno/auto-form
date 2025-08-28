import path from "node:path";

import { defineConfig } from "vite";

import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: [
        "lib/**/*",
        "src/components/auto-form/**/*",
        "src/components/ui/**/*",
        "src/components/controllers/**/*",
        "src/lib/**/*",
      ],
      exclude: ["demo/**/*", "**/*.test.*", "**/*.spec.*"],
      tsconfigPath: "./tsconfig.lib.json",
      outDir: "dist/lib",
      entryRoot: ".",
      rollupTypes: true,
      copyDtsFiles: false,
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        ui: path.resolve(__dirname, "lib/ui.ts"),
        registry: path.resolve(__dirname, "lib/registry.ts"),
        zod: path.resolve(__dirname, "lib/zod.ts"),
        controllers: path.resolve(__dirname, "lib/controllers.ts"),
      },
      formats: ["es"],
    },
    outDir: "dist/lib",
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react-hook-form",
        "@hookform/resolvers",
        "zod",
        "zod/v4",
        "@radix-ui/react-label",
        "@radix-ui/themes",
        "react-error-boundary",
      ],
      treeshake: true,
      plugins: [
        visualizer({
          filename: "stats.local.html",
          gzipSize: true,
          brotliSize: true,
          open: true,
        }),
      ],
    },
    sourcemap: false,
    emptyOutDir: true,
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
