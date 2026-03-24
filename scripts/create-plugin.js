import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import { spawn } from "child_process";
import { toPascalCase } from "./config.js";

// --- Setup ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const pluginName = process.argv[2];
if (!pluginName) {
  console.error("[!] please provide a plugin name.");
  console.error("    usage: node scripts/create-plugin.js <name>");
  process.exit(1);
}

if (!/^[a-z][a-z0-9-]*$/.test(pluginName)) {
  console.error('[!] plugin name must be kebab-case (e.g. "cool-effect")');
  process.exit(1);
}

const pascalName = toPascalCase(pluginName);
const pluginDir = path.join(rootDir, "packages", pluginName);

// --- Templates ---

function makeTemplates() {
  return {
    /** minimal package.json; sync-configs will fill in the rest right after */
    packageJson: {
      name: `@supermousejs/${pluginName}`,
      version: "2.0.0",
      private: false,
      description: `Supermouse ${pascalName} plugin`,
    },

    tsConfig: {
      extends: "../../tsconfig.base.json",
      include: ["src"],
      compilerOptions: {
        outDir: "dist",
        baseUrl: ".",
        paths: { "@supermousejs/core": ["../core/src/index.ts"] },
      },
    },

    indexTs: `\
import type { SupermousePlugin } from '@supermousejs/core';

export interface ${pascalName}Options {
  name?:      string;
  isEnabled?: boolean;
}

export const ${pascalName} = (options: ${pascalName}Options = {}): SupermousePlugin => {
  return {
    name:      '${pluginName}',
    isEnabled: options.isEnabled ?? true,

    install(app) {
      // setup logic
    },

    update(app, dt) {
      // per-frame logic
    },

    destroy(app) {
      // cleanup
    },
  };
};
`,
  };
}

// --- Helpers ---

function question(rl, prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

function preserveVersion(dir, defaults) {
  const pkgPath = path.join(dir, "package.json");
  if (!fs.existsSync(pkgPath)) return defaults;
  try {
    const existing = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    return { ...defaults, version: existing.version ?? defaults.version };
  } catch {
    return defaults;
  }
}

function updateConsumerPackageJson(folderName) {
  const pkgPath = path.join(rootDir, folderName, "package.json");
  if (!fs.existsSync(pkgPath)) return;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    pkg.dependencies ??= {};
    pkg.dependencies[`@supermousejs/${pluginName}`] = "workspace:*";
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log(`   [+] added to ${folderName}/package.json`);
  } catch {
    console.error(`   [!] error updating ${folderName}/package.json`);
  }
}

function runSyncConfigs() {
  return new Promise((resolve, reject) => {
    const syncPath = path.join(__dirname, "sync-configs.js");
    const child = spawn(
      "node",
      [syncPath, `--packages=${pluginName}`, "--non-interactive"],
      {
        stdio: "inherit",
      }
    );
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`sync exited ${code}`))
    );
    child.on("error", reject);
  });
}

// --- Main ---

async function run() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const templates = makeTemplates();

  if (fs.existsSync(pluginDir)) {
    const answer = await question(
      rl,
      `\n[!] @supermousejs/${pluginName} already exists.\n` +
        `    overwrite configs but KEEP src/index.ts? (y/N) `
    );
    if (answer.toLowerCase() !== "y") {
      console.log(
        '[-] aborted. use "pnpm sync" for non-destructive config updates.'
      );
      rl.close();
      process.exit(0);
    }
  }
  rl.close();

  console.log(`\n>> scaffolding @supermousejs/${pluginName}...`);

  fs.mkdirSync(path.join(pluginDir, "src"), { recursive: true });

  console.log(">> writing configuration files...");
  const finalPkg = preserveVersion(pluginDir, templates.packageJson);
  fs.writeFileSync(
    path.join(pluginDir, "package.json"),
    JSON.stringify(finalPkg, null, 2)
  );
  fs.writeFileSync(
    path.join(pluginDir, "tsconfig.json"),
    JSON.stringify(templates.tsConfig, null, 2)
  );

  const indexPath = path.join(pluginDir, "src/index.ts");
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, templates.indexTs);
    console.log("   [+] created src/index.ts");
  } else {
    console.log("   [~] preserved existing src/index.ts");
  }

  if (pluginName !== "core") {
    updateConsumerPackageJson("playground");
    updateConsumerPackageJson("docs");
  }

  console.log("\n>> running config sync...");
  await runSyncConfigs();

  console.log(`\n[ok] @supermousejs/${pluginName} is ready.`);
  console.log('     run "pnpm install" to link dependencies.\n');
}

run().catch((err) => {
  console.error("[x]", err.message);
  process.exit(1);
});
