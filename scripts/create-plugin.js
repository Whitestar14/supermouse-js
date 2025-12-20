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
const pluginDir = path.join(rootDir, "packages", pluginName);

// --- Templates ---
const getTemplates = () => {
  const dependencies =
    pluginName === "core" ? {} : { "@supermousejs/core": "workspace:*" };

  return {
    packageJson: {
      name: `@supermousejs/${pluginName}`,
      version: "2.0.0",
      main: "dist/index.umd.js",
      module: "dist/index.mjs",
      types: "dist/index.d.ts",
      scripts: {
        build: "vite build",
      },
      dependencies: dependencies,
      devDependencies: {}, // Inherited from root
    },

    tsConfig: {
      extends: "../../tsconfig.base.json",
      include: ["src"],
      compilerOptions: {
        outDir: "dist",
        baseUrl: ".",
        ...(pluginName !== "core"
          ? {
              paths: {
                "@supermousejs/core": ["../core/src/index.ts"],
              },
            }
          : {}),
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
      name: '${pascalName}',
      fileName: (format) => \`index.\${format}.js\`,
    },
    rollupOptions: {
      external: ${pluginName === "core" ? "[]" : "['@supermousejs/core']"},
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

/**
 * Options for the ${pascalName} plugin.
 */
export interface ${pascalName}Options {
  /**
   * Example option.
   * @default true
   */
  enabled?: boolean;
}

/**
 * ${pascalName} Plugin.
 * @param options - Configuration options.
 */
export const ${pascalName} = (options: ${pascalName}Options = {}): SupermousePlugin => {
  // Local state variables
  let isSetup = false;

  return {
    name: '${pluginName}',
    isEnabled: true,

    install(app) {
      // 1. Create DOM elements
      // 2. Append to app.container
      // 3. Register event listeners or hover targets
      isSetup = true;
    },

    update(app, deltaTime) {
      if (!isSetup) return;
      // Calculate physics, update DOM transforms
    },

    onEnable(app) {
      // Called when plugin is enabled via app.enablePlugin('${pluginName}')
      // Restore visibility (e.g. opacity = 1)
    },

    onDisable(app) {
      // Called when plugin is disabled via app.disablePlugin('${pluginName}')
      // Hide visuals (e.g. opacity = 0) to prevent ghosting
    },

    destroy(app) {
      // Cleanup DOM elements and listeners
    }
  };
};
`.trim(),
  };
};

// --- Logic ---

async function run() {
  const templates = getTemplates();
  let mode = "create"; // 'create' | 'update'

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // 2. Determine Mode
  if (fs.existsSync(pluginDir)) {
    mode = "update";
    const answer = await new Promise((resolve) => {
      rl.question(
        `\n[!] Plugin "@supermousejs/${pluginName}" already exists.\n` +
          `    Overwrite configs (package.json, vite, tsconfig) but KEEP src/index.ts? (y/N) `,
        resolve
      );
    });
    if (answer.toLowerCase() !== "y") {
      console.log("[-] Aborted.");
      process.exit(0);
    }
  } else {
    mode = "create";
  }
  rl.close();

  console.log(
    `\n>> ${
      mode === "create" ? "Scaffolding" : "Updating configs for"
    } @supermousejs/${pluginName}...`
  );

  // 3. Create Directory
  if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(path.join(pluginDir, "src"), { recursive: true });
  }

  // 4. Write Configs (Always overwrite)
  console.log(">> Writing configuration files...");

  let finalPackageJson = templates.packageJson;

  // Preserve version if updating
  if (mode === "update") {
    try {
      const currentPkg = JSON.parse(
        fs.readFileSync(path.join(pluginDir, "package.json"), "utf-8")
      );
      finalPackageJson.version = currentPkg.version;
    } catch (e) {
      /* ignore */
    }
  }

  fs.writeFileSync(
    path.join(pluginDir, "package.json"),
    JSON.stringify(finalPackageJson, null, 2)
  );
  fs.writeFileSync(
    path.join(pluginDir, "tsconfig.json"),
    JSON.stringify(templates.tsConfig, null, 2)
  );
  fs.writeFileSync(
    path.join(pluginDir, "vite.config.ts"),
    templates.viteConfig
  );

  // 5. Write Source (Only if create)
  const indexTsPath = path.join(pluginDir, "src/index.ts");
  if (mode === "create") {
    fs.writeFileSync(indexTsPath, templates.indexTs);
    console.log("   [+] Created src/index.ts");
  } else {
    console.log("   [~] Preserved src/index.ts");
  }

  // 6. Update Consumers (Playground, Docs)
  if (pluginName !== "core") {
    updateConsumer("playground", pluginName);
    updateConsumer("docs", pluginName);
  }

  console.log(`\n[ok] @supermousejs/${pluginName} is ready.`);
  if (mode === "create") {
    console.log('    Run "pnpm install" to link dependencies.');
  }
}

function updateConsumer(folderName, pluginName) {
  const consumerPath = path.join(rootDir, folderName);

  // Check existence
  if (!fs.existsSync(consumerPath)) {
    console.log(`   [~] Skipping ${folderName} (not found).`);
    return;
  }

  console.log(`>> Linking to ${folderName}...`);
  const pkgPath = path.join(consumerPath, "package.json");
  const vitePath = path.join(consumerPath, "vite.config.ts");

  // 1. Add dependency
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      pkg.dependencies = pkg.dependencies || {};
      pkg.dependencies[`@supermousejs/${pluginName}`] = "workspace:*";
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      console.log(`   [+] Added dependency to ${folderName}/package.json`);
    } catch (e) {
      console.error(`   [!] Failed to update ${folderName}/package.json`);
    }
  }

  // 2. Add Vite Alias
  if (fs.existsSync(vitePath)) {
    try {
      let viteContent = fs.readFileSync(vitePath, "utf-8");
      const aliasEntry = `'@supermousejs/${pluginName}': path.resolve(__dirname, '../packages/${pluginName}/src/index.ts')`;

      if (!viteContent.includes(`@supermousejs/${pluginName}`)) {
        if (viteContent.includes("alias: {")) {
          viteContent = viteContent.replace(
            /(alias:\s*{)/,
            `$1\n      ${aliasEntry},`
          );
          fs.writeFileSync(vitePath, viteContent);
          console.log(`   [+] Added alias to ${folderName}/vite.config.ts`);
        } else {
          console.warn(
            `   [!] Could not find "alias: {" block in ${folderName}/vite.config.ts`
          );
        }
      }
    } catch (e) {
      console.error(`   [!] Failed to update ${folderName}/vite.config.ts`);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
