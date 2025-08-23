// vite.config.lib.ts
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: [
        "lib/**/*",
        "src/components/auto-form/**/*",
        "src/components/ui/**/*",
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
      },
      formats: ["es", "cjs"],
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
      ],
    },
    sourcemap: true,
    emptyOutDir: true,
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
