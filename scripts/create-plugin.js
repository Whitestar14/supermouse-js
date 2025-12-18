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
  console.log("    Usage: pnpm create <name>");
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
      version: "0.0.0",
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
      },
    },

    viteConfig: `
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

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
  return {
    name: '${pluginName}',

    install(app) {
      // Setup logic
    },

    update(app, deltaTime) {
      // Loop logic
    },

    destroy(app) {
      // Cleanup logic
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
    const answer = await new Promise((resolve) => {
      rl.question(
        `\n[+] Creating NEW plugin: "@supermousejs/${pluginName}"\n` +
          `    Location: packages/${pluginName}\n` +
          `    Proceed? (Y/n) `,
        resolve
      );
    });
    if (answer.toLowerCase() === "n") {
      console.log("[-] Aborted.");
      process.exit(0);
    }
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

  // 6. Update Playground
  if (pluginName !== "core") {
    updatePlayground(pluginName);
  }

  console.log(`\n[ok] @supermousejs/${pluginName} is ready.`);
  if (mode === "create") {
    console.log('    Run "pnpm install" to link dependencies.');
  }
}

function updatePlayground(name) {
  console.log(">> Linking to Playground...");
  const playgroundPkgPath = path.join(rootDir, "playground", "package.json");
  const playgroundPkg = JSON.parse(fs.readFileSync(playgroundPkgPath, "utf-8"));

  // 1. Add dependency
  playgroundPkg.dependencies = playgroundPkg.dependencies || {};
  playgroundPkg.dependencies[`@supermousejs/${name}`] = "workspace:*";
  fs.writeFileSync(playgroundPkgPath, JSON.stringify(playgroundPkg, null, 2));

  // 2. Add Vite Alias
  const playgroundVitePath = path.join(rootDir, "playground", "vite.config.ts");
  let playgroundViteContent = fs.readFileSync(playgroundVitePath, "utf-8");

  const aliasEntry = `'@supermousejs/${name}': path.resolve(__dirname, '../packages/${name}/src/index.ts')`;

  if (!playgroundViteContent.includes(`@supermousejs/${name}`)) {
    if (playgroundViteContent.includes("alias: {")) {
      playgroundViteContent = playgroundViteContent.replace(
        /(alias:\s*{)/,
        `$1\n      ${aliasEntry},`
      );
      fs.writeFileSync(playgroundVitePath, playgroundViteContent);
      console.log("   [+] Added alias to vite.config.ts");
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
