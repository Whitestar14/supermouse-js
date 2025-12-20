import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const packagesDir = path.join(rootDir, 'packages');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const clearScreen = () => console.log('\x1Bc');

function listPlugins() {
  if (!fs.existsSync(packagesDir)) return [];
  return fs.readdirSync(packagesDir).filter(f => {
    return fs.statSync(path.join(packagesDir, f)).isDirectory() && f !== '.DS_Store';
  });
}

function printHeader() {
  clearScreen();
  console.log('🐭 \x1b[1mSUPERMOUSE PLUGIN MANAGER\x1b[0m');
  console.log('============================');
}

function mainMenu() {
  printHeader();
  const plugins = listPlugins();
  console.log(`Found ${plugins.length} plugins:`);
  plugins.forEach(p => console.log(` - ${p}`));
  console.log('');
  console.log('1. \x1b[32mCreate New Plugin\x1b[0m');
  console.log('2. \x1b[31mRemove Plugin\x1b[0m');
  console.log('3. \x1b[36mSync Configuration\x1b[0m (v2.0.0)');
  console.log('4. Exit');
  console.log('');
  
  rl.question('Select option: ', (answer) => {
    switch(answer.trim()) {
      case '1':
        createPluginFlow();
        break;
      case '2':
        removePluginFlow(plugins);
        break;
      case '3':
        runScript('sync-configs.js');
        break;
      case '4':
        rl.close();
        process.exit(0);
        break;
      default:
        mainMenu();
    }
  });
}

function createPluginFlow() {
  console.log('\n--- Create Plugin ---');
  rl.question('Enter plugin name (kebab-case, e.g., "cool-effect"): ', (name) => {
    if (!name) return mainMenu();
    runScript('create-plugin.js', [name]);
  });
}

function removePluginFlow(plugins) {
  console.log('\n--- Remove Plugin ---');
  if (plugins.length === 0) {
    console.log('No plugins to remove.');
    setTimeout(mainMenu, 1500);
    return;
  }
  
  rl.question('Enter plugin name to delete: ', (name) => {
    if (!plugins.includes(name)) {
      console.log('Plugin not found.');
      setTimeout(mainMenu, 1500);
      return;
    }
    runScript('remove-plugin.js', [name]);
  });
}

function runScript(scriptName, args = []) {
  const scriptPath = path.join(__dirname, scriptName);
  const child = spawn('node', [scriptPath, ...args], { stdio: 'inherit' });
  
  child.on('close', () => {
    console.log('\nPress ENTER to return to menu...');
    rl.question('', () => {
      mainMenu();
    });
  });
}

// Start
mainMenu();
