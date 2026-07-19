import fs from "fs";
import path from "path";
import { FileOps } from "./file-ops.js";
import { toPascalCase } from "../config.js";

export function normalizePluginName(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase();
}

export function buildPluginPackageJson(pluginName) {
  return {
    name: `@supermousejs/${pluginName}`,
    version: "2.1.1",
    private: false,
    description: `Supermouse ${toPascalCase(pluginName)} plugin`
  };
}

export function buildPluginTsconfig() {
  return {
    extends: "../../tsconfig.plugin.json",
    include: ["src"]
  };
}

export function buildPluginIndexTemplate(pluginName, pascalName) {
  return `import type { SupermousePlugin } from '@supermousejs/core';
import { dom } from '@supermousejs/utils';

export interface ${pascalName}Options {
  // Add options here
}

export const ${pascalName} = (options: ${pascalName}Options = {}): SupermousePlugin => {
  return {
    name: '${pluginName}',

    // priority: 0, // 0 or positive for Visual plugins, < 0 for Logic plugins (e.g. -10)

    install(instance) {
      // Setup logic here
      // e.g., create DOM elements and append to instance.container
    },

    update(instance, dt) {
      // Per-frame logic here
      // Logic plugins: mutate instance.state.target
      // Visual plugins: read instance.state.smooth and update DOM via dom.setTransform / dom.setStyle
    },

    destroy(instance) {
      // Cleanup DOM elements here
    }
  };
};
`;
}

export function scaffoldPlugin(pluginDir, pluginName, rootDir, logger) {
  const pascalName = toPascalCase(pluginName);
  const srcDir = path.join(pluginDir, "src");
  const packageJsonPath = path.join(pluginDir, "package.json");
  const tsconfigPath = path.join(pluginDir, "tsconfig.json");
  const indexPath = path.join(srcDir, "index.ts");

  fs.mkdirSync(srcDir, { recursive: true });
  logger.success("Created directory structure");

  FileOps.writeJSON(packageJsonPath, buildPluginPackageJson(pluginName));
  logger.info("✓ Created package.json");

  FileOps.writeJSON(tsconfigPath, buildPluginTsconfig());
  logger.info("✓ Created tsconfig.json (extends plugin template)");

  if (!fs.existsSync(indexPath)) {
    FileOps.writeFile(indexPath, buildPluginIndexTemplate(pluginName, pascalName));
    logger.info("✓ Created src/index.ts");
  } else {
    logger.info("ⓘ Kept existing src/index.ts");
  }

  return {
    pluginDir,
    srcDir,
    packageJsonPath,
    tsconfigPath,
    indexPath,
    pascalName
  };
}
