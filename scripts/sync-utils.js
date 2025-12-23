
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');
const packagesDir = path.join(rootDir, 'packages');

// Libraries that should be installed automatically (dependencies) 
// but NOT bundled (external).
const SHARED_LIBS = [
  { pkg: '@supermousejs/utils', path: '../utils/src/index.ts', global: 'SupermouseUtils' },
  { pkg: '@supermousejs/zoetrope', path: '../zoetrope/src/index.ts', global: 'SupermouseZoetrope' }
];

const IGNORE_PKGS = ['core', 'utils', 'zoetrope', 'legacy-wrapper'];

function sync() {
  console.log('🔄 Syncing shared libraries (utils, zoetrope)...');
  
  if (!fs.existsSync(packagesDir)) {
    console.error('❌ packages directory not found');
    return;
  }

  const packages = fs.readdirSync(packagesDir).filter(p => {
    return fs.statSync(path.join(packagesDir, p)).isDirectory() && !IGNORE_PKGS.includes(p);
  });

  packages.forEach(pkg => {
    const pkgDir = path.join(packagesDir, pkg);
    const srcDir = path.join(pkgDir, 'src');
    
    if (!fs.existsSync(srcDir)) return;
    
    // Check which libs are used
    const files = fs.readdirSync(srcDir);
    const usedLibs = new Set();

    const checkFile = (filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        SHARED_LIBS.forEach(lib => {
            if (content.includes(`from '${lib.pkg}'`) || content.includes(`from "${lib.pkg}"`)) {
                usedLibs.add(lib);
            }
        });
    };

    // Simple flat check (expand to recursive if needed later)
    for (const file of files) {
      if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.endsWith('.d.ts')) {
        checkFile(path.join(srcDir, file));
      }
    }

    if (usedLibs.size === 0) return;

    console.log(`   👉 Updating ${pkg}...`);

    // 1. Update package.json
    const pkgJsonPath = path.join(pkgDir, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      let modified = false;

      usedLibs.forEach(lib => {
          // Remove from peer/dev if present
          if (pkgJson.peerDependencies?.[lib.pkg]) delete pkgJson.peerDependencies[lib.pkg];
          if (pkgJson.devDependencies?.[lib.pkg]) delete pkgJson.devDependencies[lib.pkg];

          // Add to dependencies
          pkgJson.dependencies = pkgJson.dependencies || {};
          if (!pkgJson.dependencies[lib.pkg]) {
              pkgJson.dependencies[lib.pkg] = "workspace:*";
              modified = true;
              console.log(`      + Added dependency: ${lib.pkg}`);
          }
      });

      if (modified) {
          fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
      }
    }

    // 2. Update tsconfig.json
    const tsConfigPath = path.join(pkgDir, 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'));
      tsConfig.compilerOptions = tsConfig.compilerOptions || {};
      tsConfig.compilerOptions.paths = tsConfig.compilerOptions.paths || {};
      
      let modified = false;
      usedLibs.forEach(lib => {
          if (!tsConfig.compilerOptions.paths[lib.pkg]) {
              tsConfig.compilerOptions.paths[lib.pkg] = [lib.path];
              modified = true;
          }
      });

      if (modified) {
          fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
          console.log(`      + Added TS path aliases`);
      }
    }

    // 3. Update vite.config.ts
    const vitePath = path.join(pkgDir, 'vite.config.ts');
    if (fs.existsSync(vitePath)) {
      let content = fs.readFileSync(vitePath, 'utf-8');
      let changed = false;

      usedLibs.forEach(lib => {
          // External Array
          const extRegex = /external:\s*\[([^\]]*)\]/;
          const extMatch = content.match(extRegex);
          if (extMatch) {
            const currentExts = extMatch[1];
            if (!currentExts.includes(lib.pkg)) {
              const newExts = currentExts.trim() 
                ? `${currentExts}, '${lib.pkg}'`
                : `'${lib.pkg}'`;
              content = content.replace(extRegex, `external: [${newExts}]`);
              changed = true;
            }
          }

          // Globals Object
          const globRegex = /globals:\s*\{([^}]*)\}/;
          const globMatch = content.match(globRegex);
          if (globMatch) {
            const currentGlobs = globMatch[1];
            if (!currentGlobs.includes(lib.pkg)) {
              const newGlobs = currentGlobs.trim()
                ? `${currentGlobs}, '${lib.pkg}': '${lib.global}'`
                : `'${lib.pkg}': '${lib.global}'`;
              content = content.replace(globRegex, `globals: {${newGlobs}}`);
              changed = true;
            }
          }
      });

      if (changed) {
        fs.writeFileSync(vitePath, content);
        console.log(`      + Updated Vite build config (external/globals)`);
      }
    }
  });
  
  console.log('✅ Sync complete.');
}

sync();
