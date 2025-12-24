
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');
const packagesDir = path.join(rootDir, 'packages');
const docsDataDir = path.join(rootDir, 'docs/src');
const outputFile = path.join(docsDataDir, 'generated-plugins.json');

function generate() {
  console.log('📖 Generating documentation data from packages...');

  if (!fs.existsSync(packagesDir)) {
    console.error('❌ packages directory not found');
    process.exit(1);
  }

  const plugins = [];
  const dirs = fs.readdirSync(packagesDir);

  for (const dir of dirs) {
    const metaPath = path.join(packagesDir, dir, 'meta.json');
    const pkgPath = path.join(packagesDir, dir, 'package.json');

    if (fs.existsSync(metaPath)) {
      try {
        const rawMeta = fs.readFileSync(metaPath, 'utf-8');
        const meta = JSON.parse(rawMeta);
        
        let version = '0.0.0';
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            version = pkg.version;
        }
        
        // Handle Array (Multi-plugin package) or Object (Single-plugin package)
        const items = Array.isArray(meta) ? meta : [meta];

        items.forEach(item => {
            if (item.id && item.name) {
                // Ensure 'package' field exists, fallback to standard naming if missing
                if (!item.package) {
                    item.package = `@supermousejs/${dir}`;
                }
                // Inject actual package version
                item.version = version;
                
                plugins.push(item);
                console.log(`   + Found meta for ${item.name} (${version})`);
            }
        });

      } catch (e) {
        console.warn(`   ! Error parsing ${metaPath}:`, e.message);
      }
    }
  }

  // Ensure docs dir exists
  if (!fs.existsSync(docsDataDir)) {
    console.error('❌ docs/src directory not found. Is this a supermouse repo?');
    process.exit(1);
  }

  // Write file
  fs.writeFileSync(outputFile, JSON.stringify(plugins, null, 2));
  console.log(`✅ Wrote ${plugins.length} plugins to ${outputFile}`);
}

generate();
