import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { spawn } from 'child_process';

const __filename  = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const rootDir     = path.resolve(__dirname, '..');
const packagesDir = path.join(rootDir, 'packages');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// --- Helpers ---

const clearScreen = () => process.stdout.write('\x1Bc');

function listPlugins() {
  if (!fs.existsSync(packagesDir)) return [];
  return fs.readdirSync(packagesDir).filter(f => {
    return (
      fs.statSync(path.join(packagesDir, f)).isDirectory() &&
      f !== '.DS_Store'
    );
  });
}

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

function printHeader() {
  clearScreen();
  console.log('🐭 \x1b[1mSUPERMOUSE PLUGIN MANAGER\x1b[0m');
  console.log('============================');
}

// Pause our readline, spawn the script, resume when done.
function runScript(scriptName, args = []) {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, scriptName);

    // Hand stdin over to the child entirely
    rl.pause();
    process.stdin.setRawMode?.(false);

    const child = spawn('node', [scriptPath, ...args], { stdio: 'inherit' });

    child.on('close', () => {
      // Restore readline for manage.js prompts
      process.stdin.resume();
      rl.resume();
      resolve();
    });
  });
}

// --- Flows ---

async function mainMenu() {
  printHeader();
  const plugins = listPlugins();
  console.log(`found ${plugins.length} plugin${plugins.length !== 1 ? 's' : ''}:`);
  plugins.forEach(p => console.log(`  - ${p}`));
  console.log('');
  console.log('1. \x1b[32mcreate new plugin\x1b[0m');
  console.log('2. \x1b[31mremove plugin\x1b[0m');
  console.log('3. \x1b[36msync configuration\x1b[0m');
  console.log('4. exit');
  console.log('');

  const answer = await question('select option: ');

  switch (answer.trim()) {
    case '1': return createPluginFlow();
    case '2': return removePluginFlow(plugins);
    case '3': {
      await runScript('sync-configs.js');
      await question('\npress ENTER to return to menu...');
      return mainMenu();
    }
    case '4':
      rl.close();
      process.exit(0);
    default:
      return mainMenu();
  }
}

async function createPluginFlow() {
  console.log('\n--- create plugin ---');
  const name = await question('plugin name (kebab-case, e.g. "cool-effect"): ');
  if (!name.trim()) return mainMenu();

  await runScript('create-plugin.js', [name.trim()]);
  await question('\npress ENTER to return to menu...');
  return mainMenu();
}

async function removePluginFlow(plugins) {
  console.log('\n--- remove plugin ---');

  if (plugins.length === 0) {
    console.log('no plugins to remove.');
    await new Promise(r => setTimeout(r, 1500));
    return mainMenu();
  }

  console.log('available plugins:');
  plugins.forEach((p, i) => console.log(`  (${i + 1}) ${p}`));

  const answer = await question('\nenter plugin name to delete: ');
  const name   = answer.trim();

  if (!plugins.includes(name)) {
    console.log(`plugin "${name}" not found.`);
    await new Promise(r => setTimeout(r, 1500));
    return mainMenu();
  }

  await runScript('remove-plugin.js', [name]);
  await question('\npress ENTER to return to menu...');
  return mainMenu();
}

// --- Entry ---

mainMenu().catch((err) => {
  console.error('[x]', err.message);
  rl.close();
  process.exit(1);
});