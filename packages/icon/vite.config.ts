import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'SupermouseIcon',
      fileName: (format) => format === 'es' ? 'index.mjs' : 'index.umd.js',
    },
    rollupOptions: {
      external: ['@supermousejs/core', '@supermousejs/utils'],
      output: {
        globals: {
          '@supermousejs/core': 'SupermouseCore'
        , '@supermousejs/utils': 'SupermouseUtils'}
      }
    }
  },
  plugins: [dts({ rollupTypes: true })]
});