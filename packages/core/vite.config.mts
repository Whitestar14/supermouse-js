import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import { visualizer } from "rollup-plugin-visualizer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf-8"));

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(pkg.version)
  },
  build: {
    target: "es2022",
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "SupermouseCore",
      fileName: (format) => (format === "es" ? "index.mjs" : "index.umd.js")
    }
  },
  esbuild: {
    legalComments: "none",
    drop: ["debugger"]
  },
  plugins: [
    dts({ rollupTypes: true }),
    visualizer({
      filename: "./bundle-stats.json",
      template: "raw-data",
      gzipSize: true,
      brotliSize: false
    })
  ]
});
