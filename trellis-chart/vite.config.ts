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
    base: '/trellis/',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000,
    host: 'localhost',
    open: true,
    strictPort: false // Tenta outra porta se 3000 estiver ocupada
  },
  preview: {
    port: 3000,
    host: true, // Aceita requisições de qualquer host (necessário para Railway)
    strictPort: false,
    allowedHosts: [
      'ts-custom-charts-production.up.railway.app',
      '.railway.app', // Permite todos os subdomínios do Railway
      'localhost',
      '127.0.0.1'
    ]
  }
});

