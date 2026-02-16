/**
 * Servidor de roteamento para múltiplos gráficos customizados
 * Serve Trellis Chart em /trellis e Boxplot Chart em /boxplot
 * Espelha o repo que funciona: https://github.com/GusQuintilhano/custom_chart_ts
 * (ordem de rotas, express.static puro, sem handlers manuais de /assets)
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyticsMiddleware } from './middleware/analytics.js';
import analyticsRouter from './routes/analytics.js';
import { getCapacityMetrics } from './utils/capacityMetrics.js';
import { getAnalyticsReader } from './utils/analyticsStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(express.json());
app.use(analyticsMiddleware);

// Resolução de paths igual ao GitHub: funciona em Docker (/app, /app/app) e local
let projectRoot: string = '/app';
let trellisDistPath: string = '/app/trellis-chart/dist';
let boxplotDistPath: string = '/app/boxplot-chart/dist';

const possibleRoots = [
    '/app/app',
    '/app',
    path.resolve(__dirname, '../../../'),
    path.resolve(__dirname, '../../'),
    path.resolve(__dirname, '../..'),
];

for (const root of possibleRoots) {
    const trellisPath = path.join(root, 'trellis-chart/dist');
    if (fs.existsSync(trellisPath)) {
        projectRoot = root;
        trellisDistPath = trellisPath;
        boxplotDistPath = path.join(root, 'boxplot-chart/dist');
        break;
    }
}

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

console.log('Server initialization:');
console.log(' __dirname:', __dirname);
console.log(' projectRoot:', projectRoot);
console.log(' trellisDistPath:', trellisDistPath);
console.log(' boxplotDistPath:', boxplotDistPath);
console.log(' trellisDistPath exists:', fs.existsSync(trellisDistPath));
console.log(' boxplotDistPath exists:', fs.existsSync(boxplotDistPath));

if (!fs.existsSync(trellisDistPath)) {
    console.error(`ERROR: Trellis dist path does not exist: ${trellisDistPath}`);
    const searchPaths = ['/app/app', '/app', '/app/charts-router', process.cwd()];
    for (const searchRoot of searchPaths) {
        const searchPath = path.join(searchRoot, 'trellis-chart/dist');
        console.error(` Checking: ${searchPath} - ${fs.existsSync(searchPath) ? 'EXISTS' : 'NOT FOUND'}`);
    }
}

if (!fs.existsSync(boxplotDistPath)) {
    console.error(`ERROR: Boxplot dist path does not exist: ${boxplotDistPath}`);
    const searchPaths = ['/app/app', '/app', '/app/charts-router', process.cwd()];
    for (const searchRoot of searchPaths) {
        const searchPath = path.join(searchRoot, 'boxplot-chart/dist');
        console.error(` Checking: ${searchPath} - ${fs.existsSync(searchPath) ? 'EXISTS' : 'NOT FOUND'}`);
    }
}

// CORS para embed em ThoughtSpot/Muze (iframe ou fetch de outro domínio)
app.use('/trellis', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});
app.use('/boxplot', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

// Ordem idêntica ao repo que funciona (GitHub): static primeiro, depois GET que devolve HTML
// Servir arquivos estáticos do trellis (JS, CSS, etc) - ANTES da rota principal
app.use('/trellis', express.static(trellisDistPath, { index: false }));

// Redirect /assets/* -> /trellis/assets/* para que o browser nunca dependa de /assets/ na raiz
// (evita proxy/ingress devolver JSON para GET /assets/xxx.js)
app.get('/assets/:filename', (req, res) => {
    const filename = req.params.filename;
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).setHeader('Content-Type', 'text/plain').send('Bad request');
    }
    res.redirect(302, '/trellis/assets/' + encodeURIComponent(filename));
});

// GET /trellis deve vir DEPOIS do static para que /trellis/assets/... seja servido pelo static
app.get('/trellis', (req, res) => {
    const indexPath = path.join(trellisDistPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
        res.status(404).send('Trellis chart not found');
        return;
    }
    let html = fs.readFileSync(indexPath, 'utf8');
    // Garantir que nenhum asset use /assets/ na raiz (só /trellis/assets/) para não bater em proxy que devolve JSON
    html = html.replace(/src="\/assets\//g, 'src="/trellis/assets/').replace(/href="\/assets\//g, 'href="/trellis/assets/');
    html = html.replace(/src='\/assets\//g, "src='/trellis/assets/").replace(/href='\/assets\//g, "href='/trellis/assets/");
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.send(html);
});

// Servir arquivos estáticos do boxplot - ANTES da rota GET /boxplot
app.use('/boxplot', express.static(boxplotDistPath, { index: false }));

app.get('/boxplot', (req, res) => {
    const indexPath = path.join(boxplotDistPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
        console.error(`ERROR: Boxplot index.html not found at: ${indexPath}`);
        res.status(404).send(`Boxplot Chart Not Found. Path: ${boxplotDistPath}`);
        return;
    }
    let html = fs.readFileSync(indexPath, 'utf8');
    html = html.replace(/src="\/assets\//g, 'src="/boxplot/assets/').replace(/href="\/assets\//g, 'href="/boxplot/assets/');
    html = html.replace(/src='\/assets\//g, "src='/boxplot/assets/").replace(/href='\/assets\//g, "href='/boxplot/assets/");
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.send(html);
});

app.use('/api/analytics', analyticsRouter);

/**
 * GET /api/observability - Única API para consumir logs (eventos) + capacidade.
 * Retorno em um único JSON para ingestão no Databricks ou outro destino.
 * Query: offset, limit, type, chartType (eventos).
 */
app.get('/api/observability', async (req, res) => {
    const analyticsEnabled = process.env.ANALYTICS_ENABLED !== 'false';
    if (!analyticsEnabled) {
        return res.status(503).json({
            success: false,
            error: 'Observability disabled',
            message: 'Set ANALYTICS_ENABLED to true',
        });
    }
    try {
        const offset = parseInt(req.query.offset as string) || 0;
        const limit = Math.min(parseInt(req.query.limit as string) || 1000, 10000);
        const typeParam = req.query.type as string | undefined;
        const chartTypeParam = req.query.chartType as string | undefined;
        const validTypes = ['usage', 'performance', 'error', 'interaction', 'config'] as const;
        const validChartTypes = ['trellis', 'boxplot'] as const;
        const type = typeParam && validTypes.includes(typeParam as typeof validTypes[number]) ? (typeParam as typeof validTypes[number]) : undefined;
        const chartType = chartTypeParam && validChartTypes.includes(chartTypeParam as typeof validChartTypes[number]) ? (chartTypeParam as typeof validChartTypes[number]) : undefined;
        const reader = getAnalyticsReader();
        const events = await reader.readEvents({ offset, limit, type, chartType });
        const total = await reader.getTotalEvents({ type, chartType });

        const metricsCurrent = getCapacityMetrics();
        const metricsHistory: unknown[] = []; // histórico só disponível com persistência externa (ex.: Databricks)

        res.json({
            exported_at: new Date().toISOString(),
            events: {
                data: events,
                pagination: {
                    offset,
                    limit,
                    total,
                    returned: events.length,
                    hasMore: offset + events.length < total,
                },
                filters: { type: typeParam ?? null, chartType: chartTypeParam ?? null },
            },
            metrics: {
                current: metricsCurrent,
                history: metricsHistory,
            },
        });
    } catch (err) {
        console.error('Error building observability payload:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to build observability data',
            message: err instanceof Error ? err.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/metrics - Snapshot atual de capacidade (processo + container).
 */
app.get('/api/metrics', (req, res) => {
    try {
        const metrics = getCapacityMetrics();
        res.json(metrics);
    } catch (err) {
        console.error('Error collecting capacity metrics:', err);
        res.status(500).json({
            error: 'Failed to collect metrics',
            message: err instanceof Error ? err.message : 'Unknown error',
        });
    }
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        charts: ['trellis', 'boxplot'],
        paths: {
            trellisDistPath,
            boxplotDistPath,
            trellisIndexExists: fs.existsSync(path.join(trellisDistPath, 'index.html')),
            boxplotIndexExists: fs.existsSync(path.join(boxplotDistPath, 'index.html')),
        },
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Charts Router - ThoughtSpot Custom Charts',
        charts: { trellis: '/trellis', boxplot: '/boxplot' },
    });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Charts router listening on port ${PORT}`);
    console.log(`Trellis Chart: http://localhost:${PORT}/trellis`);
    console.log(`Boxplot Chart: http://localhost:${PORT}/boxplot`);
});
