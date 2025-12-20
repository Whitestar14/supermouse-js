import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      '@supermousejs/zoetrope': path.resolve(__dirname, '../zoetrope/src/index.ts')
    }
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'TextRing',
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['@supermousejs/core', '@supermousejs/zoetrope'],
      output: {
        globals: {
          '@supermousejs/core': 'SupermouseCore'
        }
      }
    }
  },
  plugins: [dts({ rollupTypes: true })]
});