import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import {
  getUmdName,
  SHARED_LIBS,
  SPECIAL_CASES,
  EXCLUDED_PACKAGES,
} from "./config.js";
import {
  patchJsonFile as utilPatchJsonFile,
  scanForImports as utilScanForImports,
} from "./utils/config-patcher.js";

// --- Setup ---

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "..");
const packagesDir = path.join(rootDir, "packages");

// --- CLI args ---

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const nonInteractive =
  args.includes("--non-interactive") || args.includes("-y");
const syncAll = args.includes("--all");
const filterArg = args.find((a) => a.startsWith("--packages="));
const selectedPackages = filterArg ? filterArg.split("=")[1].split(",") : null;

// --- Patch: package.json ---

function patchPackageJson(pkgPath, pkgName, usedLibs) {
  const result = utilPatchJsonFile(
    pkgPath,
    (content) => {
      const changes = [];
      const isCore = pkgName === "core";

      // Scripts
      if (!content.scripts) content.scripts = {};
      if (content.scripts.build !== "vite build") {
        content.scripts.build = "vite build";
        changes.push('set build script → "vite build"');
      }

      // Entry points
      const entrypoints = {
        main: "dist/index.umd.js",
        module: "dist/index.mjs",
        types: "dist/index.d.ts",
      };
      for (const [field, expected] of Object.entries(entrypoints)) {
        if (content[field] !== expected) {
          content[field] = expected;
          changes.push(`set ${field} → "${expected}"`);
        }
      }

      // publishConfig for scoped packages
      if (content.name?.startsWith("@supermousejs/")) {
        if (content.publishConfig?.access !== "public") {
          content.publishConfig = { access: "public" };
          changes.push('set publishConfig.access → "public"');
        }
      }

      // exports
      if (!content.exports) {
        content.exports = {};
        changes.push("created exports field");
      }
      content.exports["."] = {
        types: "./dist/index.d.ts",
        import: "./dist/index.mjs",
        require: "./dist/index.umd.js",
      };

      // deps
      if (!content.peerDependencies) content.peerDependencies = {};
      if (!content.dependencies) content.dependencies = {};
      if (!content.devDependencies) content.devDependencies = {};

      if (!isCore) {
        const corePkg = "@supermousejs/core";
        if (content.peerDependencies[corePkg] !== "workspace:*") {
          content.peerDependencies[corePkg] = "workspace:*";
          changes.push(`added ${corePkg} → peerDependencies`);
        }
        if (content.devDependencies[corePkg] !== "workspace:*") {
          content.devDependencies[corePkg] = "workspace:*";
          changes.push(`added ${corePkg} → devDependencies`);
        }
        if (content.dependencies[corePkg]) {
          delete content.dependencies[corePkg];
          changes.push(`removed ${corePkg} from dependencies`);
        }
      }

      for (const lib of usedLibs) {
        if (content.dependencies[lib.pkg] !== "workspace:*") {
          content.dependencies[lib.pkg] = "workspace:*";
          changes.push(`added ${lib.pkg} → dependencies`);
        }
        if (content.peerDependencies[lib.pkg]) {
          delete content.peerDependencies[lib.pkg];
          changes.push(`moved ${lib.pkg} out of peerDependencies`);
        }
        if (content.devDependencies[lib.pkg]) {
          delete content.devDependencies[lib.pkg];
        }
      }

      // prune empty dep blocks
      for (const key of [
        "dependencies",
        "peerDependencies",
        "devDependencies",
      ]) {
        if (content[key] && Object.keys(content[key]).length === 0)
          delete content[key];
      }

      return { content, changes };
    },
    dryRun
  );

  reportPatchResult("package.json", result);
}

// --- Patch: tsconfig.json ---

function patchTsConfig(configPath, pkgName, usedLibs) {
  const result = utilPatchJsonFile(
    configPath,
    (content) => {
      const changes = [];

      (content.extends ??= "../../tsconfig.base.json"),
        changes.push("set extends");
      (content.include ??= ["src"]), changes.push("set include");
      content.compilerOptions ??= {};
      (content.compilerOptions.outDir ??= "dist"), changes.push("set outDir");
      (content.compilerOptions.baseUrl ??= "."), changes.push("set baseUrl");
      content.compilerOptions.paths ??= {};

      if (
        pkgName !== "core" &&
        !content.compilerOptions.paths["@supermousejs/core"]
      ) {
        content.compilerOptions.paths["@supermousejs/core"] = [
          "../core/src/index.ts",
        ];
        changes.push("added @supermousejs/core path alias");
      }

      for (const lib of usedLibs) {
        if (!content.compilerOptions.paths[lib.pkg]) {
          content.compilerOptions.paths[lib.pkg] = [lib.path];
          changes.push(`added ${lib.pkg} path alias`);
        }
      }

      return { content, changes };
    },
    dryRun
  );

  reportPatchResult("tsconfig.json", result);
}

// --- Patch: vite.config.ts ---

function patchViteConfig(configPath, pkgName, usedLibs) {
  const umdName = getUmdName(pkgName);
  const special = SPECIAL_CASES[pkgName];

  const requiredExternals = new Set();
  const requiredGlobals = {};

  if (pkgName !== "core") {
    requiredExternals.add("@supermousejs/core");
    requiredGlobals["@supermousejs/core"] = "SupermouseCore";
  }
  for (const lib of usedLibs) {
    requiredExternals.add(lib.pkg);
    requiredGlobals[lib.pkg] = lib.global;
  }
  if (special) {
    special.extraExternals.forEach((e) => requiredExternals.add(e));
    Object.assign(requiredGlobals, special.extraGlobals);
  }

  // Create if missing
  if (!fs.existsSync(configPath)) {
    const extArray = [...requiredExternals].map((e) => `'${e}'`).join(", ");
    const globObj = Object.entries(requiredGlobals)
      .map(([k, v]) => `        '${k}': '${v}'`)
      .join(",\n");

    const template = `\
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export default defineConfig({
  build: {
    lib: {
      entry:    path.resolve(__dirname, 'src/index.ts'),
      name:     '${umdName}',
      fileName: (format) => format === 'es' ? 'index.mjs' : 'index.umd.js',
    },
    rollupOptions: {
      external: [${extArray}],
      output: {
        globals: {
${globObj}
        },
      },
    },
  },
  plugins: [dts({ rollupTypes: true })],
});
`;
    if (!dryRun) fs.writeFileSync(configPath, template);
    console.log("   [+] created vite.config.ts");
    return;
  }

  // Patch existing
  let content = fs.readFileSync(configPath, "utf-8");
  let modified = false;
  const changes = [];

  // Fix UMD name
  const nameMatch = content.match(/name:\s*(['"`])([^'"`]+)\1/);
  if (nameMatch && nameMatch[2] !== umdName) {
    content = content.replace(/name:\s*(['"`])[^'"`]+\1/, `name: '${umdName}'`);
    modified = true;
    changes.push(`updated UMD name → "${umdName}"`);
  }

  // Fix fileName strategy
  const desiredFileName = `(format) => format === 'es' ? 'index.mjs' : 'index.umd.js'`;
  const fileNameMatch = content.match(/(fileName:\s*)(\([^)]*\)\s*=>[^\n,]+)/);
  if (fileNameMatch && !fileNameMatch[2].includes("=== 'es'")) {
    content = content.replace(
      /(fileName:\s*)(\([^)]*\)\s*=>[^\n,]+)/,
      `$1${desiredFileName}`
    );
    modified = true;
    changes.push("updated fileName strategy");
  }

  // Fix / add globals
  for (const [k, v] of Object.entries(requiredGlobals)) {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const keyRegex = new RegExp(
      `(['"\`])${escaped}\\1\\s*:\\s*(['"\`])([^'"]+)\\2`
    );
    const match = content.match(keyRegex);
    if (match) {
      if (match[3] !== v) {
        content = content.replace(keyRegex, `'${k}': '${v}'`);
        modified = true;
        changes.push(`fixed global for ${k}`);
      }
    } else if (content.includes("globals:")) {
      content = content.replace(
        /(globals:\s*\{)([\s\S]*?)(\})/,
        `$1\n        '${k}': '${v}',$2$3`
      );
      modified = true;
      changes.push(`added global for ${k}`);
    }
  }

  if (modified) {
    if (!dryRun) fs.writeFileSync(configPath, content);
    console.log("   [✓] patched vite.config.ts");
    changes.forEach((c) => console.log(`       ${c}`));
  } else {
    console.log("   [-] vite.config.ts unchanged");
  }
}

// --- Helpers ---

function reportPatchResult(label, result) {
  if (result.error) {
    console.log(`   [!] error patching ${label}: ${result.error}`);
  } else if (result.modified && result.changes?.length > 0) {
    console.log(`   [✓] patched ${label}`);
    result.changes.forEach((c) => console.log(`       ${c}`));
  } else {
    console.log(`   [-] ${label} already correct`);
  }
}

function scanForImports(srcDir) {
  return utilScanForImports(srcDir, SHARED_LIBS);
}

// --- Package selection ---

async function getPackagesToSync() {
  const available = fs
    .readdirSync(packagesDir)
    .filter((p) => {
      const full = path.join(packagesDir, p);
      return fs.statSync(full).isDirectory() && !EXCLUDED_PACKAGES.includes(p);
    })
    .sort();

  if (selectedPackages) {
    const valid = selectedPackages.filter((p) => available.includes(p));
    if (valid.length === 0) {
      console.error("[x] no valid packages matched --packages filter");
      process.exit(1);
    }
    return valid;
  }

  // --all or -y: skip prompt
  if (syncAll || nonInteractive) return available;

  // Interactive
  console.log("\nselect packages to sync:");
  console.log("  (a) all packages");
  available.forEach((p, i) => console.log(`  (${i + 1}) ${p}`));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\nenter choice (e.g. "a" or "1 3"): ', (answer) => {
      rl.close();
      const choice = answer.trim().toLowerCase();

      if (choice === "a" || choice === "") {
        resolve(available);
        return;
      }

      const indices = choice
        .split(/[,\s]+/)
        .map(Number)
        .filter((n) => !Number.isNaN(n));
      const selected = indices.map((i) => available[i - 1]).filter(Boolean);

      if (selected.length === 0) {
        console.log("[x] no valid selection. aborting.");
        process.exit(0);
      }
      resolve(selected);
    });
  });
}

// --- Run ---

async function run() {
  console.log(`\n${dryRun ? "[dry-run] " : ""}🩺 supermouse config sync\n`);

  if (!fs.existsSync(packagesDir)) {
    console.error("[x] packages directory not found");
    process.exit(1);
  }

  const packages = await getPackagesToSync();
  console.log(
    `\nsyncing ${packages.length} package${
      packages.length === 1 ? "" : "s"
    }...\n`
  );

  for (const pkgName of packages) {
    const pkgPath = path.join(packagesDir, pkgName);
    const usedLibs = scanForImports(path.join(pkgPath, "src"));

    console.log(`📦 @supermousejs/${pkgName}`);
    patchPackageJson(path.join(pkgPath, "package.json"), pkgName, usedLibs);
    patchTsConfig(path.join(pkgPath, "tsconfig.json"), pkgName, usedLibs);
    patchViteConfig(path.join(pkgPath, "vite.config.ts"), pkgName, usedLibs);
    console.log("");
  }

  if (dryRun) {
    console.log("[ok] dry-run complete. no files modified.\n");
    console.log("   run without --dry-run to apply:");
    console.log("   pnpm sync\n");
  } else {
    console.log(
      "[ok] sync complete. run 'pnpm install' to refresh workspace links.\n"
    );
  }
}

// --- Help ---

function showHelp() {
  console.log(`
🩺 supermouse config sync

usage: pnpm sync [options]

options:
  --dry-run                preview changes without modifying files
  --all                    sync all packages (non-interactive)
  --non-interactive, -y    skip confirmation prompts
  --packages=<names>       sync specific packages (comma-separated)
  --help, -h               show this message

examples:
  pnpm sync
  pnpm sync --dry-run
  pnpm sync --all --dry-run
  pnpm sync --packages=dot,ring
  pnpm sync --packages=dot,ring --dry-run
`);
}

if (args.includes("--help") || args.includes("-h")) {
  showHelp();
  process.exit(0);
}

run().catch((err) => {
  console.error("[x] error:", err.message);
  process.exit(1);
});
