import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// Builds one self-contained IIFE: dist/widget.js (CSS is inlined in JS and lives in the Shadow DOM)
export default defineConfig({
  plugins: [preact()],
  define: { "process.env.NODE_ENV": '"production"' },
  build: {
    lib: { entry: "src/main.jsx", name: "SentraWidget", formats: ["iife"], fileName: () => "widget.js" },
    minify: "esbuild",
    target: "es2020",
  },
});
