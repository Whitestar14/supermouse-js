import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      '@supermousejs/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@supermousejs/dot': path.resolve(__dirname, '../dot/src/index.ts'),
      '@supermousejs/ring': path.resolve(__dirname, '../ring/src/index.ts'),
    }
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'Supermouse',
      fileName: (format) => format === 'es' ? 'index.mjs' : 'index.umd.js',
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  },
  plugins: [dts({ rollupTypes: true })]
});
