/**
 * build-data.js
 *
 * Non-destructive documentation data generator.
 * Reads packages/ * /meta.json and outputs docs/app/data/generated-plugins.json.
 * Does NOT touch package.json, does NOT overwrite README files, and does NOT alter workspace packages.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const packagesDir = path.join(rootDir, "packages");
const outputFile = path.join(rootDir, "docs", "app", "data", "generated-plugins.json");

if (!fs.existsSync(packagesDir)) {
  console.error(`[build-data] Error: packages directory not found at ${packagesDir}`);
  process.exit(1);
}

const packageEntries = fs
  .readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
  .map((entry) => entry.name)
  .filter((name) => fs.existsSync(path.join(packagesDir, name, "meta.json")));

const pluginList = packageEntries
  .flatMap((name) => {
    const metaPath = path.join(packagesDir, name, "meta.json");
    const pkgJsonPath = path.join(packagesDir, name, "package.json");

    let metaContent;
    let pkgJson = {};

    try {
      metaContent = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    } catch (err) {
      console.warn(`[build-data] Warning: Failed to parse ${metaPath}:`, err.message);
      return [];
    }

    if (fs.existsSync(pkgJsonPath)) {
      try {
        pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
      } catch (err) {
        console.warn(`[build-data] Warning: Failed to parse ${pkgJsonPath}:`, err.message);
      }
    }

    const metaArray = Array.isArray(metaContent) ? metaContent : [metaContent];

    return metaArray.map((metaData) => ({
      ...metaData,
      version: metaData.version || pkgJson.version || "0.0.0",
      license: pkgJson.license || "MIT",
      installCommand: `pnpm install ${pkgJson.name || `@supermousejs/${name}`}`,
      importSnippet: `import { ${metaData.name} } from '${pkgJson.name || `@supermousejs/${name}`}'`,
      hasDetailedDocs: true
    }));
  })
  .sort((a, b) => a.id.localeCompare(b.id));

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(pluginList, null, 2) + "\n", "utf-8");

console.log(`[build-data] Successfully compiled metadata for ${pluginList.length} plugins to docs/app/data/generated-plugins.json`);
