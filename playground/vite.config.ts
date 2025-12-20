import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@supermousejs/text-ring': path.resolve(__dirname, '../packages/text-ring/src/index.ts'),
      '@supermousejs/core': path.resolve(__dirname, '../packages/core/src/index.ts'),
      '@supermousejs/dot': path.resolve(__dirname, '../packages/dot/src/index.ts'),
      '@supermousejs/ring': path.resolve(__dirname, '../packages/ring/src/index.ts'),
      '@supermousejs/text': path.resolve(__dirname, '../packages/text/src/index.ts'),
      '@supermousejs/image': path.resolve(__dirname, '../packages/image/src/index.ts'),
      '@supermousejs/sparkles': path.resolve(__dirname, '../packages/sparkles/src/index.ts'),
      '@supermousejs/magnetic': path.resolve(__dirname, '../packages/magnetic/src/index.ts'),
    },
  },
});