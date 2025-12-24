
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

// --- Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// 1. Get Arguments
const pluginName = process.argv[2];
if (!pluginName) {
  console.error("[!] Please provide a plugin name.");
  console.log("    Usage: node scripts/create-plugin.js <name>");
  process.exit(1);
}

// Helpers
const toPascalCase = (str) =>
  str.replace(/(^\w|-\w)/g, (text) => text.replace(/-/, "").toUpperCase());

const pascalName = toPascalCase(pluginName);
const umdName = `Supermouse${pascalName}`;
const pluginDir = path.join(rootDir, "packages", pluginName);

// --- Templates ---
const getTemplates = () => {
  return {
    packageJson: {
      name: `@supermousejs/${pluginName}`,
      version: "2.0.0",
      main: "dist/index.umd.js",
      module: "dist/index.mjs",
      types: "dist/index.d.ts",
      exports: {
        ".": {
          "types": "./dist/index.d.ts",
          "import": "./dist/index.mjs",
          "require": "./dist/index.umd.js"
        }
      },
      scripts: {
        build: "vite build",
      },
      dependencies: {
        "@supermousejs/core": "workspace:*"
      },
      devDependencies: {},
    },

    tsConfig: {
      extends: "../../tsconfig.base.json",
      include: ["src"],
      compilerOptions: {
        outDir: "dist",
        baseUrl: ".",
        paths: {
          "@supermousejs/core": ["../core/src/index.ts"]
        }
      },
    },

    viteConfig: `
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: '${umdName}',
      fileName: (format) => format === 'es' ? 'index.mjs' : 'index.umd.js',
    },
    rollupOptions: {
      external: ['@supermousejs/core'],
      output: {
        globals: {
          '@supermousejs/core': 'SupermouseCore'
        }
      }
    }
  },
  plugins: [dts({ rollupTypes: true })]
});
`.trim(),

    indexTs: `
import type { SupermousePlugin } from '@supermousejs/core';

export interface ${pascalName}Options {
  name?: string;
  isEnabled?: boolean;
}

export const ${pascalName} = (options: ${pascalName}Options = {}): SupermousePlugin => {
  return {
    name: '${pluginName}',
    isEnabled: true,

    install(app) {
      // Setup logic here
    },

    update(app, dt) {
      // Frame loop logic here
    },
    
    destroy(app) {
      // Cleanup logic here
    }
  };
};
`.trim(),
  };
};

// --- Logic ---

async function run() {
  const templates = getTemplates();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // 2. Safety Check
  if (fs.existsSync(pluginDir)) {
    const answer = await new Promise((resolve) => {
      rl.question(
        `\n[!] Plugin "@supermousejs/${pluginName}" already exists.\n` +
          `    Overwrite configs (package.json, vite, tsconfig) but KEEP src/index.ts? (y/N) `,
        resolve
      );
    });
    
    if (answer.toLowerCase() !== "y") {
      console.log("[-] Aborted. If you want to update configs non-destructively, use 'pnpm sync' instead.");
      process.exit(0);
    }
  } 
  rl.close();

  console.log(`\n>> Scaffolding @supermousejs/${pluginName}...`);

  // 3. Create Directory
  if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(path.join(pluginDir, "src"), { recursive: true });
  }

  // 4. Write Configs
  console.log(">> Writing configuration files...");

  // Preserve version if updating
  let finalPackageJson = templates.packageJson;
  if (fs.existsSync(path.join(pluginDir, "package.json"))) {
    try {
      const currentPkg = JSON.parse(fs.readFileSync(path.join(pluginDir, "package.json"), "utf-8"));
      finalPackageJson.version = currentPkg.version;
    } catch (e) {}
  }

  fs.writeFileSync(path.join(pluginDir, "package.json"), JSON.stringify(finalPackageJson, null, 2));
  fs.writeFileSync(path.join(pluginDir, "tsconfig.json"), JSON.stringify(templates.tsConfig, null, 2));
  fs.writeFileSync(path.join(pluginDir, "vite.config.ts"), templates.viteConfig);

  // 5. Write Source (Only if missing)
  const indexTsPath = path.join(pluginDir, "src/index.ts");
  if (!fs.existsSync(indexTsPath)) {
    fs.writeFileSync(indexTsPath, templates.indexTs);
    console.log("   [+] Created src/index.ts");
  } else {
    console.log("   [~] Preserved src/index.ts");
  }

  // 6. Update Consumers
  if (pluginName !== "core") {
    updateConsumer("playground", pluginName);
    updateConsumer("docs", pluginName);
  }

  console.log(`\n[ok] @supermousejs/${pluginName} is ready.`);
  console.log('\n    Run "pnpm install" to link dependencies.');
}

function updateConsumer(folderName, pluginName) {
  const consumerPath = path.join(rootDir, folderName);
  if (!fs.existsSync(consumerPath)) return;

  const pkgPath = path.join(consumerPath, "package.json");
  const vitePath = path.join(consumerPath, "vite.config.ts");

  // 1. Add dependency
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      pkg.dependencies = pkg.dependencies || {};
      pkg.dependencies[`@supermousejs/${pluginName}`] = "workspace:*";
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    } catch (e) {}
  }

  // 2. Add Vite Alias (Regex Append)
  if (fs.existsSync(vitePath)) {
    try {
      let viteContent = fs.readFileSync(vitePath, "utf-8");
      const aliasEntry = `'@supermousejs/${pluginName}': path.resolve(__dirname, '../packages/${pluginName}/src/index.ts')`;

      if (!viteContent.includes(`@supermousejs/${pluginName}`)) {
        if (viteContent.includes("alias: {")) {
          viteContent = viteContent.replace(/(alias:\s*{)/, `$1\n      ${aliasEntry},`);
          fs.writeFileSync(vitePath, viteContent);
        }
      }
    } catch (e) {}
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
