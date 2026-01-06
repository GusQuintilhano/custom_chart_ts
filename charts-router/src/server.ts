/**
 * Servidor de roteamento para múltiplos gráficos customizados
 * Serve Trellis Chart em /trellis e Boxplot Chart em /boxplot
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Charts router listening on port ${PORT}`);
    console.log(`Trellis Chart: http://localhost:${PORT}/trellis`);
    console.log(`Boxplot Chart: http://localhost:${PORT}/boxplot`);
});

