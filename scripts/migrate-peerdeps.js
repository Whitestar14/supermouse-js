import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// --- Configuration ---
const TARGET_PACKAGE = '@supermousejs/core';

// 1. Get the directory of THIS script (supermouse-js/scripts)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 2. Point to the actual ROOT (supermouse-js)
const ROOT_DIR = path.resolve(__dirname, '..'); 

// 3. Point to the actual PACKAGES directory (supermouse-js/packages)
const PACKAGES_DIR = path.resolve(ROOT_DIR, 'packages');

// --- Main Logic ---

// Verify ROOT and PACKAGES exist
if (!fs.existsSync(path.join(ROOT_DIR, 'package.json'))) {
  console.error(`❌ Error: Could not find root package.json at ${ROOT_DIR}`);
  process.exit(1);
}

function healPackageJson(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    let changed = false;

    // We only care about packages that have @supermousejs/core as a direct dependency
    if (data.dependencies && data.dependencies[TARGET_PACKAGE]) {
      const version = data.dependencies[TARGET_PACKAGE];

      console.log(`\n🔍 Healing ${data.name}...`);

      // 1. Add to peerDependencies
      data.peerDependencies = data.peerDependencies || {};
      data.peerDependencies[TARGET_PACKAGE] = version;
      console.log(`   - Added to peerDependencies`);

      // 2. Add to devDependencies (keeps workspace/docs working)
      data.devDependencies = data.devDependencies || {};
      data.devDependencies[TARGET_PACKAGE] = version;
      console.log(`   - Added to devDependencies`);

      // 3. Remove from dependencies
      delete data.dependencies[TARGET_PACKAGE];
      console.log(`   - Removed from dependencies`);

      // Cleanup empty dependencies object
      if (Object.keys(data.dependencies).length === 0) {
        delete data.dependencies;
      }

      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    }
  } catch (error) {
    console.error(`❌ Failed to process ${filePath}:`, error.message);
  }
}

function scanDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Don't go into node_modules
      if (file !== 'node_modules') scanDirectory(fullPath);
    } else if (file === 'package.json') {
      healPackageJson(fullPath);
    }
  }
}

console.log(`🚀 Target: ${TARGET_PACKAGE}`);
console.log(`📂 Root: ${ROOT_DIR}`);
console.log(`📦 Scanning: ${PACKAGES_DIR}\n`);

if (fs.existsSync(PACKAGES_DIR)) {
  scanDirectory(PACKAGES_DIR);
  console.log('\n✨ Migration complete. Now run "pnpm install" to sync.');
} else {
  console.error(`❌ Could not find directory: ${PACKAGES_DIR}`);
}