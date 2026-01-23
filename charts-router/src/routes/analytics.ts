/**
 * Rotas de API para analytics
 */

import express, { type Request, Response } from 'express';
import { getAnalyticsStorage, getFileStorage } from '../utils/analyticsStorage';
import type { AnalyticsEvent, AnalyticsEventResponse, BaseAnalyticsEvent } from '../../../shared/types/analytics';

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

        // Enriquecer eventos com informações do servidor (se não estiverem presentes)
        // 
        // NOTA: Tentamos extrair informações dos headers HTTP que o ThoughtSpot
        // ou proxy podem enviar, mas essas propriedades podem não estar disponíveis.
        // Baseado na documentação, não há garantia de que esses headers existam.
        //
        // Para informações confiáveis de ORG, MODEL, USER, recomenda-se:
        // - Usar Audit Logs do ThoughtSpot (via APIs REST)
        // - Usar Session API do ThoughtSpot
        // - Configurar proxy/embed para passar informações via headers
        const serverOrg = req.get('x-thoughtspot-org') || 
                         req.get('x-org-id') || 
                         req.get('x-organization-id') ||
                         req.get('x-tenant-id') ||
                         undefined;
        const serverModel = req.get('x-thoughtspot-model') || 
                           req.get('x-model-id') || 
                           req.get('x-worksheet-id') ||
                           undefined;
        const serverUser = req.get('x-thoughtspot-user') || 
                          req.get('x-user-name') || 
                          req.get('x-username') ||
                          undefined;
        const serverUserId = req.get('x-thoughtspot-user-id') || 
                            req.get('x-user-id') ||
                            undefined;

        // Enriquecer cada evento com TODAS as informações disponíveis do servidor
        // Coletar o máximo de informações possível para logs completos
        const enrichedEvents = events.map(event => {
            const enrichments: Partial<BaseAnalyticsEvent> = {};
            
            // Preencher TODAS as informações disponíveis (não apenas se faltar)
            // Isso garante que temos o máximo de contexto possível nos logs
            if (serverOrg && !event.org) {
                enrichments.org = serverOrg;
                enrichments.orgId = serverOrg; // Também como orgId se não tiver
            }
            if (serverModel && !event.model) {
                enrichments.model = serverModel;
                enrichments.modelId = serverModel; // Também como modelId se não tiver
            }
            if (serverUser && !event.user) {
                enrichments.user = serverUser;
                enrichments.userName = serverUser; // Também como userName se não tiver
            }
            if (serverUserId && !event.userId) {
                enrichments.userId = serverUserId;
            }
            
            // Adicionar informações de headers HTTP adicionais ao contextMetadata
            const requestMetadata: Record<string, unknown> = {
                ...(event.contextMetadata || {}),
                requestHeaders: {
                    userAgent: req.get('user-agent'),
                    referer: req.get('referer'),
                    origin: req.get('origin'),
                    ip: req.ip || req.socket.remoteAddress,
                    host: req.get('host'),
                },
            };
            
            enrichments.contextMetadata = requestMetadata;
            
            // Retornar evento enriquecido mantendo type safety
            return Object.keys(enrichments).length > 0 
                ? { ...event, ...enrichments }
                : event;
        });

        // Log detalhado para debug (apenas se variável de ambiente estiver habilitada)
        if (process.env.ANALYTICS_DEBUG === 'true') {
            console.log('[Analytics API] Events received:', {
                count: enrichedEvents.length,
                types: enrichedEvents.map(e => e.type),
                chartTypes: enrichedEvents.map(e => e.chartType),
                serverContext: {
                    org: serverOrg,
                    model: serverModel,
                    user: serverUser,
                    userId: serverUserId,
                },
                ip: req.ip || req.socket.remoteAddress,
                timestamp: new Date().toISOString(),
            });
        }

        // Salva eventos enriquecidos
        if (enrichedEvents.length === 1) {
            await getAnalyticsStorage().save(enrichedEvents[0]);
        } else {
            await getAnalyticsStorage().saveBatch(enrichedEvents);
        }

        res.json({
            success: true,
            message: `Saved ${events.length} event(s)`,
        } as AnalyticsEventResponse);
    } catch (error) {
        console.error('[Analytics API] Error processing analytics event:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        } as AnalyticsEventResponse);
    }
});

/**
 * GET /api/analytics/events
 * Retorna eventos de analytics para consulta externa (ex: Databricks)
 * 
 * Query parameters:
 * - offset: número de eventos para pular (default: 0)
 * - limit: número máximo de eventos para retornar (default: 1000, max: 10000)
 * - type: filtrar por tipo de evento (usage, performance, error, interaction, config)
 * - chartType: filtrar por tipo de gráfico (trellis, boxplot)
 * - userId: filtrar por ID do usuário
 * - org: filtrar por organização (nome ou ID)
 * - orgId: filtrar por ID da organização
 * - model: filtrar por modelo (nome ou ID)
 * - modelId: filtrar por ID do modelo
 * - startDate: data inicial (ISO 8601, ex: 2024-01-15T00:00:00Z)
 * - endDate: data final (ISO 8601, ex: 2024-01-20T23:59:59Z)
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
        const userId = req.query.userId as string | undefined;
        const org = req.query.org as string | undefined;
        const orgId = req.query.orgId as string | undefined;
        const model = req.query.model as string | undefined;
        const modelId = req.query.modelId as string | undefined;
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;
        
        // Validar datas
        if (startDate && isNaN(Date.parse(startDate))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid startDate format. Use ISO 8601 format (e.g., 2024-01-15T00:00:00Z)',
            });
        }
        if (endDate && isNaN(Date.parse(endDate))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid endDate format. Use ISO 8601 format (e.g., 2024-01-20T23:59:59Z)',
            });
        }

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

        // Ler eventos do arquivo com todos os filtros
        const fileStorage = getFileStorage();
        const events = await fileStorage.readEvents({
            offset,
            limit,
            type,
            chartType,
            userId,
            org,
            orgId,
            model,
            modelId,
            startDate,
            endDate,
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
                    userId: userId || null,
                    org: org || null,
                    orgId: orgId || null,
                    model: model || null,
                    modelId: modelId || null,
                    startDate: startDate || null,
                    endDate: endDate || null,
                },
            },
        });
    } catch (error) {
        console.error('[Analytics API] Error reading analytics events:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/analytics/stats
 * Retorna estatísticas agregadas dos eventos para análise
 * Útil para dashboards e relatórios no Databricks
 * 
 * Query parameters:
 * - startDate: data inicial (ISO 8601)
 * - endDate: data final (ISO 8601)
 * - chartType: filtrar por tipo de gráfico (trellis, boxplot)
 * - groupBy: agrupar por (day, hour, chartType, type, org, user) - default: day
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const analyticsEnabled = process.env.ANALYTICS_ENABLED !== 'false';
        
        if (!analyticsEnabled) {
            return res.status(503).json({
                success: false,
                message: 'Analytics disabled',
            });
        }

        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;
        const chartType = req.query.chartType as AnalyticsEvent['chartType'] | undefined;
        const groupBy = (req.query.groupBy as string) || 'day';

        // Validar datas
        if (startDate && isNaN(Date.parse(startDate))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid startDate format. Use ISO 8601 format',
            });
        }
        if (endDate && isNaN(Date.parse(endDate))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid endDate format. Use ISO 8601 format',
            });
        }

        // Validar groupBy
        const validGroupBy = ['day', 'hour', 'chartType', 'type', 'org', 'user'];
        if (!validGroupBy.includes(groupBy)) {
            return res.status(400).json({
                success: false,
                message: `Invalid groupBy. Valid values: ${validGroupBy.join(', ')}`,
            });
        }

        // Ler todos os eventos no período (sem limite para estatísticas)
        const fileStorage = getFileStorage();
        const allEvents = await fileStorage.readEvents({
            chartType,
            startDate,
            endDate,
            limit: 100000, // Limite alto para estatísticas
        });

        // Calcular estatísticas
        const stats = calculateStats(allEvents, groupBy);

        res.json({
            success: true,
            data: {
                stats,
                period: {
                    startDate: startDate || null,
                    endDate: endDate || null,
                },
                totalEvents: allEvents.length,
                groupBy,
            },
        });
    } catch (error) {
        console.error('[Analytics API] Error calculating stats:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * Calcula estatísticas agregadas dos eventos
 */
function calculateStats(events: AnalyticsEvent[], groupBy: string): Record<string, unknown> {
    const stats: Record<string, unknown> = {
        total: events.length,
        byType: {} as Record<string, number>,
        byChartType: {} as Record<string, number>,
        errors: {
            total: 0,
            byChartType: {} as Record<string, number>,
            recent: [] as Array<{ timestamp: string; error: string; chartType: string }>,
        },
        interactions: {
            total: 0,
            byType: {} as Record<string, number>,
            byElement: {} as Record<string, number>,
        },
        performance: {
            avgRenderTime: 0,
            maxRenderTime: 0,
            minRenderTime: Infinity,
            totalRenders: 0,
        },
        usage: {
            total: 0,
            byChartType: {} as Record<string, number>,
            uniqueUsers: new Set<string>(),
            uniqueOrgs: new Set<string>(),
        },
        config: {
            total: 0,
            byKey: {} as Record<string, number>,
        },
    };

    let totalRenderTime = 0;
    let renderCount = 0;

    for (const event of events) {
        // Contagem por tipo
        stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
        
        // Contagem por chartType
        stats.byChartType[event.chartType] = (stats.byChartType[event.chartType] || 0) + 1;

        // Estatísticas de erro
        if (event.type === 'error') {
            stats.errors.total++;
            stats.errors.byChartType[event.chartType] = (stats.errors.byChartType[event.chartType] || 0) + 1;
            
            // Manter últimos 50 erros
            if (stats.errors.recent.length < 50) {
                stats.errors.recent.push({
                    timestamp: event.timestamp,
                    error: event.error,
                    chartType: event.chartType,
                });
            }
        }

        // Estatísticas de interação
        if (event.type === 'interaction') {
            stats.interactions.total++;
            stats.interactions.byType[event.interactionType] = (stats.interactions.byType[event.interactionType] || 0) + 1;
            stats.interactions.byElement[event.element] = (stats.interactions.byElement[event.element] || 0) + 1;
        }

        // Estatísticas de performance
        if (event.type === 'performance') {
            renderCount++;
            totalRenderTime += event.renderTime;
            stats.performance.maxRenderTime = Math.max(stats.performance.maxRenderTime, event.renderTime);
            stats.performance.minRenderTime = Math.min(stats.performance.minRenderTime, event.renderTime);
        }

        // Estatísticas de uso
        if (event.type === 'usage') {
            stats.usage.total++;
            stats.usage.byChartType[event.chartType] = (stats.usage.byChartType[event.chartType] || 0) + 1;
            if (event.userId) {
                (stats.usage.uniqueUsers as Set<string>).add(event.userId);
            }
            if (event.org || event.orgId) {
                (stats.usage.uniqueOrgs as Set<string>).add(event.org || event.orgId || '');
            }
        }

        // Estatísticas de configuração
        if (event.type === 'config') {
            stats.config.total++;
            stats.config.byKey[event.configKey] = (stats.config.byKey[event.configKey] || 0) + 1;
        }
    }

    // Calcular média de render time
    if (renderCount > 0) {
        stats.performance.avgRenderTime = Math.round(totalRenderTime / renderCount);
        stats.performance.totalRenders = renderCount;
    } else {
        stats.performance.minRenderTime = 0;
    }

    // Converter Sets para arrays para JSON
    stats.usage.uniqueUsers = Array.from(stats.usage.uniqueUsers as Set<string>).length;
    stats.usage.uniqueOrgs = Array.from(stats.usage.uniqueOrgs as Set<string>).length;

    // Ordenar erros recentes por timestamp (mais recentes primeiro)
    (stats.errors.recent as Array<{ timestamp: string }>).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return stats;
}

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

