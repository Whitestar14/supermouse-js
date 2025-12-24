import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.tsx'),
      name: 'SupermouseReact',
      fileName: (format) => format === 'es' ? 'index.mjs' : 'index.umd.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@supermousejs/core'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@supermousejs/core': 'SupermouseCore'
        }
      }
    }
  },
  plugins: [dts({ rollupTypes: true })]
});
