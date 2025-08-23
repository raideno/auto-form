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
      entryRoot: "lib",
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, "lib/index.ts"),
      name: "AutoForm",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
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
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
          "react-hook-form": "ReactHookForm",
          "@hookform/resolvers": "HookformResolvers",
          zod: "Zod",
          "zod/v4": "Zod",
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
