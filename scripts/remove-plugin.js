import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const rootDir    = path.resolve(path.dirname(__filename), '..');
const pluginName = process.argv[2];

if (!pluginName) {
  console.error('[!] usage: node scripts/remove-plugin.js <plugin-name>');
  process.exit(1);
}

const pluginDir = path.join(rootDir, 'packages', pluginName);

// --- Helpers ---

function unlinkConsumer(folderName) {
  const consumerPath = path.join(rootDir, folderName);

  if (!fs.existsSync(consumerPath)) {
    console.log(`   [~] skipping ${folderName} (not found)`);
    return;
  }

  console.log(`>> unlinking from ${folderName}...`);

  // package.json
  const pkgPath = path.join(consumerPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg    = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const depKey = `@supermousejs/${pluginName}`;
      if (pkg.dependencies?.[depKey]) {
        delete pkg.dependencies[depKey];
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
        console.log(`   [-] removed from ${folderName}/package.json`);
      } else {
        console.log(`   [~] not found in ${folderName}/package.json`);
      }
    } catch (e) {
      console.error(`   [!] error reading ${folderName}/package.json:`, e.message);
    }
  }

  // vite.config.ts — warn only; regex patching TS source is too fragile to automate safely
  const vitePath = path.join(consumerPath, 'vite.config.ts');
  if (fs.existsSync(vitePath)) {
    try {
      if (fs.readFileSync(vitePath, 'utf-8').includes(`@supermousejs/${pluginName}`)) {
        console.log(`   [⚠] manual step needed: remove @supermousejs/${pluginName} alias from ${folderName}/vite.config.ts`);
      }
    } catch {
      console.error(`   [!] error reading ${folderName}/vite.config.ts`);
    }
  }
}

// --- Main ---

async function run() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const answer = await new Promise(resolve => {
    rl.question(
      `\n[!] DANGER: about to DELETE "@supermousejs/${pluginName}"\n` +
      `    path:    packages/${pluginName}\n` +
      `    will also unlink from playground & docs\n\n` +
      `    are you sure? (y/N) `,
      resolve,
    );
  });
  rl.close();

  if (answer.toLowerCase() !== 'y') {
    console.log('[-] aborted.');
    process.exit(0);
  }

  unlinkConsumer('playground');
  unlinkConsumer('docs');

  if (fs.existsSync(pluginDir)) {
    console.log(`\n>> deleting packages/${pluginName}...`);
    fs.rmSync(pluginDir, { recursive: true, force: true });
    console.log('   [ok] deleted.');
  } else {
    console.log(`   [!] packages/${pluginName} does not exist — nothing to delete`);
  }

  console.log(`\n[ok] cleanup complete. run "pnpm install" to update lockfile.\n`);
}

run().catch((err) => {
  console.error('[x]', err.message);
  process.exit(1);
});