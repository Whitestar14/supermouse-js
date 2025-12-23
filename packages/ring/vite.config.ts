import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'SupermouseRing',
      fileName: (format) => `index.${format}.js`,
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