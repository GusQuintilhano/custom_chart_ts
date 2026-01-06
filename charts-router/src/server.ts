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

// Servir Trellis Chart em /trellis
app.use('/trellis', express.static(path.join(__dirname, '../../trellis-chart/dist')));
app.get('/trellis', (req, res) => {
    res.sendFile(path.join(__dirname, '../../trellis-chart/dist/index.html'));
});

// Servir Boxplot Chart em /boxplot
app.use('/boxplot', express.static(path.join(__dirname, '../../boxplot-chart/dist')));
app.get('/boxplot', (req, res) => {
    res.sendFile(path.join(__dirname, '../../boxplot-chart/dist/index.html'));
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

