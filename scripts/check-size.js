
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');

// Configuration
const TARGET_PACKAGE = 'packages/core';
const BUILD_FILE = 'dist/index.mjs'; // We measure the ESM build
const WARNING_LIMIT = 5000; // 5kb warning limit

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function run() {
  console.log('⚖️  Measuring @supermousejs/core size...\n');

  const pkgDir = path.join(rootDir, TARGET_PACKAGE);
  const filePath = path.join(pkgDir, BUILD_FILE);

  // 1. Ensure fresh build
  try {
    console.log('   Running build...');
    execSync('pnpm --filter @supermousejs/core build', { stdio: 'ignore' });
  } catch (e) {
    console.error('❌ Build failed.');
    process.exit(1);
  }

  // 2. Read file
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Could not find build artifact at ${BUILD_FILE}`);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const originalSize = fileBuffer.length;

  // 3. Gzip
  zlib.gzip(fileBuffer, (err, buffer) => {
    if (err) {
      console.error('❌ Gzip failed:', err);
      process.exit(1);
    }

    const gzippedSize = buffer.length;
    const isOverLimit = gzippedSize > WARNING_LIMIT;
    const color = isOverLimit ? '\x1b[31m' : '\x1b[32m'; // Red or Green
    const reset = '\x1b[0m';

    console.log(`\n   ----------------------------------------`);
    console.log(`   📂  Original Size:  ${formatBytes(originalSize)}`);
    console.log(`   📦  ${color}Gzipped Size:   ${formatBytes(gzippedSize)}${reset}`);
    console.log(`   ----------------------------------------`);

    if (isOverLimit) {
      console.warn(`   ⚠️  Warning: Core exceeds ${formatBytes(WARNING_LIMIT)} budget!`);
    } else {
      console.log(`   ✅  Within budget.`);
    }
    console.log('');
  });
}

run();
