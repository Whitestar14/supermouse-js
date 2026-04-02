/**
 * Remove plugin command - Permanently deletes a plugin package
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { FileOps } from "../core/file-ops.js";

export async function handle({ verbose, dryRun, autoYes, args }, rootDir, logger) {
  logger.header("Remove Plugin");

  // Get plugin name
  let pluginName = args[0];

  if (!pluginName) {
    logger.error("Plugin name is required");
    logger.info("Usage: remove <plugin-name>");
    process.exit(1);
  }

  pluginName = pluginName.trim().toLowerCase();
  const pluginDir = path.join(rootDir, "packages", pluginName);

  // Validate plugin exists
  if (!fs.existsSync(pluginDir)) {
    logger.error(`Plugin not found: ${pluginName}`);
    process.exit(1);
  }

  logger.section("Deletion Target");
  logger.info(`Plugin: ${pluginName}`);
  logger.info(`Location: ${path.relative(process.cwd(), pluginDir)}`);

  // Get confirmation if not auto-yes
  if (!autoYes) {
    logger.warn("This operation cannot be undone!");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question(
        `\n  Delete @supermousejs/${pluginName} and remove from apps? (y/N) `,
        resolve
      );
    });
    rl.close();

    if (answer.toLowerCase() !== "y") {
      logger.warn("Cancelled.");
      process.exit(0);
    }
  }

  if (dryRun) {
    logger.warn("DRY RUN - No files will be deleted");
    logger.section("Would Remove");
    logger.info(`- ${pluginDir}`);
    logger.info("- References from playground/package.json");
    logger.info("- References from docs/package.json");
    return;
  }

  logger.section("Removing");

  try {
    // Remove from playground
    unlinkFromApp(path.join(rootDir, "playground"), pluginName, logger);

    // Remove from docs
    unlinkFromApp(path.join(rootDir, "docs"), pluginName, logger);

    // Delete plugin directory
    fs.rmSync(pluginDir, { recursive: true, force: true });
    logger.success(`Deleted packages/${pluginName}`);

    logger.box("success", `✓ Plugin removed: @supermousejs/${pluginName}`,
      `Run 'pnpm install' to update lockfile`);
  } catch (error) {
    logger.error("Failed to remove plugin:", error.message);
    if (verbose) logger.debug(error.stack);
    process.exit(1);
  }
}

function unlinkFromApp(appDir, pluginName, logger) {
  if (!fs.existsSync(appDir)) {
    return;
  }

  const pkgPath = path.join(appDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = FileOps.readJSON(pkgPath);
      const depKey = `@supermousejs/${pluginName}`;

      if (pkg.dependencies?.[depKey]) {
        delete pkg.dependencies[depKey];
        FileOps.writeJSON(pkgPath, pkg);
        logger.info(`✓ Removed from ${path.basename(appDir)}/package.json`);
      }
    } catch (error) {
      logger.warn(`Could not update ${path.basename(appDir)}/package.json`);
    }
  }

  const vitePath = path.join(appDir, "vite.config.ts");
  if (fs.existsSync(vitePath)) {
    const content = fs.readFileSync(vitePath, "utf-8");
    if (content.includes(`@supermousejs/${pluginName}`)) {
      logger.warn(`⚠ Manual step: Remove @supermousejs/${pluginName} from ${path.basename(appDir)}/vite.config.ts`);
    }
  }
}
