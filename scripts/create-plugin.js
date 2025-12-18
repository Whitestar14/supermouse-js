// scripts/create-plugin.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// --- Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Get Arguments
const pluginName = process.argv[2];
if (!pluginName) {
  console.error('❌ Please provide a plugin name.');
  console.log('   Usage: pnpm create my-plugin-name');
  process.exit(1);
}

// Helpers
const toPascalCase = (str) =>
  str.replace(/(^\w|-\w)/g, (text) => text.replace(/-/, '').toUpperCase());

const pascalName = toPascalCase(pluginName);
const pluginDir = path.join(rootDir, 'packages', pluginName);

// --- Templates ---
const getTemplates = () => {
  // Special handling: Core cannot depend on itself
  const dependencies = pluginName === 'core' 
    ? {} 
    : { "@supermousejs/core": "workspace:*" };

  return {
    packageJson: {
      name: `@supermousejs/${pluginName}`,
      version: "0.0.0", // You might want to preserve version in the future, but strict reset is safer for now
      main: "dist/index.umd.js",
      module: "dist/index.mjs",
      types: "dist/index.d.ts",
      scripts: {
        "build": "vite build"
      },
      dependencies: dependencies,
      devDependencies: {
        "vite": "^5.0.0",
        "vite-plugin-dts": "^3.0.0"
      }
    },

    tsConfig: {
      extends: "../../tsconfig.base.json",
      include: ["src"],
      compilerOptions: {
        outDir: "dist",
        baseUrl: "."
      }
    },

    viteConfig: `
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: '${pascalName}',
      fileName: (format) => \`index.\${format}.js\`,
    },
    rollupOptions: {
      // Don't bundle core, unless we ARE core
      external: ${pluginName === 'core' ? '[]' : "['@supermousejs/core']"},
      output: {
        globals: {
          '@supermousejs/core': 'SupermouseCore'
        }
      }
    }
  },
  plugins: [dts({ rollupTypes: true })]
});
`.trim(),

    indexTs: `
import type { SupermousePlugin } from '@supermousejs/core';

export interface ${pascalName}Options {
  enabled?: boolean;
}

export const ${pascalName} = (options: ${pascalName}Options = {}): SupermousePlugin => {
  return {
    name: '${pluginName}',

    install(app) {
      console.log('${pluginName} installed!');
    },

    update(app, deltaTime) {
      // Logic loop
    },

    destroy(app) {
      // Cleanup
    }
  };
};
`.trim()
  };
};

// --- Logic ---

async function run() {
  const templates = getTemplates();
  let mode = 'create'; // 'create' | 'update' | 'abort'

  // 2. Check Existence
  if (fs.existsSync(pluginDir)) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    
    const answer = await new Promise(resolve => {
      rl.question(
        `\n⚠️  Plugin "@supermousejs/${pluginName}" already exists.\n   Do you want to overwrite configs (package.json, vite, tsconfig) but KEEP src/index.ts? (y/N) `, 
        resolve
      );
    });
    rl.close();

    if (answer.toLowerCase() === 'y') {
      mode = 'update';
    } else {
      console.log('🛑 Aborted.');
      process.exit(0);
    }
  }

  console.log(`\n🚀 ${mode === 'create' ? 'Scaffolding' : 'Updating configs for'} @supermousejs/${pluginName}...`);

  // 3. Create Directory if needed
  if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(path.join(pluginDir, 'src'), { recursive: true });
  }

  // 4. Write Configurations (ALWAYS overwrite these in both modes)
  console.log('📄 Writing configuration files...');
  
  // NOTE: For package.json in update mode, we might want to preserve the Version
  // But for strict consistency, we overwrite everything else.
  let finalPackageJson = templates.packageJson;
  if (mode === 'update') {
    try {
      const currentPkg = JSON.parse(fs.readFileSync(path.join(pluginDir, 'package.json'), 'utf-8'));
      // Preserve version
      finalPackageJson.version = currentPkg.version;
      // Preserve extra deps if any? (Optional: Comment out next line to force reset deps)
      // finalPackageJson.dependencies = { ...finalPackageJson.dependencies, ...currentPkg.dependencies };
    } catch (e) { /* ignore */ }
  }

  fs.writeFileSync(path.join(pluginDir, 'package.json'), JSON.stringify(finalPackageJson, null, 2));
  fs.writeFileSync(path.join(pluginDir, 'tsconfig.json'), JSON.stringify(templates.tsConfig, null, 2));
  fs.writeFileSync(path.join(pluginDir, 'vite.config.ts'), templates.viteConfig);

  // 5. Write Source Code (ONLY if creating new)
  const indexTsPath = path.join(pluginDir, 'src/index.ts');
  if (mode === 'create') {
    fs.writeFileSync(indexTsPath, templates.indexTs);
    console.log('📝 Created src/index.ts');
  } else {
    console.log('⏩ Skipping src/index.ts (Preserved)');
  }

  // 6. Update Playground (Links & Aliases)
  if (pluginName !== 'core') {
    console.log('🔗 Linking to Playground...');
    updatePlayground(pluginName);
  }

  console.log(`\n✅ Success! @supermousejs/${pluginName} is ready.`);
  if (mode === 'create') {
    console.log('👉 Don\'t forget to run "pnpm install"!');
  }
}

function updatePlayground(name) {
  const playgroundPkgPath = path.join(rootDir, 'playground', 'package.json');
  const playgroundPkg = JSON.parse(fs.readFileSync(playgroundPkgPath, 'utf-8'));

  // 1. Add dependency
  playgroundPkg.dependencies = playgroundPkg.dependencies || {};
  playgroundPkg.dependencies[`@supermousejs/${name}`] = "workspace:*";
  fs.writeFileSync(playgroundPkgPath, JSON.stringify(playgroundPkg, null, 2));

  // 2. Add Vite Alias (Regex Magic)
  const playgroundVitePath = path.join(rootDir, 'playground', 'vite.config.ts');
  let playgroundViteContent = fs.readFileSync(playgroundVitePath, 'utf-8');
  
  const aliasEntry = `'@supermousejs/${name}': path.resolve(__dirname, '../packages/${name}/src/index.ts')`;

  if (!playgroundViteContent.includes(`@supermousejs/${name}`)) {
    if (playgroundViteContent.includes('alias: {')) {
      // Insert into existing alias block
      playgroundViteContent = playgroundViteContent.replace(
        /(alias:\s*{)/,
        `$1\n      ${aliasEntry},`
      );
      fs.writeFileSync(playgroundVitePath, playgroundViteContent);
      console.log('   Added alias to vite.config.ts');
    }
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});