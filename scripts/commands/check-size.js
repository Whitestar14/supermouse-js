/**
 * Check bundle size command - Measures and reports package sizes
 */

import fs from "fs";
import path from "path";
import zlib from "zlib";
import { execSync } from "child_process";

const WARNING_LIMIT = 5000; // bytes
const ERROR_LIMIT = 10000;  // bytes

export async function handle({ verbose, dryRun, autoYes, args }, rootDir, logger) {
  logger.header("Bundle Size Analysis");

  const pkgName = args[0] || "@supermousejs/core";
  const pkgDir = findPackageDir(rootDir, pkgName);

  if (!fs.existsSync(pkgDir)) {
    logger.error(`Package not found: ${pkgName}`);
    process.exit(1);
  }

  const buildFile = path.join(pkgDir, "dist", "index.mjs");

  logger.section(`Measuring ${pkgName}`);

  if (!dryRun) {
    try {
      logger.info("Building package...");
      execSync(`pnpm --filter "${pkgName}" build`, { stdio: "pipe" });
      logger.success("Build complete");
    } catch (error) {
      logger.error("Build failed:", error.message);
      process.exit(1);
    }
  }

  if (!fs.existsSync(buildFile)) {
    logger.error(`Build artifact not found: ${buildFile}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(buildFile);
  const originalSize = buffer.length;

  // Get gzipped size
  zlib.gzip(buffer, (err, gzippedBuffer) => {
    if (err) {
      logger.error("Compression failed:", err.message);
      process.exit(1);
    }

    const gzipSize = gzippedBuffer.length;
    const ratio = ((gzipSize / originalSize) * 100).toFixed(1);

    logger.section("Results");

    // Format output
    const table = [
      ["Metric", "Size"],
      ["────────────────", "─────────────"],
      ["Original", formatBytes(originalSize)],
      ["Gzipped", formatBytes(gzipSize)],
      ["Ratio", `${ratio}%`]
    ];

    table.forEach(row => {
      console.log(`  ${row[0].padEnd(18)} ${row[1]}`);
    });

    // Status
    logger.newline();
    if (gzipSize > ERROR_LIMIT) {
      logger.error(`CRITICAL: Bundle exceeds ${formatBytes(ERROR_LIMIT)}`);
      process.exit(1);
    } else if (gzipSize > WARNING_LIMIT) {
      logger.warn(`WARNING: Bundle approaching size limit (${formatBytes(WARNING_LIMIT)})`);
    } else {
      logger.success(`Bundle size is healthy`);
    }
  });
}

function findPackageDir(rootDir, pkgName) {
  // Try as scoped package name
  if (pkgName.startsWith("@supermousejs/")) {
    const shortName = pkgName.split("/")[1];
    return path.join(rootDir, "packages", shortName);
  }

  // Try as direct path
  return path.join(rootDir, "packages", pkgName);
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
