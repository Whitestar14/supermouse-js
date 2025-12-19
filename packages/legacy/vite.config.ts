
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'Supermouse',
      fileName: (format) => `index.${format}.js`,
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
