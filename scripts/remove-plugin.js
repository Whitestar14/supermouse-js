import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');
const pluginName = process.argv[2];

if (!pluginName) {
  console.error('[!] Usage: node scripts/remove-plugin.js <plugin-name>');
  process.exit(1);
}

const pluginDir = path.join(rootDir, 'packages', pluginName);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function run() {
  // 1. Confirm
  const answer = await new Promise(resolve => {
    rl.question(
      `\n[!] DANGER: You are about to DELETE "@supermousejs/${pluginName}".\n` +
      `    Path: packages/${pluginName}\n` +
      `    Unlink: playground, docs\n\n` +
      `    Are you sure? (y/N) `, 
      resolve
    );
  });
  rl.close();

  if (answer.toLowerCase() !== 'y') {
    console.log('[-] Aborted.');
    process.exit(0);
  }

  // 2. Unlink from Consumers
  unlinkConsumer('playground', pluginName);
  unlinkConsumer('docs', pluginName);

  // 3. Delete Directory
  if (fs.existsSync(pluginDir)) {
    console.log(`>> Deleting packages/${pluginName}...`);
    fs.rmSync(pluginDir, { recursive: true, force: true });
    console.log('   [ok] Deleted.');
  } else {
    console.log(`   [!] Directory packages/${pluginName} does not exist.`);
  }

  console.log(`\n[ok] Cleanup complete. Run "pnpm install" to update lockfile.`);
}

function unlinkConsumer(folderName, pluginName) {
  const consumerPath = path.join(rootDir, folderName);
  
  if (!fs.existsSync(consumerPath)) {
    console.log(`   [~] Skipping ${folderName} (not found).`);
    return;
  }

  console.log(`>> Unlinking from ${folderName}...`);
  const pkgPath = path.join(consumerPath, 'package.json');
  const vitePath = path.join(consumerPath, 'vite.config.ts');

  // Remove from package.json
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const depName = `@supermousejs/${pluginName}`;
      
      if (pkg.dependencies && pkg.dependencies[depName]) {
        delete pkg.dependencies[depName];
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
        console.log(`   [-] Removed dependency from ${folderName}.`);
      } else {
        console.log(`   [~] Dependency not found in ${folderName}.`);
      }
    } catch (e) {
      console.error(`   [!] Error reading ${folderName}/package.json`);
    }
  }

  // Remove from vite.config.ts
  if (fs.existsSync(vitePath)) {
    try {
      let content = fs.readFileSync(vitePath, 'utf-8');
      // Regex matches: '  '@supermousejs/name': ... ,' or without comma
      const regex = new RegExp(`\\s*['"]@supermousejs/${pluginName}['"]:.*,?\\n?`, 'g');
      
      if (regex.test(content)) {
        content = content.replace(regex, '\n');
        fs.writeFileSync(vitePath, content);
        console.log(`   [-] Removed alias from ${folderName}.`);
      } else {
        console.log(`   [~] Alias not found in ${folderName}.`);
      }
    } catch (e) {
      console.error(`   [!] Error reading ${folderName}/vite.config.ts`);
    }
  }
}

run();