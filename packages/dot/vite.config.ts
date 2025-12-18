import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'Dot',
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      // Don't bundle core, unless we ARE core
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