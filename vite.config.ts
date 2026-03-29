import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [
    preact(),
  ],
  esbuild: {
    target: 'chrome73',
  },
  build: {
    target: 'chrome73',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
