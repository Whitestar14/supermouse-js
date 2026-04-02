/**
 * Sync configuration command - Synchronizes config files across packages
 */

import fs from "fs";
import path from "path";
import { FileOps } from "../core/file-ops.js";
import { getUmdName, SPECIAL_CASES, EXCLUDED_PACKAGES } from "../config.js";

export async function handle({ verbose, dryRun, autoYes, args }, rootDir, logger) {
  logger.header("Synchronize Configuration Files");

  const packagesDir = path.join(rootDir, "packages");
  const changes = [];

  if (!fs.existsSync(packagesDir)) {
    logger.error("Packages directory not found");
    process.exit(1);
  }

  logger.section("Scanning Packages");

  const packages = fs
    .readdirSync(packagesDir)
    .filter((name) => {
      const fullPath = path.join(packagesDir, name);
      return (
        fs.statSync(fullPath).isDirectory() &&
        !name.startsWith(".") &&
        !EXCLUDED_PACKAGES.includes(name)
      );
    });

  logger.info(`Found ${packages.length} packages`);

  try {
    // Sync each package
    for (const pkgName of packages) {
      const pkgPath = path.join(packagesDir, pkgName);
      const pkgJsonPath = path.join(pkgPath, "package.json");

      if (!fs.existsSync(pkgJsonPath)) continue;

      const pkgChanges = syncPackage(pkgPath, pkgName, rootDir, logger);
      changes.push(...pkgChanges);
    }

    if (dryRun) {
      logger.warn("DRY RUN - No changes will be applied");
      logger.section("Preview of Changes");
      changes.forEach((change) => logger.info(change));
      return;
    }

    logger.section(`Applying Changes (${changes.length} updates)`);
    changes.forEach((change) => logger.info(change));

    if (changes.length > 0) {
      logger.box("success", `✓ Synchronized ${changes.length} configuration updates`);
    } else {
      logger.info("All configurations up to date");
    }
  } catch (error) {
    logger.error("Sync failed:", error.message);
    if (verbose) logger.debug(error.stack);
    process.exit(1);
  }
}

function syncPackage(pkgPath, pkgName, rootDir, logger) {
  const changes = [];
  const pkgJsonPath = path.join(pkgPath, "package.json");
  const viteConfigPath = path.join(pkgPath, "vite.config.ts");

  try {
    const pkg = FileOps.readJSON(pkgJsonPath);

    // Update build script
    if (pkg.scripts?.build !== "vite build") {
      pkg.scripts ??= {};
      pkg.scripts.build = "vite build";
      changes.push(`  → ${pkgName}: Updated build script`);
    }

    // Update entry points
    const entries = {
      main: "dist/index.umd.js",
      module: "dist/index.mjs",
      types: "dist/index.d.ts"
    };

    for (const [field, value] of Object.entries(entries)) {
      if (pkg[field] !== value) {
        pkg[field] = value;
        changes.push(`  → ${pkgName}: Set ${field} → ${value}`);
      }
    }

    // Update exports
    if (!pkg.exports) {
      pkg.exports = {
        ".": {
          types: "./dist/index.d.ts",
          import: "./dist/index.mjs",
          require: "./dist/index.umd.js"
        }
      };
      changes.push(`  → ${pkgName}: Created exports field`);
    }

    // Update publishConfig
    if (pkg.name?.startsWith("@supermousejs/")) {
      pkg.publishConfig ??= {};
      if (pkg.publishConfig.access !== "public") {
        pkg.publishConfig.access = "public";
        changes.push(`  → ${pkgName}: Set publishConfig.access → public`);
      }
    }

    // Ensure dep sections exist
    pkg.peerDependencies ??= {};
    pkg.devDependencies ??= {};
    pkg.dependencies ??= {};

    // Save changes
    if (changes.length > 0) {
      FileOps.writeJSON(pkgJsonPath, pkg);
    }
  } catch (error) {
    logger.warn(`Could not sync ${pkgName}:`, error.message);
  }

  return changes;
}
