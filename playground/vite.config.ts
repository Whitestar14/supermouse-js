import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@supermousejs/core': path.resolve(__dirname, '../packages/core/src/index.ts'),
      '@supermousejs/dot': path.resolve(__dirname, '../packages/dot/src/index.ts'),
      '@supermousejs/ring': path.resolve(__dirname, '../packages/ring/src/index.ts'),
      '@supermousejs/text': path.resolve(__dirname,  '../packages/text/src/index.ts'), 
      '@supermousejs/sparkles': path.resolve(__dirname, '../packages/sparkles/src/index.ts')
    },
  },
});