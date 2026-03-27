/**
 * Vite Config Generator
 * Generates standardized vite.config.ts files for packages based on their type
 *
 * Usage: node scripts/generate-vite-config.js [package-path]
 */

import path from "path";
import { fileURLToPath } from "url";
import { readFileSync, writeFileSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const PACKAGE_TYPES = {
  CORE: "core",
  UTILS: "utils",
  PLUGIN: "plugin",
  FRAMEWORK: "framework",
  APP: "app",
  UMBRELLA: "umbrella"
};

const FRAMEWORK_EXTERNALS = {
  react: { global: "React", deps: ["react", "react-dom"] },
  vue: { global: "Vue", deps: ["vue"] }
};

/**
 * Detect package type based on directory name and contents
 */
function detectPackageType(packageDir) {
  const packageName = path.basename(packageDir);
  const packageJsonPath = path.join(packageDir, "package.json");
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

  // Check if it's in packages/
  const isInPackages = packageDir.includes("/packages/");

  if (packageName === "core") return PACKAGE_TYPES.CORE;
  if (packageName === "utils") return PACKAGE_TYPES.UTILS;
  if (packageName === "supermousejs") return PACKAGE_TYPES.UMBRELLA;
  if (packageName === "react" || packageName === "vue") return PACKAGE_TYPES.FRAMEWORK;
  if (["docs", "playground"].includes(packageName)) return PACKAGE_TYPES.APP;
  if (isInPackages) return PACKAGE_TYPES.PLUGIN;

  return null;
}

/**
 * Get UMD global name from package name
 */
function getGlobalName(packageName) {
  return packageName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Generate vite config for core package
 */
function generateCoreConfig() {
  return `import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf-8"));

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(pkg.version)
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "SupermouseCore",
      fileName: (format) => (format === "es" ? "index.mjs" : "index.umd.js")
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {
          "@supermousejs/core": "SupermouseCore"
        }
      }
    }
  },
  plugins: [dts({ rollupTypes: true })]
});
`;
}

/**
 * Generate vite config for utils package
 */
function generateUtilsConfig() {
  return `import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "SupermouseUtils",
      fileName: (format) => (format === "es" ? "index.mjs" : "index.umd.js")
    },
    rollupOptions: {
      external: ["@supermousejs/core"],
      output: {
        globals: {
          "@supermousejs/core": "SupermouseCore"
        }
      }
    }
  },
  plugins: [dts({ rollupTypes: true, bundledPackages: [] })]
});
`;
}

/**
 * Generate vite config for plugin packages
 */
function generatePluginConfig(packageName) {
  const globalName = getGlobalName(packageName);

  return `import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "Supermouse${globalName}",
      fileName: (format) => (format === "es" ? "index.mjs" : "index.umd.js")
    },
    rollupOptions: {
      external: ["@supermousejs/core", "@supermousejs/utils"],
      output: {
        globals: {
          "@supermousejs/core": "SupermouseCore",
          "@supermousejs/utils": "SupermouseUtils"
        }
      }
    }
  },
  plugins: [dts({ rollupTypes: true })]
});
`;
}

/**
 * Generate vite config for framework packages
 */
function generateFrameworkConfig(packageName) {
  const globalName = getGlobalName(packageName);
  const framework = packageName; // "react" or "vue"
  const frameworkConfig = FRAMEWORK_EXTERNALS[framework];
  const entry = framework === "react" ? "src/index.tsx" : "src/index.ts";

  const globals = {
    "@supermousejs/core": "SupermouseCore"
  };
  for (const dep of frameworkConfig.deps) {
    globals[dep] = frameworkConfig.global;
  }

  const globalsStr = JSON.stringify(globals, null, 6);

  return `import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "${entry}"),
      name: "Supermouse${globalName}",
      fileName: (format) => (format === "es" ? "index.mjs" : "index.umd.js")
    },
    rollupOptions: {
      external: [${frameworkConfig.deps.map((d) => `"${d}"`).join(", ")}, "@supermousejs/core"],
      output: {
        globals: ${globalsStr}
      }
    }
  },
  plugins: [dts({ rollupTypes: false })]
});
`;
}

/**
 * Generate vite config for umbrella packages
 */
function generateUmbrellaConfig() {
  return `import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "Supermouse",
      fileName: (format) => (format === "es" ? "index.mjs" : "index.umd.js")
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  },
  plugins: [dts({ rollupTypes: true })]
});
`;
}

/**
 * Generate vite config based on package type
 */
function generateConfig(packagePath) {
  const packageType = detectPackageType(packagePath);
  const packageName = path.basename(packagePath);

  if (!packageType) {
    throw new Error(\`Cannot determine package type for \${packagePath}\`);
  }

  switch (packageType) {
    case PACKAGE_TYPES.CORE:
      return generateCoreConfig();
    case PACKAGE_TYPES.UTILS:
      return generateUtilsConfig();
    case PACKAGE_TYPES.PLUGIN:
      return generatePluginConfig(packageName);
    case PACKAGE_TYPES.FRAMEWORK:
      return generateFrameworkConfig(packageName);
    case PACKAGE_TYPES.UMBRELLA:
      return generateUmbrellaConfig();
    case PACKAGE_TYPES.APP:
      // Apps have custom configs, skip generation
      console.warn(\`Skipping app package: \${packageName} (requires custom config)\`);
      return null;
    default:
      throw new Error(\`Unknown package type: \${packageType}\`);
  }
}

// Main execution
if (process.argv.length < 3) {
  console.error("Usage: node scripts/generate-vite-config.js <package-path>");
  process.exit(1);
}

const packagePath = path.resolve(process.argv[2]);
try {
  const config = generateConfig(packagePath);
  if (config) {
    console.log(config);
  }
} catch (error) {
  console.error(\`Error: \${error.message}\`);
  process.exit(1);
}
