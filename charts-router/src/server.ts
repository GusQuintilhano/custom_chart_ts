/**
 * Servidor de roteamento para múltiplos gráficos customizados
 * Serve Trellis Chart em /trellis e Boxplot Chart em /boxplot
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyticsMiddleware } from './middleware/analytics.js';
import analyticsRouter from './routes/analytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configurar trust proxy para obter IP correto em produção
app.set('trust proxy', true);

// Middleware para parsear JSON
app.use(express.json());

// Middleware de analytics (deve vir antes das rotas de gráficos)
app.use(analyticsMiddleware);

// Determinar caminho base do projeto
// No Docker, os arquivos estão em /app/trellis-chart/dist e /app/boxplot-chart/dist
// O servidor está em /app/charts-router/dist/charts-router/src/ ou /app/charts-router/dist/src/
import fs from 'fs';

let projectRoot: string = '/app';
let trellisDistPath: string = '/app/trellis-chart/dist';
let boxplotDistPath: string = '/app/boxplot-chart/dist';

// Tentar diferentes caminhos possíveis
const possibleRoots = [
    '/app',  // Caminho absoluto no Docker
    path.resolve(__dirname, '../../../'),  // Se estamos em dist/charts-router/src/
    path.resolve(__dirname, '../../'),    // Se estamos em dist/src/
    path.resolve(__dirname, '../../..'),  // Alternativa
];

// Procurar o diretório trellis-chart/dist
for (const root of possibleRoots) {
    const trellisPath = path.join(root, 'trellis-chart/dist');
    if (fs.existsSync(trellisPath)) {
        projectRoot = root;
        trellisDistPath = trellisPath;
        boxplotDistPath = path.join(root, 'boxplot-chart/dist');
        break;
    }
}

// Se não encontrou, usar caminho padrão baseado em __dirname
if (!fs.existsSync(trellisDistPath)) {
    if (__dirname.includes('dist/charts-router/src')) {
        projectRoot = path.resolve(__dirname, '../../../');
    } else if (__dirname.includes('dist/src')) {
        projectRoot = path.resolve(__dirname, '../../');
    } else {
        projectRoot = path.resolve(__dirname, '../../');
    }
    trellisDistPath = path.join(projectRoot, 'trellis-chart/dist');
    boxplotDistPath = path.join(projectRoot, 'boxplot-chart/dist');
}

// Log para debug
console.log('Server initialization:');
console.log('  __dirname:', __dirname);
console.log('  projectRoot:', projectRoot);
console.log('  trellisDistPath:', trellisDistPath);
console.log('  boxplotDistPath:', boxplotDistPath);
console.log('  trellisDistPath exists:', fs.existsSync(trellisDistPath));
console.log('  boxplotDistPath exists:', fs.existsSync(boxplotDistPath));

if (!fs.existsSync(trellisDistPath)) {
    console.error(`ERROR: Trellis dist path does not exist: ${trellisDistPath}`);
    console.error('  Searching for trellis-chart...');
    const searchPaths = ['/app', '/app/charts-router', process.cwd()];
    for (const searchRoot of searchPaths) {
        const searchPath = path.join(searchRoot, 'trellis-chart/dist');
        console.error(`    Checking: ${searchPath} - ${fs.existsSync(searchPath) ? 'EXISTS' : 'NOT FOUND'}`);
    }
}

// Servir Trellis Chart em /trellis
// IMPORTANTE: app.get deve vir ANTES de app.use para que a rota exata seja capturada primeiro
app.get('/trellis', (req, res) => {
    const indexPath = path.join(trellisDistPath, 'index.html');
    console.log(`Serving trellis index from: ${indexPath}`);
    console.log(`File exists: ${fs.existsSync(indexPath)}`);
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error serving trellis index:', err);
            const errDetails = err as NodeJS.ErrnoException;
            console.error('Error details:', {
                code: errDetails.code,
                path: errDetails.path,
                syscall: errDetails.syscall,
                message: err.message
            });
            res.status(404).json({ error: 'Trellis chart not found', path: indexPath });
        } else {
            console.log('Trellis index served successfully');
        }
    });
});
// Servir arquivos estáticos do trellis (JS, CSS, etc) - deve vir depois da rota principal
app.use('/trellis', express.static(trellisDistPath, { index: false }));

// Servir Boxplot Chart em /boxplot
app.get('/boxplot', (req, res) => {
    const indexPath = path.join(boxplotDistPath, 'index.html');
    console.log(`Serving boxplot index from: ${indexPath}`);
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error serving boxplot index:', err);
            res.status(404).json({ error: 'Boxplot chart not found', path: indexPath });
        }
    });
});
// Servir arquivos estáticos do boxplot (JS, CSS, etc) - deve vir depois da rota principal
app.use('/boxplot', express.static(boxplotDistPath, { index: false }));

// API de analytics
app.use('/api/analytics', analyticsRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        charts: ['trellis', 'boxplot'],
        paths: {
            trellisDistPath,
            boxplotDistPath,
            trellisIndexExists: fs.existsSync(path.join(trellisDistPath, 'index.html')),
            boxplotIndexExists: fs.existsSync(path.join(boxplotDistPath, 'index.html'))
        }
    });
});

// Rota raiz - redirecionar ou servir índice
app.get('/', (req, res) => {
    res.json({
        message: 'Charts Router - ThoughtSpot Custom Charts',
        charts: {
            trellis: '/trellis',
            boxplot: '/boxplot',
        },
    });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Charts router listening on port ${PORT}`);
    console.log(`Trellis Chart: http://localhost:${PORT}/trellis`);
    console.log(`Boxplot Chart: http://localhost:${PORT}/boxplot`);
});

