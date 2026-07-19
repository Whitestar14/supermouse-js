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

    generateReadmes(packagesDir, packages, logger);
    validateMetadataAgainstSource(packagesDir, packages, logger);

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

function generateReadmes(packagesDir, packages, logger) {
  packages.forEach((name) => {
    const metaPath = path.join(packagesDir, name, "meta.json");
    const metaContent = FileOps.readJSON(metaPath);
    const metaArray = Array.isArray(metaContent) ? metaContent : [metaContent];
    const pkgJson = FileOps.readJSON(path.join(packagesDir, name, "package.json"));
    const readmePath = path.join(packagesDir, name, "README.md");
    const content = renderPackageReadme(pkgJson, metaArray);
    FileOps.writeFile(readmePath, content);
    logger.info(`Generated README for ${pkgJson.name}`);
  });
}

function validateMetadataAgainstSource(packagesDir, packages, logger) {
  const interfaceMap = new Map();
  const ignored = new Set(["name", "isEnabled"]);

  packages.forEach((name) => {
    const srcDir = path.join(packagesDir, name, "src");
    if (!fs.existsSync(srcDir)) return;

    fs.readdirSync(srcDir)
      .filter((file) => file.endsWith(".ts"))
      .forEach((file) => {
        const filePath = path.join(srcDir, file);
        const text = fs.readFileSync(filePath, "utf8");
        const regex = /export interface\s+(\w+Options)\s*\{([\s\S]*?)\n\}/g;
        let match;

        while ((match = regex.exec(text))) {
          const props = [];
          for (const propMatch of match[2].matchAll(/\b([A-Za-z0-9_]+)\??:\s*[^;]+;/g)) {
            const propName = propMatch[1];
            if (!ignored.has(propName)) props.push(propName);
          }
          interfaceMap.set(match[1], props);
        }
      });
  });

  const drift = [];

  packages.forEach((name) => {
    const metaPath = path.join(packagesDir, name, "meta.json");
    const metaContent = FileOps.readJSON(metaPath);
    const metaArray = Array.isArray(metaContent) ? metaContent : [metaContent];

    metaArray.forEach((metaData) => {
      const expected = (metaData.options || [])
        .map((option) => option.name)
        .filter((field) => !ignored.has(field));
      const interfaceName = `${metaData.name.replace(/\s+/g, "")}Options`;
      const actual = interfaceMap.get(interfaceName) || [];
      const missing = expected.filter((field) => !actual.includes(field));
      const extra = actual.filter((field) => !expected.includes(field));

      if (missing.length || extra.length) {
        drift.push({
          packageName: name,
          pluginName: metaData.name,
          missing,
          extra
        });
      }
    });
  });

  if (drift.length > 0) {
    logger.warn("Metadata option drift detected against source interfaces:");
    drift.forEach(({ packageName, pluginName, missing, extra }) => {
      logger.warn(
        `- ${packageName}/${pluginName}: missing=${missing.join(",") || "-"} extra=${extra.join(",") || "-"}`
      );
    });
  } else {
    logger.info("Metadata option alignment validated against source interfaces");
  }
}

function renderPackageReadme(pkgJson, metaArray) {
  const packageName = pkgJson.name;
  const description =
    pkgJson.description || metaArray[0]?.description || "Documentation generated from metadata.";
  const sections = metaArray
    .map((metaData) => renderPluginSection(metaData, packageName))
    .join("\n\n");

  return `# ${packageName}

${description}

## Installation

\`\`\`bash
pnpm add ${packageName}
\`\`\`

${sections}

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.js.org) or [check out the repo](https://github.com/Whitestar14/supermouse-js).
`;
}

function renderPluginSection(metaData, packageName) {
  const options = Array.isArray(metaData.options) ? metaData.options : [];
  const optionTable = options.length
    ? [
        "| Name | Type | Default | Description |",
        "| --- | --- | --- | --- |",
        ...options.map((option) => {
          const defaultValue = option.default ?? "-";
          const description = option.description ?? "";
          return `| ${option.name} | ${option.type} | ${defaultValue} | ${description} |`;
        })
      ].join("\n")
    : "No explicit options are documented for this plugin.";

  const usageSnippet = renderUsageSnippet(metaData, packageName);
  const htmlExample = String(metaData.htmlExample || "").trim();

  return `## ${metaData.name || packageName}

${metaData.description || "Plugin documentation generated from metadata."}

### Usage

\`\`\`ts
${usageSnippet}
\`\`\`

${htmlExample ? `### HTML Example\n\n\`\`\`html\n${htmlExample}\n\`\`\`\n\n` : ""}### Options

${optionTable}`;
}

function renderUsageSnippet(metaData, packageName) {
  const rawCode = String(metaData.code || `app.use(${metaData.name || "Plugin"}());`);
  const pluginName = metaData.name || "Plugin";
  const packageImport = metaData.package || packageName;

  const lines = rawCode.split("\n").map((line) => line.trimEnd());
  const imports = [];
  const body = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^import\s/.test(trimmed)) {
      imports.push(trimmed);
      continue;
    }

    if (/^const\s+app\s*=\s*new\s+Supermouse\s*\(/.test(trimmed)) {
      body.push(trimmed);
      continue;
    }

    body.push(trimmed);
  }

  const hasSupermouseImport = imports.some(
    (line) => /Supermouse/.test(line) && /@supermousejs\/core/.test(line)
  );
  const hasPluginImport = imports.some(
    (line) => new RegExp("\\b" + pluginName + "\\b").test(line) && /from\s+['"]/.test(line)
  );

  if (!hasSupermouseImport) {
    imports.unshift('import { Supermouse } from "@supermousejs/core";');
  }

  if (!hasPluginImport) {
    imports.push(`import { ${pluginName} } from "${packageImport}";`);
  }

  const snippet = [...imports];
  if (!body.some((line) => /^const\s+app\s*=\s*new\s+Supermouse\s*\(/.test(line))) {
    snippet.push("const app = new Supermouse();");
  }

  snippet.push(...body.filter((line) => !/^const\s+app\s*=\s*new\s+Supermouse\s*\(/.test(line)));

  return snippet.join("\n").trim();
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
