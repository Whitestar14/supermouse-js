import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'SupermouseVue',
      fileName: (format) => `supermouse-vue.${format}.js`,
    },
    rollupOptions: {
      external: ['vue', '@supermousejs/core'],
      output: {
        globals: {
          vue: 'Vue',
          '@supermousejs/core': 'Supermouse'
        }
      }
    }
  },
  plugins: [dts({ rollupTypes: true })]
});