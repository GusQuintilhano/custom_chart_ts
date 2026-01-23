/**
 * Rotas de API para métricas e monitoramento
 */

import express, { type Request, Response } from 'express';
import { getFileStorage } from '../utils/analyticsStorage';
import os from 'os';
import fs from 'fs';

const router = express.Router();

/**
 * GET /api/metrics/health
 * Health check detalhado do sistema
 */
router.get('/health', async (req: Request, res: Response) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            system: {
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem(),
                    process: process.memoryUsage(),
                },
                cpu: {
                    cores: os.cpus().length,
                    loadAverage: os.loadavg(),
                },
            },
            services: {
                analytics: process.env.ANALYTICS_ENABLED !== 'false',
                audit: process.env.AUDIT_ENABLED !== 'false',
                fileStorage: await checkFileStorageHealth(),
            },
            charts: await checkChartsHealth(),
        };

        // Determina status geral
        const hasIssues = !health.services.fileStorage ||
            !health.charts.trellis.available ||
            !health.charts.boxplot.available;

        if (hasIssues) {
            health.status = 'degraded';
            res.status(503);
        }

        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/metrics/usage
 * Métricas de uso dos gráficos
 */
router.get('/usage', async (req: Request, res: Response) => {
    try {
        const days = parseInt(req.query.days as string) || 7;
        const chartType = req.query.chartType as string | undefined;

        const fileStorage = getFileStorage();
        const usageStats = await fileStorage.getUsageStats(days, chartType);

        res.json({
            success: true,
            data: {
                period: `Last ${days} days`,
                chartType: chartType || 'all',
                stats: usageStats,
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('[METRICS] Error getting usage stats:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/metrics/performance
 * Métricas de performance dos gráficos
 */
router.get('/performance', async (req: Request, res: Response) => {
    try {
        const days = parseInt(req.query.days as string) || 7;
        const chartType = req.query.chartType as string | undefined;

        const fileStorage = getFileStorage();
        const performanceStats = await fileStorage.getPerformanceStats(days, chartType);

        res.json({
            success: true,
            data: {
                period: `Last ${days} days`,
                chartType: chartType || 'all',
                stats: performanceStats,
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('[METRICS] Error getting performance stats:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/metrics/errors
 * Métricas de erros
 */
router.get('/errors', async (req: Request, res: Response) => {
    try {
        const days = parseInt(req.query.days as string) || 7;
        const chartType = req.query.chartType as string | undefined;

        const fileStorage = getFileStorage();
        const errorStats = await fileStorage.getErrorStats(days, chartType);

        res.json({
            success: true,
            data: {
                period: `Last ${days} days`,
                chartType: chartType || 'all',
                stats: errorStats,
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('[METRICS] Error getting error stats:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/metrics/users
 * Métricas de usuários ativos
 */
router.get('/users', async (req: Request, res: Response) => {
    try {
        const days = parseInt(req.query.days as string) || 7;

        const fileStorage = getFileStorage();
        const userStats = await fileStorage.getUserStats(days);

        res.json({
            success: true,
            data: {
                period: `Last ${days} days`,
                stats: userStats,
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('[METRICS] Error getting user stats:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/metrics/dashboard
 * Dashboard consolidado de métricas
 */
router.get('/dashboard', async (req: Request, res: Response) => {
    try {
        const days = parseInt(req.query.days as string) || 7;

        const fileStorage = getFileStorage();

        const [usageStats, performanceStats, errorStats, userStats] = await Promise.all([
            fileStorage.getUsageStats(days),
            fileStorage.getPerformanceStats(days),
            fileStorage.getErrorStats(days),
            fileStorage.getUserStats(days),
        ]);

        const dashboard = {
            period: `Last ${days} days`,
            summary: {
                totalUsage: usageStats.totalEvents || 0,
                uniqueUsers: userStats.uniqueUsers || 0,
                avgRenderTime: performanceStats.avgRenderTime || 0,
                errorRate: errorStats.errorRate || 0,
            },
            charts: {
                trellis: {
                    usage: usageStats.byChartType?.trellis || 0,
                    avgRenderTime: performanceStats.byChartType?.trellis?.avgRenderTime || 0,
                    errors: errorStats.byChartType?.trellis || 0,
                },
                boxplot: {
                    usage: usageStats.byChartType?.boxplot || 0,
                    avgRenderTime: performanceStats.byChartType?.boxplot?.avgRenderTime || 0,
                    errors: errorStats.byChartType?.boxplot || 0,
                },
            },
            trends: {
                usage: usageStats.dailyTrend || [],
                performance: performanceStats.dailyTrend || [],
                errors: errorStats.dailyTrend || [],
            },
            topErrors: errorStats.topErrors || [],
            generatedAt: new Date().toISOString(),
        };

        res.json({
            success: true,
            data: dashboard,
        });
    } catch (error) {
        console.error('[METRICS] Error generating dashboard:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/metrics/realtime
 * Métricas em tempo real
 */
router.get('/realtime', async (req: Request, res: Response) => {
    try {
        const fileStorage = getFileStorage();

        // Últimos 5 minutos
        const realtimeStats = await fileStorage.getRealtimeStats(5);

        res.json({
            success: true,
            data: {
                period: 'Last 5 minutes',
                stats: realtimeStats,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('[METRICS] Error getting realtime stats:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * Verifica saúde do armazenamento de arquivos
 */
async function checkFileStorageHealth(): Promise<boolean> {
    try {
        const fileStorage = getFileStorage();
        // Tenta escrever um arquivo de teste
        await fileStorage.healthCheck();
        return true;
    } catch (error) {
        console.error('[HEALTH] File storage check failed:', error);
        return false;
    }
}

/**
 * Verifica saúde dos gráficos
 */
async function checkChartsHealth(): Promise<Record<string, any>> {
    const projectRoot = process.cwd();

    const trellisDistPath = `${projectRoot}/trellis-chart/dist`;
    const boxplotDistPath = `${projectRoot}/boxplot-chart/dist`;

    const trellisIndexPath = `${trellisDistPath}/index.html`;
    const boxplotIndexPath = `${boxplotDistPath}/index.html`;

    return {
        trellis: {
            available: fs.existsSync(trellisIndexPath),
            distPath: trellisDistPath,
            indexExists: fs.existsSync(trellisIndexPath),
        },
        boxplot: {
            available: fs.existsSync(boxplotIndexPath),
            distPath: boxplotDistPath,
            indexExists: fs.existsSync(boxplotIndexPath),
        },
    };
}

export default router;