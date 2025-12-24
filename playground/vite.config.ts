import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read core package.json to sync version numbers
const corePkgPath = path.resolve(__dirname, '../packages/core/package.json');
const corePkg = JSON.parse(readFileSync(corePkgPath, 'utf-8'));

export default defineConfig({
  plugins: [vue()],
  define: {
    __SUPERMOUSE_VERSION__: JSON.stringify(corePkg.version),
    __VERSION__: JSON.stringify(corePkg.version) 
  },
  resolve: {
    alias: {
      '@supermousejs/react': path.resolve(__dirname, '../packages/react/src/index.ts'),
      '@supermousejs/utils': path.resolve(__dirname, '../packages/utils/src/index.ts'),
      '@supermousejs/trail': path.resolve(__dirname, '../packages/trail/src/index.ts'),
      '@supermousejs/labs': path.resolve(__dirname, '../packages/labs/src/index.ts'),
      '@supermousejs/zoetrope': path.resolve(__dirname, '../packages/zoetrope/src/index.ts'),

      '@supermousejs/core': path.resolve(__dirname, '../packages/core/src/index.ts'),
      '@supermousejs/dot': path.resolve(__dirname, '../packages/dot/src/index.ts'),
      '@supermousejs/ring': path.resolve(__dirname, '../packages/ring/src/index.ts'),
      '@supermousejs/text': path.resolve(__dirname, '../packages/text/src/index.ts'),
      '@supermousejs/image': path.resolve(__dirname, '../packages/image/src/index.ts'),

      '@supermousejs/magnetic': path.resolve(__dirname, '../packages/magnetic/src/index.ts'),
      '@supermousejs/pointer': path.resolve(__dirname, '../packages/pointer/src/index.ts'),
      '@supermousejs/icon': path.resolve(__dirname, '../packages/icon/src/index.ts'),
      '@supermousejs/states': path.resolve(__dirname, '../packages/states/src/index.ts'),
      '@supermousejs/stick': path.resolve(__dirname, '../packages/stick/src/index.ts'),
      '@supermousejs/vue': path.resolve(__dirname, '../packages/vue/src/index.ts')
    },
  },
});