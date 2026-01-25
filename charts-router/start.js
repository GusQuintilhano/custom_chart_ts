#!/app/node/node
// Wrapper para executar server.js diretamente sem shell script
// Para golden image do iFood que não tem /bin/sh
// Usando caminho absoluto do node da golden image

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = '/app/app/charts-router';
const altBaseDir = '/app/charts-router';

let serverPath = null;

// Tentar diferentes localizações possíveis
const possiblePaths = [
  path.join(BASE_DIR, 'dist', 'server.js'),
  path.join(BASE_DIR, 'dist', 'src', 'server.js'),
  path.join(BASE_DIR, 'dist', 'charts-router', 'src', 'server.js'),
  path.join(altBaseDir, 'dist', 'server.js'),
  path.join(altBaseDir, 'dist', 'src', 'server.js'),
  path.join(altBaseDir, 'dist', 'charts-router', 'src', 'server.js'),
];

for (const possiblePath of possiblePaths) {
  if (fs.existsSync(possiblePath)) {
    serverPath = possiblePath;
    break;
  }
}

if (!serverPath) {
  console.error('ERROR: server.js not found');
  console.error('Searched in:', possiblePaths);
  process.exit(1);
}

// Executar o server.js
const serverDir = path.dirname(serverPath);
process.chdir(serverDir);

// Usar caminho absoluto do node da golden image
const nodePath = '/app/node/node';
const server = spawn(nodePath, [path.basename(serverPath)], {
  stdio: 'inherit',
  cwd: serverDir,
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  process.exit(code || 0);
});
