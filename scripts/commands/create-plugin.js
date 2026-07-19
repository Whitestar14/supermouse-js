/**
 * Create plugin command - Scaffolds a new supermouse plugin
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { spawn } from "child_process";
import { scaffoldPlugin, normalizePluginName } from "../core/plugin-scaffold.js";

export async function handle({ verbose, dryRun, autoYes, args }, rootDir, logger) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

  logger.header("Create New Plugin");

  // Get plugin name from args or prompt
  let pluginName = args[0];

  if (!pluginName) {
    pluginName = await question(`  Plugin name (kebab-case, e.g. "cool-effect"): `);
  }

  if (!pluginName || !pluginName.trim()) {
    logger.error("Plugin name is required");
    rl.close();
    process.exit(1);
  }

  pluginName = normalizePluginName(pluginName);

  // Validate name format
  if (!/^[a-z][a-z0-9-]*$/.test(pluginName)) {
    logger.error('Invalid plugin name. Must be kebab-case (e.g. "cool-effect")');
    rl.close();
    process.exit(1);
  }

  const pascalName = pluginName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const pluginDir = path.join(rootDir, "packages", pluginName);

  // Check if plugin already exists
  if (fs.existsSync(pluginDir)) {
    if (!autoYes) {
      const answer = await question(
        `\n  ⚠ Plugin already exists. Overwrite configs (keep src/)? (y/N) `
      );
      if (answer.toLowerCase() !== "y") {
        logger.warn("Cancelled. Use 'sync' for non-destructive updates.");
        rl.close();
        process.exit(0);
      }
    }
  }

  rl.close();

  logger.section("Scaffolding");
  logger.info(`Plugin: ${pluginName} (${pascalName})`);
  logger.info(`Location: ${path.relative(process.cwd(), pluginDir)}`);

  if (dryRun) {
    logger.warn("DRY RUN - No files will be created");
    return;
  }

  try {
    scaffoldPlugin(pluginDir, pluginName, rootDir, logger);

    // Run sync-configs for this package
    logger.section("Syncing configurations");
    await runSync(`--packages=${pluginName}`, "--non-interactive");

    logger.box(
      "success",
      `✓ Plugin created: @supermousejs/${pluginName}`,
      `Next: Edit packages/${pluginName}/src/index.ts`
    );
  } catch (error) {
    logger.error("Failed to create plugin:", error.message);
    if (verbose) logger.debug(error.stack);
    process.exit(1);
  }
}

function runSync(...args) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../sync-configs.js"
    );
    const child = spawn("node", [scriptPath, ...args], {
      stdio: "inherit",
      cwd: path.dirname(scriptPath)
    });
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`sync-configs exited ${code}`))
    );
    child.on("error", reject);
  });
}
