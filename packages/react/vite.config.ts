import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import path from "path";
import { writeFileSync } from "fs";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.tsx"),
      name: "SupermouseReact",
      fileName: (format) => (format === "es" ? "index.mjs" : "index.umd.js")
    },
    rollupOptions: {
      external: ["react", "react-dom", "@supermousejs/core"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "@supermousejs/core": "SupermouseCore"
        }
      }
    }
  },
  plugins: [
    dts({ rollupTypes: false }),
    {
      name: "dts-wrapper",
      apply: "build",
      closeBundle: async () => {
        const wrapperContent = `export * from "./react/src/index";\n`;
        writeFileSync(path.resolve(__dirname, "dist/index.d.ts"), wrapperContent);
      }
    }
  ]
});
