/**
 * Rotas de API para analytics
 */

import express, { type Request, Response } from 'express';
import { getAnalyticsStorage, getFileStorage } from '../utils/analyticsStorage';
import type { AnalyticsEvent, AnalyticsEventResponse } from '../../../shared/types/analytics';

const router = express.Router();

/**
 * POST /api/analytics/event
 * Recebe eventos de analytics do cliente
 */
router.post('/event', async (req: Request, res: Response) => {
    try {
        const analyticsEnabled = process.env.ANALYTICS_ENABLED !== 'false';
        
        if (!analyticsEnabled) {
            return res.json({
                success: true,
                message: 'Analytics disabled',
            } as AnalyticsEventResponse);
        }

        // Suporta tanto array de eventos quanto evento único
        const events: AnalyticsEvent[] = req.body.events || [req.body.event].filter(Boolean);

        if (events.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No events provided',
            } as AnalyticsEventResponse);
        }

        // Valida eventos
        for (const event of events) {
            if (!isValidEvent(event)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid event: ${JSON.stringify(event)}`,
                } as AnalyticsEventResponse);
            }
        }

        // Salva eventos
        if (events.length === 1) {
            await getAnalyticsStorage().save(events[0]);
        } else {
            await getAnalyticsStorage().saveBatch(events);
        }

        res.json({
            success: true,
            message: `Saved ${events.length} event(s)`,
        } as AnalyticsEventResponse);
    } catch (error) {
        console.error('Error processing analytics event:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        } as AnalyticsEventResponse);
    }
});

/**
 * GET /api/analytics/events
 * Retorna eventos de analytics para consulta externa (ex: sistema de banco de dados)
 * 
 * Query parameters:
 * - offset: número de eventos para pular (default: 0)
 * - limit: número máximo de eventos para retornar (default: 1000, max: 10000)
 * - type: filtrar por tipo de evento (usage, performance, error, interaction, config)
 * - chartType: filtrar por tipo de gráfico (trellis, boxplot)
 */
router.get('/events', async (req: Request, res: Response) => {
    try {
        const analyticsEnabled = process.env.ANALYTICS_ENABLED !== 'false';
        
        if (!analyticsEnabled) {
            return res.status(503).json({
                success: false,
                message: 'Analytics disabled',
            });
        }

        // Parse query parameters
        const offset = parseInt(req.query.offset as string) || 0;
        const limit = Math.min(parseInt(req.query.limit as string) || 1000, 10000);
        const type = req.query.type as AnalyticsEvent['type'] | undefined;
        const chartType = req.query.chartType as AnalyticsEvent['chartType'] | undefined;

        // Validar filtros
        if (type) {
            const validTypes = ['usage', 'performance', 'error', 'interaction', 'config'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid type filter. Valid types: ${validTypes.join(', ')}`,
                });
            }
        }

        if (chartType) {
            const validChartTypes = ['trellis', 'boxplot'];
            if (!validChartTypes.includes(chartType)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid chartType filter. Valid types: ${validChartTypes.join(', ')}`,
                });
            }
        }

        // Ler eventos do arquivo
        const fileStorage = getFileStorage();
        const events = await fileStorage.readEvents({
            offset,
            limit,
            type,
            chartType,
        });

        const total = await fileStorage.getTotalEvents();

        res.json({
            success: true,
            data: {
                events,
                pagination: {
                    offset,
                    limit,
                    total,
                    returned: events.length,
                    hasMore: offset + events.length < total,
                },
                filters: {
                    type: type || null,
                    chartType: chartType || null,
                },
            },
        });
    } catch (error) {
        console.error('Error reading analytics events:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * Valida se o evento tem estrutura correta
 */
function isValidEvent(event: unknown): event is AnalyticsEvent {
    if (!event || typeof event !== 'object') {
        return false;
    }

    const e = event as Record<string, unknown>;

    // Verifica campos obrigatórios
    if (!e.type || !e.chartType || !e.timestamp || !e.sessionId) {
        return false;
    }

    // Verifica tipos válidos
    const validTypes = ['usage', 'performance', 'error', 'interaction', 'config'];
    if (!validTypes.includes(e.type as string)) {
        return false;
    }

    const validChartTypes = ['trellis', 'boxplot'];
    if (!validChartTypes.includes(e.chartType as string)) {
        return false;
    }

    return true;
}

export default router;

