import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "..");
const packagesDir = path.join(rootDir, "packages");
const docsDataDir = path.join(rootDir, "docs/src/data");
const outputFile = path.join(docsDataDir, "generated-plugins.json");

function generate() {
  console.log("📖 Syncing metadata and auto-generating snippets...");

  if (!fs.existsSync(packagesDir)) {
    console.error("❌ packages directory not found");
    process.exit(1);
  }

  const plugins = [];
  const dirs = fs.readdirSync(packagesDir);

  for (const dir of dirs) {
    const pkgPath = path.join(packagesDir, dir, "package.json");
    const metaPath = path.join(packagesDir, dir, "meta.json");
    const readmePath = path.join(packagesDir, dir, "README.md");

    if (fs.existsSync(metaPath) && fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));

        if (pkg.private) continue;

        const items = Array.isArray(meta) ? meta : [meta];

        items.forEach((item) => {
          if (item.id && item.name) {
            const pkgName = pkg.name;

            item.installCommand = `pnpm install ${pkgName}`;

            item.importSnippet = `import { ${item.name} } from '${pkgName}'`;

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
