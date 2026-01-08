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
// Se estamos em dist/charts-router/src/, subir para /app
// Se estamos em dist/src/, subir para /app/charts-router
let projectRoot: string;
if (__dirname.includes('dist/charts-router/src')) {
    // Código compilado em dist/charts-router/src/
    projectRoot = path.resolve(__dirname, '../../../');
} else if (__dirname.includes('dist/src')) {
    // Código compilado em dist/src/
    projectRoot = path.resolve(__dirname, '../../');
} else {
    // Desenvolvimento ou outra estrutura
    projectRoot = path.resolve(__dirname, '../../');
}

const trellisDistPath = path.join(projectRoot, 'trellis-chart/dist');
const boxplotDistPath = path.join(projectRoot, 'boxplot-chart/dist');

// Servir Trellis Chart em /trellis
app.use('/trellis', express.static(trellisDistPath));
app.get('/trellis', (req, res) => {
    const indexPath = path.join(trellisDistPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error serving trellis index:', err);
            res.status(404).json({ error: 'Trellis chart not found', path: indexPath });
        }
    });
});

// Servir Boxplot Chart em /boxplot
app.use('/boxplot', express.static(boxplotDistPath));
app.get('/boxplot', (req, res) => {
    const indexPath = path.join(boxplotDistPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error serving boxplot index:', err);
            res.status(404).json({ error: 'Boxplot chart not found', path: indexPath });
        }
    });
});

// API de analytics
app.use('/api/analytics', analyticsRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', charts: ['trellis', 'boxplot'] });
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

