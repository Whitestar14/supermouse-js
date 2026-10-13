import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolve workspace packages to source. Without this, tests run against the
  // published `dist` build, which drifts behind the code under test.
  resolve: {
    alias: {
      "@supermousejs/core": fileURLToPath(new URL("../core/src/index.ts", import.meta.url)),
      "@supermousejs/utils": fileURLToPath(new URL("../utils/src/index.ts", import.meta.url))
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/__tests__/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"]
  }
});
