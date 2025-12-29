import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');
const packagesDir = path.join(rootDir, 'packages');
const docsDataDir = path.join(rootDir, 'docs/src');
const outputFile = path.join(docsDataDir, 'generated-plugins.json');

function generate() {
  console.log('📖 Syncing metadata and auto-generating snippets...');

  if (!fs.existsSync(packagesDir)) {
    console.error('❌ packages directory not found');
    process.exit(1);
  }

  const plugins = [];
  const dirs = fs.readdirSync(packagesDir);

  for (const dir of dirs) {
    const pkgPath = path.join(packagesDir, dir, 'package.json');
    const metaPath = path.join(packagesDir, dir, 'meta.json');
    const readmePath = path.join(packagesDir, dir, 'README.md');

    if (fs.existsSync(metaPath) && fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        
        // Skip private packages or the main bundle if you want
        if (pkg.private) continue;

        const items = Array.isArray(meta) ? meta : [meta];

        items.forEach(item => {
          if (item.id && item.name) {
            const pkgName = pkg.name;
            
            // --- AUTOMATION WINS ---
            // 1. Auto-generate the install command
            item.installCommand = `pnpm install ${pkgName}`;
            
            // 2. Auto-generate the import snippet
            // (Assuming your export name matches the meta name or a standard)
            item.importSnippet = `import { ${item.name} } from '${pkgName}'`;
            
            // 3. Check if README exists to create a link
            item.hasDetailedDocs = fs.existsSync(readmePath);
            
            item.version = pkg.version;
            item.package = pkgName;

            plugins.push(item);
            console.log(`   + Processed ${item.name} v${pkg.version}`);
          }
        });
      } catch (e) {
        console.warn(`   ! Error in ${dir}:`, e.message);
      }
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(plugins, null, 2));
  console.log(`✅ Wrote ${plugins.length} plugins to ${outputFile}`);
}

generate();