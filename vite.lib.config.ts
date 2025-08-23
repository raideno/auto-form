import path from "node:path";

import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") return "index.css";
          return assetInfo.name || "asset";
        },
      },
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
