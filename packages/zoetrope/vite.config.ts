import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'SupermouseZoetrope',
      fileName: (format) => format === 'es' ? 'index.mjs' : 'index.umd.js',
    },
    rollupOptions: {
      external: ['@supermousejs/core'],
      output: {
        globals: {
          '@supermousejs/core': 'SupermouseCore'
        }
      }
    }
  },
  plugins: [dts({ rollupTypes: true })]
});