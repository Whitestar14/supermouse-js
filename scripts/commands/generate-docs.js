/**
 * Generate documentation data command
 */

import fs from "fs";
import path from "path";
import { FileOps } from "../core/file-ops.js";

export async function handle({ verbose, dryRun, autoYes, args }, rootDir, logger) {
  logger.header("Generate Documentation Data");

  const packagesDir = path.join(rootDir, "packages");
  const outputFile = path.join(rootDir, "docs", "src", "data", "plugin-data.ts");

  logger.section("Scanning Packages");

  if (!fs.existsSync(packagesDir)) {
    logger.error("Packages directory not found");
    process.exit(1);
  }

  try {
    const packages = fs
      .readdirSync(packagesDir)
      .filter((name) => {
        const fullPath = path.join(packagesDir, name);
        return fs.statSync(fullPath).isDirectory() && !name.startsWith(".");
      })
      .filter((name) => {
        // Skip non-plugin packages
        const pkgJson = path.join(packagesDir, name, "package.json");
        if (!fs.existsSync(pkgJson)) return false;
        const pkg = FileOps.readJSON(pkgJson);
        return pkg.name?.startsWith("@supermousejs/");
      });

    logger.info(`Found ${packages.length} plugins`);

    if (dryRun) {
      logger.warn("DRY RUN - No files will be written");
      logger.section("Would Generate");
      packages.forEach((pkg) => logger.info(`- ${pkg}`));
      return;
    }

    // Generate TypeScript data file
    const pluginData = generatePluginData(packagesDir, packages, logger);

    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    FileOps.mkdir(outputDir);

    // Write file
    FileOps.writeFile(outputFile, pluginData);
    logger.success(`Generated ${packages.length} plugin entries`);

    logger.box("success", `✓ Documentation data generated`,
      `File: docs/src/data/plugin-data.ts`);
  } catch (error) {
    logger.error("Failed to generate docs:", error.message);
    if (verbose) logger.debug(error.stack);
    process.exit(1);
  }
}

function generatePluginData(packagesDir, packages, logger) {
  const pluginList = packages
    .map((name) => {
      const pkgJson = FileOps.readJSON(path.join(packagesDir, name, "package.json"));
      const readmePath = path.join(packagesDir, name, "README.md");
      const hasReadme = fs.existsSync(readmePath);

      return {
        id: name,
        name: pkgJson.name,
        version: pkgJson.version || "2.1.1",
        description: pkgJson.description || "Supermouse plugin",
        hasReadme
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const ts = `/**
 * Auto-generated plugin metadata file
 * Do not edit manually - run: pnpm generate-docs
 */

export interface PluginMeta {
  id: string;
  name: string;
  version: string;
  description: string;
  hasReadme: boolean;
}

export const PLUGINS: PluginMeta[] = ${JSON.stringify(pluginList, null, 2)};

export const LABS_IDS = [
  "labs",
  "zoetrope"
];
`;

  return ts;
}
