
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');
const packagesDir = path.join(rootDir, 'packages');

// Packages to skip (legacy needs to stay as "Supermouse" for v1 compat)
const SKIP_LIST = ['legacy', 'legacy-wrapper'];

// The mapping of package names to their Global Variable names
const GLOBAL_MAP = {
  '@supermousejs/core': 'SupermouseCore',
  '@supermousejs/utils': 'SupermouseUtils',
  '@supermousejs/zoetrope': 'SupermouseZoetrope',
  'vue': 'Vue'
};

function toPascalCase(str) {
  return str.replace(/(^\w|-\w)/g, (text) => text.replace(/-/, "").toUpperCase());
}

function run() {
  console.log('🔧 Fixing UMD Names & Globals (Surgical Mode)...\n');

  if (!fs.existsSync(packagesDir)) {
    console.error('❌ packages directory not found');
    return;
  }

  const packages = fs.readdirSync(packagesDir).filter(p => {
    return fs.statSync(path.join(packagesDir, p)).isDirectory() && !SKIP_LIST.includes(p);
  });

  packages.forEach(pkgName => {
    const vitePath = path.join(packagesDir, pkgName, 'vite.config.ts');
    
    if (!fs.existsSync(vitePath)) return;

    let content = fs.readFileSync(vitePath, 'utf-8');
    let modified = false;

    // 1. Calculate Expected Name
    // core -> SupermouseCore, dot -> SupermouseDot
    const pascalName = toPascalCase(pkgName);
    const expectedGlobal = pkgName === 'core' ? 'SupermouseCore' : `Supermouse${pascalName}`;

    // 2. Fix 'name' property in build.lib
    // Regex looks for: name: 'Something',
    const nameRegex = /(build:\s*\{[\s\S]*?lib:\s*\{[\s\S]*?name:\s*)(['"`])(?:[^'"`]+)(['"`])/;
    const nameMatch = content.match(nameRegex);

    if (nameMatch) {
      const currentName = content.slice(nameMatch.index).match(/name:\s*(['"`])([^'"`]+)(['"`])/)[2];
      if (currentName !== expectedGlobal) {
        console.log(`   [${pkgName}] Updating name: ${currentName} -> ${expectedGlobal}`);
        // We replace just the name part safely
        content = content.replace(nameRegex, `$1$2${expectedGlobal}$3`);
        modified = true;
      }
    }

    // 3. Fix 'globals' in rollupOptions
    // We construct a string representation of the globals object based on what keys are present in the map
    // We assume the user wants standard mappings for core/utils/zoetrope.
    
    const globalsRegex = /(globals:\s*\{)([\s\S]*?)(\})/;
    const globalsMatch = content.match(globalsRegex);

    if (globalsMatch) {
      // Rebuild the globals string
      const currentBlock = globalsMatch[2];
      let newBlock = currentBlock;
      let globalsModified = false;

      Object.entries(GLOBAL_MAP).forEach(([key, val]) => {
        // If the key exists in the file (e.g. external: ['@supermousejs/core']), we should ensure it's in globals
        // A simple heuristic: if the package name appears anywhere in the file, ensure it's mapped in globals
        // EXCEPT for the package itself (core shouldn't allow core as global)
        if (pkgName === 'core' && key === '@supermousejs/core') return;

        if (content.includes(key)) {
          // Check if mapping exists
          const keyRegex = new RegExp(`(['"\`])${key}\\1\\s*:\\s*(['"\`])([^'"]+)\\2`);
          const match = newBlock.match(keyRegex);

          if (match) {
            // Exists, check if value is correct
            if (match[3] !== val) {
              newBlock = newBlock.replace(keyRegex, `$1${key}$1: '${val}'`);
              globalsModified = true;
            }
          } else {
            // Doesn't exist, add it
            // We append to the start of the block for simplicity, handling commas is tricky in regex replacement
            // Ideally we'd use AST, but for this specific file structure:
            const entry = `\n          '${key}': '${val}',`;
            newBlock = entry + newBlock;
            globalsModified = true;
          }
        }
      });

      if (globalsModified) {
        console.log(`   [${pkgName}] Updating globals map`);
        content = content.replace(globalsRegex, `$1${newBlock}$3`);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(vitePath, content);
    }
  });

  console.log('\n✅ All names fixed. Plugins will now share the correct "SupermouseCore" instance.');
}

run();
