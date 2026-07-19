/**
 * Interactive plugin manager command
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { FileOps } from "../core/file-ops.js";
import { scaffoldPlugin, normalizePluginName } from "../core/plugin-scaffold.js";
import { syncPackageManifest } from "../core/package-policy.js";

export async function handle({ verbose, dryRun, autoYes, args }, rootDir, logger) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  try {
    await mainMenu(rl, question, rootDir, logger);
  } finally {
    rl.close();
  }
}

async function mainMenu(rl, question, rootDir, logger) {
  logger.clear();
  logger.header("Plugin Manager");

  const packagesDir = path.join(rootDir, "packages");
  const plugins = fs
    .readdirSync(packagesDir)
    .filter((name) => {
      const fullPath = path.join(packagesDir, name);
      if (!fs.statSync(fullPath).isDirectory()) return false;
      const pkgJson = path.join(fullPath, "package.json");
      return fs.existsSync(pkgJson);
    })
    .sort();

  logger.info(`\n📦 Found ${plugins.length} plugin${plugins.length !== 1 ? "s" : ""}:\n`);
  plugins.slice(0, 10).forEach((p) => console.log(`   • ${p}`));
  if (plugins.length > 10) {
    console.log(`   ... and ${plugins.length - 10} more`);
  }

  logger.newline();
  logger.section("Main Menu");
  console.log(`  1) ✨ Create new plugin`);
  console.log(`  2) 🗑️  Remove plugin`);
  console.log(`  3) 🔄 Synchronize configurations`);
  console.log(`  4) 📊 Check bundle sizes`);
  console.log(`  5) 🚪 Exit`);

  const choice = await question(`\n  Select option (1-5): `);

  switch (choice.trim()) {
    case "1":
      await createPluginInteractive(rl, question, rootDir, logger);
      await new Promise((r) => rl.question(`\n  Press ENTER to continue...`, r));
      return mainMenu(rl, question, rootDir, logger);

    case "2":
      await removePluginInteractive(rl, question, rootDir, logger, plugins);
      await new Promise((r) => rl.question(`\n  Press ENTER to continue...`, r));
      return mainMenu(rl, question, rootDir, logger);

    case "3":
      logger.info("\n (syncing configurations...)\n");
      // Simple sync - just update all package.jsons
      syncAll(path.join(rootDir, "packages"), logger);
      await new Promise((r) => rl.question(`\n  Press ENTER to continue...`, r));
      return mainMenu(rl, question, rootDir, logger);

    case "4":
      logger.info(`\n (checking bundle sizes...)\n`);
      logger.info("Run: pnpm check:size\n");
      await new Promise((r) => rl.question(`\n  Press ENTER to continue...`, r));
      return mainMenu(rl, question, rootDir, logger);

    case "5":
      logger.success("Goodbye!");
      return;

    default:
      return mainMenu(rl, question, rootDir, logger);
  }
}

async function createPluginInteractive(rl, question, rootDir, logger) {
  logger.clear();
  logger.header("Create New Plugin");

  const name = await question(
    `\n  Plugin name (kebab-case, e.g. "my-effect"): `
  );

  const normalizedName = normalizePluginName(name);

  if (!normalizedName) {
    logger.warn("Cancelled.");
    return;
  }

  if (!/^[a-z][a-z0-9-]*$/.test(normalizedName)) {
    logger.error("Invalid name format. Must be kebab-case.");
    return;
  }

  const pluginDir = path.join(rootDir, "packages", normalizedName);
  if (fs.existsSync(pluginDir)) {
    logger.warn(`Plugin already exists: ${name}`);
    return;
  }

  logger.info(`\nCreating @supermousejs/${normalizedName}...`);

  try {
    scaffoldPlugin(pluginDir, normalizedName, rootDir, logger);
    logger.success(`Created @supermousejs/${normalizedName}`);
  } catch (error) {
    logger.error("Failed to create plugin:", error.message);
  }
}

async function removePluginInteractive(
  rl,
  question,
  rootDir,
  logger,
  plugins
) {
  logger.clear();
  logger.header("Remove Plugin");

  logger.info(`\nAvailable plugins:\n`);
  plugins.forEach((p, i) => console.log(`  ${i + 1}) ${p}`));

  const choice = await question(`\n  Select plugin (1-${plugins.length}): `);
  const idx = parseInt(choice) - 1;

  if (idx < 0 || idx >= plugins.length) {
    logger.warn("Invalid selection.");
    return;
  }

  const pluginName = plugins[idx];
  const confirm = await question(
    `\n  ⚠ Delete @supermousejs/${pluginName}? (y/N) `
  );

  if (confirm.toLowerCase() !== "y") {
    logger.warn("Cancelled.");
    return;
  }

  try {
    const pluginDir = path.join(rootDir, "packages", pluginName);

    // Unlink from apps
    unlinkApp(path.join(rootDir, "playground"), pluginName);
    unlinkApp(path.join(rootDir, "docs"), pluginName);

    // Delete
    fs.rmSync(pluginDir, { recursive: true, force: true });
    logger.success(`Deleted @supermousejs/${pluginName}`);
  } catch (error) {
    logger.error("Failed to remove plugin:", error.message);
  }
}

function syncAll(packagesDir, logger) {
  const packages = fs
    .readdirSync(packagesDir)
    .filter((name) => fs.statSync(path.join(packagesDir, name)).isDirectory());

  let count = 0;
  packages.forEach((pkgName) => {
    const pkgJsonPath = path.join(packagesDir, pkgName, "package.json");
    if (!fs.existsSync(pkgJsonPath)) return;

    const pkg = FileOps.readJSON(pkgJsonPath);
    const { changes } = syncPackageManifest(pkg, pkgName);

    if (changes.length > 0) {
      FileOps.writeJSON(pkgJsonPath, pkg);
      count++;
    }
  });

  logger.info(`✓ Synchronized ${count} packages`);
}

function unlinkApp(appDir, pluginName) {
  if (!fs.existsSync(appDir)) return;

  const pkgPath = path.join(appDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = FileOps.readJSON(pkgPath);
    const key = `@supermousejs/${pluginName}`;
    if (pkg.dependencies?.[key]) {
      delete pkg.dependencies[key];
      FileOps.writeJSON(pkgPath, pkg);
    }
  }
}
