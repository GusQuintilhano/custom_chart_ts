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

if (!fs.existsSync(boxplotDistPath)) {
    console.error(`ERROR: Boxplot dist path does not exist: ${boxplotDistPath}`);
    console.error('  Searching for boxplot-chart...');
    const searchPaths = ['/app', '/app/charts-router', process.cwd()];
    for (const searchRoot of searchPaths) {
        const searchPath = path.join(searchRoot, 'boxplot-chart/dist');
        console.error(`    Checking: ${searchPath} - ${fs.existsSync(searchPath) ? 'EXISTS' : 'NOT FOUND'}`);
        if (fs.existsSync(searchPath)) {
            const altIndexPath = path.join(searchPath, 'index.html');
            console.error(`      index.html exists: ${fs.existsSync(altIndexPath)}`);
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
    console.log(`Serving trellis index from: ${indexPath}`);
    console.log(`File exists: ${fs.existsSync(indexPath)}`);
    
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
    console.log(`Serving boxplot index from: ${indexPath}`);
    console.log(`Boxplot dist path exists: ${fs.existsSync(boxplotDistPath)}`);
    console.log(`Boxplot index.html exists: ${fs.existsSync(indexPath)}`);
    
    if (!fs.existsSync(indexPath)) {
        console.error(`ERROR: Boxplot index.html not found at: ${indexPath}`);
        console.error(`  boxplotDistPath: ${boxplotDistPath}`);
        console.error(`  Searching for boxplot-chart/dist...`);
        const searchPaths = ['/app', '/app/boxplot-chart', process.cwd()];
        for (const searchRoot of searchPaths) {
            const searchPath = path.join(searchRoot, 'boxplot-chart/dist');
            console.error(`    Checking: ${searchPath} - ${fs.existsSync(searchPath) ? 'EXISTS' : 'NOT FOUND'}`);
            if (fs.existsSync(searchPath)) {
                const altIndexPath = path.join(searchPath, 'index.html');
                console.error(`      index.html exists: ${fs.existsSync(altIndexPath)}`);
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

