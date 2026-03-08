import path from "node:path";

import { defineConfig } from "vite";

import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    dts({
      include: [
        "src/components/auto-form/**/*",
        "src/components/ui/**/*",
        "src/components/controllers/**/*",
        "src/lib/**/*",
      ],
      exclude: ["**/*.test.*", "**/*.spec.*"],
      tsconfigPath: "./tsconfig.json",
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
        ui: path.resolve(__dirname, "src/lib/ui.ts"),
        registry: path.resolve(__dirname, "src/lib/registry.ts"),
        zod: path.resolve(__dirname, "src/lib/zod.ts"),
        controllers: path.resolve(__dirname, "src/lib/controllers.ts"),
        styles: path.resolve(__dirname, "src/lib/styles.css"),
      },
      formats: ["es", "cjs"],
    },
    cssCodeSplit: true,
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
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
