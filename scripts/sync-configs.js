
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');
const packagesDir = path.join(rootDir, 'packages');

const EXCLUDED = ['.DS_Store']; 

// Shared libraries that need auto-linking
const SHARED_LIBS = [
  { pkg: '@supermousejs/utils', path: '../utils/src/index.ts', global: 'SupermouseUtils' },
  { pkg: '@supermousejs/zoetrope', path: '../zoetrope/src/index.ts', global: 'SupermouseZoetrope' }
];

// Special configurations for nuanced packages
const SPECIAL_CASES = {
  'legacy': {
    umdName: 'Supermouse', // Must remain 'Supermouse' for v1 compat
    extraExternals: [],
    extraGlobals: {}
  },
  'vue': {
    umdName: 'SupermouseVue',
    extraExternals: ['vue'],
    extraGlobals: { 'vue': 'Vue' }
  }
};

// --- Helpers ---

const toPascalCase = (str) => 
  str.replace(/(^\w|-\w)/g, (text) => text.replace(/-/, "").toUpperCase());

const getUmdName = (pkgName) => {
  if (SPECIAL_CASES[pkgName]) return SPECIAL_CASES[pkgName].umdName;
  return pkgName === 'core' ? 'SupermouseCore' : `Supermouse${toPascalCase(pkgName)}`;
};

const scanForImports = (srcDir) => {
  const detected = new Set();
  if (!fs.existsSync(srcDir)) return detected;

  const files = fs.readdirSync(srcDir);
  for (const file of files) {
    if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.endsWith('.d.ts')) {
      const content = fs.readFileSync(path.join(srcDir, file), 'utf-8');
      SHARED_LIBS.forEach(lib => {
        if (content.includes(`from '${lib.pkg}'`) || content.includes(`from "${lib.pkg}"`)) {
          detected.add(lib);
        }
      });
    }
  }
  return detected;
};

// --- Patching Logic (The "Heal" Strategy) ---

const patchPackageJson = (pkgPath, pkgName, usedLibs) => {
  if (!fs.existsSync(pkgPath)) return;
  
  const content = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const isCore = pkgName === 'core';

  // 1. Enforce Standard Fields (Merge)
  // Note: We DO NOT enforce version here anymore. Changesets handles that.
  content.scripts = { ...content.scripts, "build": "vite build" };
  content.main = "dist/index.umd.js";
  content.module = "dist/index.mjs";
  content.types = "dist/index.d.ts";
  
  // 1a. Enforce Public Access for Scoped Packages
  if (content.name.startsWith('@supermousejs/')) {
    content.publishConfig = { access: "public" };
  }
  
  // Ensure exports exist but preserve extra exports if any
  content.exports = {
    ...content.exports,
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.umd.js"
    }
  };

  // 2. Enforce Dependencies (Merge)
  content.dependencies = content.dependencies || {};
  
  if (!isCore) {
    content.dependencies['@supermousejs/core'] = "workspace:*";
  }
  
  usedLibs.forEach(lib => {
    content.dependencies[lib.pkg] = "workspace:*";
  });

  // 3. Clean DevDeps (Move shared to deps if present)
  if (content.devDependencies) {
    usedLibs.forEach(lib => {
      if (content.devDependencies[lib.pkg]) delete content.devDependencies[lib.pkg];
    });
  }

  fs.writeFileSync(pkgPath, JSON.stringify(content, null, 2));
  console.log(`   [✓] Patched package.json`);
};

const patchTsConfig = (configPath, pkgName, usedLibs) => {
  let content = {
    "extends": "../../tsconfig.base.json",
    "include": ["src"],
    "compilerOptions": {
      "outDir": "dist",
      "baseUrl": ".",
      "paths": {}
    }
  };

  // If exists, read and merge
  if (fs.existsSync(configPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      content = { ...content, ...existing };
      // Ensure compilerOptions structure
      content.compilerOptions = { ...content.compilerOptions, ...existing.compilerOptions };
      content.compilerOptions.paths = { ...content.compilerOptions.paths };
    } catch (e) { /* ignore corrupt json */ }
  }

  // Ensure Base Paths
  if (pkgName !== 'core') {
    content.compilerOptions.paths['@supermousejs/core'] = ["../core/src/index.ts"];
  }

  // Ensure Lib Paths
  usedLibs.forEach(lib => {
    content.compilerOptions.paths[lib.pkg] = [lib.path];
  });

  fs.writeFileSync(configPath, JSON.stringify(content, null, 2));
  console.log(`   [✓] Patched tsconfig.json`);
};

const patchViteConfig = (configPath, pkgName, usedLibs) => {
  const umdName = getUmdName(pkgName);
  const special = SPECIAL_CASES[pkgName];

  // 1. Calculate Required Externals/Globals
  const requiredExternals = new Set();
  const requiredGlobals = {};

  if (pkgName !== 'core') {
    requiredExternals.add('@supermousejs/core');
    requiredGlobals['@supermousejs/core'] = 'SupermouseCore';
  }

  usedLibs.forEach(lib => {
    requiredExternals.add(lib.pkg);
    requiredGlobals[lib.pkg] = lib.global;
  });

  if (special) {
    special.extraExternals.forEach(e => requiredExternals.add(e));
    Object.assign(requiredGlobals, special.extraGlobals);
  }

  // 2. Generate Brand New Config (If missing)
  if (!fs.existsSync(configPath)) {
    const extArray = Array.from(requiredExternals).map(e => `'${e}'`).join(', ');
    const globObj = Object.entries(requiredGlobals)
      .map(([k, v]) => `'${k}': '${v}'`)
      .join(',\n          ');

    const template = `
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: '${umdName}',
      fileName: (format) => format === 'es' ? 'index.mjs' : 'index.umd.js',
    },
    rollupOptions: {
      external: [${extArray}],
      output: {
        globals: {
          ${globObj}
        }
      }
    }
  },
  plugins: [dts({ rollupTypes: true })]
});`.trim();
    
    fs.writeFileSync(configPath, template);
    console.log(`   [+] Created vite.config.ts`);
    return;
  }

  // 3. Patch Existing Config (If present)
  let content = fs.readFileSync(configPath, 'utf-8');
  let modified = false;

  // A. Fix UMD Name
  const nameRegex = /(build:\s*\{[\s\S]*?lib:\s*\{[\s\S]*?name:\s*)(['"`])(?:[^'"`]+)(['"`])/;
  if (content.match(nameRegex)) {
    const replacement = `$1$2${umdName}$3`;
    if (content !== content.replace(nameRegex, replacement)) {
      content = content.replace(nameRegex, replacement);
      modified = true;
      console.log(`   [~] Updated UMD Name -> ${umdName}`);
    }
  }

  // B. Enforce FileName strategy (.mjs for ESM)
  const fileNamePattern = /(fileName:\s*)(\([^)]*\)\s*=>\s*[^,]+)/;
  const desiredFileName = `(format) => format === 'es' ? 'index.mjs' : 'index.umd.js'`;
  
  const fileNameMatch = content.match(fileNamePattern);
  if (fileNameMatch) {
    const currentFn = fileNameMatch[2];
    if (!currentFn.includes("=== 'es'")) {
      content = content.replace(fileNamePattern, `$1${desiredFileName}`);
      modified = true;
      console.log(`   [~] Updated fileName strategy (es -> .mjs)`);
    }
  }

  // C. Update Globals
  Object.entries(requiredGlobals).forEach(([k, v]) => {
    const keyRegex = new RegExp(`(['"\`])${k}\\1\\s*:\\s*(['"\`])([^'"]+)\\2`);
    const match = content.match(keyRegex);
    if (match) {
      if (match[3] !== v) {
        content = content.replace(keyRegex, `$1${k}$1: '${v}'`);
        modified = true;
        console.log(`   [~] Fixed global for ${k}`);
      }
    }
  });

  if (modified) {
    fs.writeFileSync(configPath, content);
    console.log(`   [✓] Patched vite.config.ts`);
  } else {
    console.log(`   [-] vite.config.ts is up to date`);
  }
};

// --- Interactive Selection ---

async function getPackagesToSync() {
  const allPackages = fs.readdirSync(packagesDir).filter(p => {
    return fs.statSync(path.join(packagesDir, p)).isDirectory() && !EXCLUDED.includes(p);
  });

  console.log('Select packages to sync:');
  console.log('  (a) All Packages');
  allPackages.forEach((p, i) => {
    console.log(`  (${i + 1}) ${p}`);
  });

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    rl.question('\nEnter choice (e.g. "a" or "1 3"): ', (answer) => {
      rl.close();
      const choice = answer.trim().toLowerCase();
      
      if (choice === 'a' || choice === '') {
        resolve(allPackages);
        return;
      }

      const indices = choice.split(/[,\s]+/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
      const selected = indices.map(i => allPackages[i - 1]).filter(p => p);
      
      if (selected.length === 0) {
        console.log('No valid selection. Aborting.');
        process.exit(0);
      }
      resolve(selected);
    });
  });
}

// --- Main Loop ---

async function run() {
  console.log(`\n🩺 Supermouse Config Healer (Version Agnostic)\n`);

  if (!fs.existsSync(packagesDir)) {
    console.error('❌ packages directory not found.');
    process.exit(1);
  }

  const packages = await getPackagesToSync();

  console.log(`\nSyncing ${packages.length} packages...\n`);

  for (const pkgName of packages) {
    const pkgPath = path.join(packagesDir, pkgName);
    console.log(`📦 @supermousejs/${pkgName}`);

    // 1. Analyze Source
    const usedLibs = scanForImports(path.join(pkgPath, 'src'));

    // 2. Patch JSON
    patchPackageJson(path.join(pkgPath, 'package.json'), pkgName, usedLibs);

    // 3. Patch TSConfig
    patchTsConfig(path.join(pkgPath, 'tsconfig.json'), pkgName, usedLibs);

    // 4. Patch/Check Vite Config
    patchViteConfig(path.join(pkgPath, 'vite.config.ts'), pkgName, usedLibs);
    
    console.log(''); // spacer
  }

  console.log(`✅ Sync complete. Run 'pnpm install' to refresh workspace links.`);
}

run();
