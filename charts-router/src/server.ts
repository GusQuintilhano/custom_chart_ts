/**
 * Servidor de roteamento para múltiplos gráficos customizados
 * Serve Trellis Chart em /trellis e Boxplot Chart em /boxplot
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyticsMiddleware } from './middleware/analytics.js';
import { observabilityMiddleware, errorTrackingMiddleware } from './middleware/observability.js';
import analyticsRouter from './routes/analytics.js';
import auditRouter from './routes/audit.js';
import metricsRouter from './routes/metrics.js';
import dataCollectionRouter from './routes/dataCollection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configurar trust proxy para obter IP correto em produção
app.set('trust proxy', true);

// Middleware para parsear JSON
app.use(express.json());

// Middleware de observabilidade (deve vir antes das rotas)
app.use(observabilityMiddleware);

// Middleware de analytics (deve vir antes das rotas de gráficos)
app.use(analyticsMiddleware);

// Middleware de tratamento de erros
app.use(errorTrackingMiddleware);

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

// Log de inicialização do servidor (apenas em debug)
if (process.env.DEBUG === 'true') {
    console.log('[Server] Initialization:', {
        __dirname,
        projectRoot,
        trellisDistPath,
        boxplotDistPath,
        trellisDistPathExists: fs.existsSync(trellisDistPath),
        boxplotDistPathExists: fs.existsSync(boxplotDistPath),
    });
}

if (!fs.existsSync(trellisDistPath)) {
    console.error('[Server] ERROR: Trellis dist path does not exist:', {
        expectedPath: trellisDistPath,
        projectRoot,
        timestamp: new Date().toISOString(),
    });
    console.error('[Server] Searching for trellis-chart...');
    const searchPaths = ['/app', '/app/charts-router', process.cwd()];
    for (const searchRoot of searchPaths) {
        const searchPath = path.join(searchRoot, 'trellis-chart/dist');
        console.error(`  [Server] Checking: ${searchPath} - ${fs.existsSync(searchPath) ? 'EXISTS' : 'NOT FOUND'}`);
    }
}

if (!fs.existsSync(boxplotDistPath)) {
    console.error('[Server] ERROR: Boxplot dist path does not exist:', {
        expectedPath: boxplotDistPath,
        projectRoot,
        timestamp: new Date().toISOString(),
    });
    console.error('[Server] Searching for boxplot-chart...');
    const searchPaths = ['/app', '/app/charts-router', process.cwd()];
    for (const searchRoot of searchPaths) {
        const searchPath = path.join(searchRoot, 'boxplot-chart/dist');
        console.error(`  [Server] Checking: ${searchPath} - ${fs.existsSync(searchPath) ? 'EXISTS' : 'NOT FOUND'}`);
        if (fs.existsSync(searchPath)) {
            const altIndexPath = path.join(searchPath, 'index.html');
            console.error(`    [Server] index.html exists: ${fs.existsSync(altIndexPath)}`);
        }
    }
}

// Servir arquivos estáticos do trellis (JS, CSS, etc) - ANTES da rota principal
// Isso permite que /trellis/assets/... funcione
app.use('/trellis', express.static(trellisDistPath, { index: false }));

// Servir assets do trellis também em /assets (para compatibilidade com index.html)
// Isso resolve o problema de /assets/main-XXX.js não ser encontrado
app.use('/assets', express.static(path.join(trellisDistPath, 'assets'), { index: false }));

// IMPORTANTE: app.get deve vir DEPOIS de app.use para que os assets sejam servidos primeiro
app.get('/trellis', (req, res) => {
    const indexPath = path.join(trellisDistPath, 'index.html');
    // Log apenas em debug mode (remover em produção ou usar logger condicional)
    if (process.env.DEBUG === 'true') {
        console.log('[Server] Serving trellis index:', {
            path: indexPath,
            exists: fs.existsSync(indexPath),
        });
    }

    // Ler o arquivo e modificar os caminhos dos assets se necessário
    let htmlContent = fs.readFileSync(indexPath, 'utf8');

    // Substituir /assets/ por /trellis/assets/ para garantir que funcione
    // Mas também manteremos /assets/ funcionando através do app.use acima
    htmlContent = htmlContent.replace(/src="\/assets\//g, 'src="/trellis/assets/');
    htmlContent = htmlContent.replace(/href="\/assets\//g, 'href="/trellis/assets/');

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
});

// Servir arquivos estáticos do boxplot (JS, CSS, etc) - ANTES da rota principal
app.use('/boxplot', express.static(boxplotDistPath, { index: false }));

// Servir Boxplot Chart em /boxplot
app.get('/boxplot', (req, res) => {
    const indexPath = path.join(boxplotDistPath, 'index.html');
    // Log apenas em debug mode (remover em produção ou usar logger condicional)
    if (process.env.DEBUG === 'true') {
        console.log('[Server] Serving boxplot index:', {
            path: indexPath,
            distPathExists: fs.existsSync(boxplotDistPath),
            indexExists: fs.existsSync(indexPath),
        });
    }

    if (!fs.existsSync(indexPath)) {
        console.error('[Server] ERROR: Boxplot index.html not found:', {
            expectedPath: indexPath,
            boxplotDistPath,
            timestamp: new Date().toISOString(),
        });
        console.error('[Server] Searching for boxplot-chart/dist...');
        const searchPaths = ['/app', '/app/boxplot-chart', process.cwd()];
        for (const searchRoot of searchPaths) {
            const searchPath = path.join(searchRoot, 'boxplot-chart/dist');
            console.error(`  [Server] Checking: ${searchPath} - ${fs.existsSync(searchPath) ? 'EXISTS' : 'NOT FOUND'}`);
            if (fs.existsSync(searchPath)) {
                const altIndexPath = path.join(searchPath, 'index.html');
                console.error(`    [Server] index.html exists: ${fs.existsSync(altIndexPath)}`);
            }
        }
        res.status(404).send(`
            <html>
                <body>
                    <h1>Boxplot Chart Not Found</h1>
                    <p>Boxplot dist path: ${boxplotDistPath}</p>
                    <p>Index path: ${indexPath}</p>
                    <p>Please ensure boxplot-chart has been built.</p>
                </body>
            </html>
        `);
        return;
    }

    // Ler o arquivo e modificar os caminhos dos assets se necessário
    let htmlContent = fs.readFileSync(indexPath, 'utf8');

    // Substituir /assets/ por /boxplot/assets/
    htmlContent = htmlContent.replace(/src="\/assets\//g, 'src="/boxplot/assets/');
    htmlContent = htmlContent.replace(/href="\/assets\//g, 'href="/boxplot/assets/');

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
});

// API de analytics
app.use('/api/analytics', analyticsRouter);

// API de auditoria
app.use('/api/audit', auditRouter);

// API de métricas
app.use('/api/metrics', metricsRouter);

// API de coleta de dados para Databricks
app.use('/api/data-collection', dataCollectionRouter);

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
    // Log apenas em modo debug
    if (process.env.DEBUG === 'true') {
        console.log('[Server] Charts router started:', {
            port: PORT,
            trellisChart: `http://localhost:${PORT}/trellis`,
            boxplotChart: `http://localhost:${PORT}/boxplot`,
        });
    }
});

