import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    base: '/boxplot/',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3001,
    host: 'localhost',
    open: true,
    strictPort: false
  },
  preview: {
    port: 3001,
    host: true,
    strictPort: false,
    allowedHosts: [
      'ts-custom-charts-production.up.railway.app',
      '.railway.app',
      'localhost',
      '127.0.0.1'
    ]
  }
});

