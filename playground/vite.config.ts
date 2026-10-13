import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read core package.json to sync version numbers
const corePkgPath = path.resolve(__dirname, "../packages/core/package.json");
const corePkg = JSON.parse(readFileSync(corePkgPath, "utf-8"));

/**
 * The showcase aliases every package to its TypeScript source, so a cursor
 * added to `packages/*` is live on refresh without an intermediate build —
 * the same contract the docs site and engine lab rely on.
 */
export default defineConfig({
  plugins: [vue()],
  define: {
    __SUPERMOUSE_VERSION__: JSON.stringify(corePkg.version)
  },
  server: {
    port: 5180
  },
  resolve: {
    /*
     * `packages/vue` is aliased to source, and pnpm can give the package its
     * own copy of Vue (different TypeScript peer hash). Two runtimes means two
     * `provide`/`inject` symbol tables, so the adapter's context never reaches
     * the showcase — dedupe pins everything to this app's copy, exactly as the
     * Nuxt docs app does.
     */
    dedupe: ["vue"],
    alias: {
      "@supermousejs/utils": path.resolve(__dirname, "../packages/utils/src/index.ts"),
      "@supermousejs/trail": path.resolve(__dirname, "../packages/trail/src/index.ts"),
      "@supermousejs/labs": path.resolve(__dirname, "../packages/labs/src/index.ts"),

      "@supermousejs/core": path.resolve(__dirname, "../packages/core/src/index.ts"),
      "@supermousejs/dot": path.resolve(__dirname, "../packages/dot/src/index.ts"),
      "@supermousejs/ring": path.resolve(__dirname, "../packages/ring/src/index.ts"),
      "@supermousejs/text": path.resolve(__dirname, "../packages/text/src/index.ts"),
      "@supermousejs/image": path.resolve(__dirname, "../packages/image/src/index.ts"),

      "@supermousejs/magnetic": path.resolve(__dirname, "../packages/magnetic/src/index.ts"),
      "@supermousejs/pointer": path.resolve(__dirname, "../packages/pointer/src/index.ts"),
      "@supermousejs/icon": path.resolve(__dirname, "../packages/icon/src/index.ts"),
      "@supermousejs/states": path.resolve(__dirname, "../packages/states/src/index.ts"),
      "@supermousejs/stick": path.resolve(__dirname, "../packages/stick/src/index.ts"),
      "@supermousejs/vue": path.resolve(__dirname, "../packages/vue/src/index.ts")
    }
  }
});
