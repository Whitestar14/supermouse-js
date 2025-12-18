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
      `    Unlink: playground\n\n` +
      `    Are you sure? (y/N) `, 
      resolve
    );
  });
  rl.close();

  if (answer.toLowerCase() !== 'y') {
    console.log('[-] Aborted.');
    process.exit(0);
  }

  // 2. Unlink from Playground Package.json
  console.log('>> Unlinking from Playground package.json...');
  const pgPkgPath = path.join(rootDir, 'playground', 'package.json');
  try {
    const pgPkg = JSON.parse(fs.readFileSync(pgPkgPath, 'utf-8'));
    const depName = `@supermousejs/${pluginName}`;
    
    if (pgPkg.dependencies && pgPkg.dependencies[depName]) {
      delete pgPkg.dependencies[depName];
      fs.writeFileSync(pgPkgPath, JSON.stringify(pgPkg, null, 2));
      console.log('   [-] Removed dependency.');
    } else {
      console.log('   [~] Dependency not found.');
    }
  } catch (e) {
    console.error('   [!] Error reading playground package.json');
  }

  // 3. Unlink from Playground Vite Config
  console.log('>> Unlinking from Playground vite.config.ts...');
  const pgVitePath = path.join(rootDir, 'playground', 'vite.config.ts');
  try {
    let content = fs.readFileSync(pgVitePath, 'utf-8');
    const regex = new RegExp(`\\s*['"]@supermousejs/${pluginName}['"]:.*,?\\n?`, 'g');
    
    if (regex.test(content)) {
      content = content.replace(regex, '');
      fs.writeFileSync(pgVitePath, content);
      console.log('   [-] Removed alias.');
    } else {
      console.log('   [~] Alias not found.');
    }
  } catch (e) {
    console.error('   [!] Error reading playground vite.config.ts');
  }

  // 4. Delete Directory
  if (fs.existsSync(pluginDir)) {
    console.log(`>> Deleting packages/${pluginName}...`);
    fs.rmSync(pluginDir, { recursive: true, force: true });
    console.log('   [ok] Deleted.');
  } else {
    console.log(`   [!] Directory packages/${pluginName} does not exist.`);
  }

  console.log(`\n[ok] Cleanup complete. Run "pnpm install" to update lockfile.`);
}

run();