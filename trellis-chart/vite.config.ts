import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/** Garante que o index.html gerado use apenas /trellis/assets/ (nunca /assets/ na raiz), para evitar proxy devolver JSON. */
function rewriteAssetPathsPlugin(prefix: string) {
  return {
    name: 'rewrite-asset-paths',
    closeBundle() {
      const indexPath = join(__dirname, 'dist', 'index.html');
      try {
        let html = readFileSync(indexPath, 'utf8');
        const rewritten = html.replace(/"\/assets\//g, `"${prefix}/assets/`).replace(/'\/assets\//g, `'${prefix}/assets/`);
        if (rewritten !== html) {
          writeFileSync(indexPath, rewritten, 'utf8');
          console.log(`[rewrite-asset-paths] index.html updated to use ${prefix}/assets/`);
        }
      } catch (e) {
        console.warn('[rewrite-asset-paths] could not rewrite index.html:', e);
      }
    },
  };
}

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
      },
      plugins: [rewriteAssetPathsPlugin('/trellis')],
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
      '.railway.app',
      'dataviz-custom-chart.ifoodcorp.com.br',
      '.ifoodcorp.com.br',
      'localhost',
      '127.0.0.1'
    ]
  }
});

