/**
 * Generate documentation data command
 */

import fs from "fs";
import path from "path";
import { FileOps } from "../core/file-ops.js";

export async function handle({ verbose, dryRun, autoYes, args }, rootDir, logger) {
  logger.header("Generate Documentation Data");

  const packagesDir = path.join(rootDir, "packages");
  const outputFile = path.join(rootDir, "docs", "src", "data", "generated-plugins.json");

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
        const metaPath = path.join(packagesDir, name, "meta.json");
        return fs.existsSync(metaPath);
      });

    logger.info(`Found ${packages.length} plugins with metadata`);

    if (dryRun) {
      logger.warn("DRY RUN - No files will be written");
      logger.section("Would Generate");
      packages.forEach((pkg) => logger.info(`- ${pkg}`));
      return;
    }

    // Generate JSON data file
    const pluginData = generatePluginData(packagesDir, packages, logger);

    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    FileOps.mkdir(outputDir);

    // Write file
    FileOps.writeFile(outputFile, pluginData);
    logger.success(`Generated ${packages.length} plugin entries`);

    logger.box("success", `✓ Documentation data generated`, `File: ${outputFile}`);
  } catch (error) {
    logger.error("Failed to generate docs:", error.message);
    if (verbose) logger.debug(error.stack);
    process.exit(1);
  }
}

function generatePluginData(packagesDir, packages, logger) {
  const pluginList = packages
    .flatMap((name) => {
      const metaPath = path.join(packagesDir, name, "meta.json");
      const metaContent = FileOps.readJSON(metaPath);
      const metaArray = Array.isArray(metaContent) ? metaContent : [metaContent];

      const pkgJson = FileOps.readJSON(path.join(packagesDir, name, "package.json"));

      return metaArray.map((metaData) => ({
        ...metaData,
        version: metaData.version || pkgJson.version || "2.1.1",
        installCommand: `pnpm install ${pkgJson.name}`,
        importSnippet: `import { ${metaData.name} } from '${pkgJson.name}'`,
        hasDetailedDocs: true
      }));
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  return JSON.stringify(pluginList, null, 2);
}
