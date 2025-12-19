
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---
const TARGET_VERSION = "2.0.0";
const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');
const packagesDir = path.join(rootDir, 'packages');

const EXCLUDED = ['.DS_Store']; 

// --- Templates ---

const getTsConfig = (isCore) => ({
  "extends": "../../tsconfig.base.json",
  "include": ["src"],
  "compilerOptions": {
    "outDir": "dist",
    "baseUrl": ".",
    "paths": isCore ? undefined : {
      "@supermousejs/core": ["../core/src/index.ts"]
    }
  }
});

const getViteConfig = (pkgName, isCore) => {
  const pascalName = pkgName.charAt(0).toUpperCase() + pkgName.slice(1);
  const name = isCore ? 'Core' : pascalName;
  
  return `
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: '${name}',
      fileName: (format) => \`index.\${format}.js\`,
    },
    rollupOptions: {
      external: ${isCore ? "[]" : "['@supermousejs/core']"},
      output: {
        globals: {
          '@supermousejs/core': 'SupermouseCore'
        }
      }
    }
  },
  plugins: [dts({ rollupTypes: true })]
});`.trim();
};

const updatePackageJson = (filePath, isCore) => {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  // 1. Sync Version
  content.version = TARGET_VERSION;
  
  // 2. Sync Standard Scripts
  content.scripts = {
    ...content.scripts,
    "build": "vite build"
  };

  // 3. Sync Dependencies
  if (!isCore) {
    content.dependencies = content.dependencies || {};
    // Ensure workspace protocol
    content.dependencies['@supermousejs/core'] = "workspace:*";
  }

  // 4. Sync Exports (Standardize entry points)
  content.main = "dist/index.umd.js";
  content.module = "dist/index.mjs";
  content.types = "dist/index.d.ts";

  return JSON.stringify(content, null, 2);
};

// --- Execution ---

async function run() {
  console.log(`\n🔄 Supermouse Config Sync (Target: v${TARGET_VERSION})\n`);

  if (!fs.existsSync(packagesDir)) {
    console.error('❌ packages directory not found.');
    process.exit(1);
  }

  const packages = fs.readdirSync(packagesDir);

  for (const pkgName of packages) {
    if (EXCLUDED.includes(pkgName)) continue;

    const pkgPath = path.join(packagesDir, pkgName);
    if (!fs.statSync(pkgPath).isDirectory()) continue;

    const isCore = pkgName === 'core';
    console.log(`>> Syncing @supermousejs/${pkgName}...`);

    // 1. Update tsconfig.json
    fs.writeFileSync(
      path.join(pkgPath, 'tsconfig.json'),
      JSON.stringify(getTsConfig(isCore), null, 2)
    );

    fs.writeFileSync(
      path.join(pkgPath, 'vite.config.ts'),
      getViteConfig(pkgName, isCore)
    );

    // 3. Update package.json
    const pkgJsonPath = path.join(pkgPath, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      const newPkgJson = updatePackageJson(pkgJsonPath, isCore);
      fs.writeFileSync(pkgJsonPath, newPkgJson);
    }
  }

  console.log(`\n✅ All plugins synced to v${TARGET_VERSION} with correct build paths.`);
  console.log(`   Run 'pnpm install' to refresh workspace links.`);
}

run();
