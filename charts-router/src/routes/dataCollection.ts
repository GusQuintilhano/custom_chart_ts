/**
 * APIs para coleta de dados pelo Databricks
 * Endpoints otimizados para ingestão de dados de observabilidade
 */

import express, { type Request, Response } from 'express';
import { getObservabilityStorage } from '../utils/observabilityStorage';

const router = express.Router();

/**
 * GET /api/data-collection/analytics/bulk
 * Exporta eventos de analytics em lote para o Databricks
 * 
 * Query parameters:
 * - startDate: Data inicial (YYYY-MM-DD)
 * - endDate: Data final (YYYY-MM-DD)
 * - limit: Número máximo de registros (default: 10000, max: 50000)
 * - offset: Offset para paginação
 * - format: Formato de saída (json|jsonl|csv) - default: jsonl
 * - compress: Compressão (true|false) - default: false
 */
router.get('/analytics/bulk', async (req: Request, res: Response) => {
    try {
        // Verificação de autorização para Databricks
        const authToken = req.get('Authorization');
        if (!isValidDatabricsToken(authToken)) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access. Valid Databricks token required.',
            });
        }

        const {
            startDate,
            endDate,
            limit = '10000',
            offset = '0',
            format = 'jsonl',
            compress = 'false'
        } = req.query;

        // Validações
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required (YYYY-MM-DD format)',
            });
        }

        const limitNum = Math.min(parseInt(limit as string), 50000);
        const offsetNum = parseInt(offset as string);

        const storage = getObservabilityStorage();
        const events = await storage.readEvents({
            startDate: startDate as string,
            endDate: endDate as string,
            limit: limitNum,
            offset: offsetNum,
        });

        // Log da coleta para auditoria
        console.log('[DATA_COLLECTION]', {
            timestamp: new Date().toISOString(),
            type: 'analytics_bulk_export',
            requestedBy: req.ip,
            userAgent: req.get('User-Agent'),
            parameters: { startDate, endDate, limit: limitNum, offset: offsetNum },
            recordsReturned: events.length,
        });

        // Formata resposta baseado no formato solicitado
        if (format === 'csv') {
            const csv = convertToCSV(events);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="analytics_${startDate}_${endDate}.csv"`);
            res.send(csv);
        } else if (format === 'json') {
            res.json({
                success: true,
                data: {
                    events,
                    metadata: {
                        startDate,
                        endDate,
                        limit: limitNum,
                        offset: offsetNum,
                        totalReturned: events.length,
                        exportedAt: new Date().toISOString(),
                    },
                },
            });
        } else {
            // JSONL (JSON Lines) - formato preferido para Databricks
            const jsonl = events.map(event => JSON.stringify(event)).join('\n');
            res.setHeader('Content-Type', 'application/x-ndjson');
            res.setHeader('Content-Disposition', `attachment; filename="analytics_${startDate}_${endDate}.jsonl"`);
            res.send(jsonl);
        }
    } catch (error) {
        console.error('[DATA_COLLECTION] Error in analytics bulk export:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/data-collection/audit/bulk
 * Exporta eventos de auditoria em lote para o Databricks
 */
router.get('/audit/bulk', async (req: Request, res: Response) => {
    try {
        const authToken = req.get('Authorization');
        if (!isValidDatabricsToken(authToken)) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access. Valid Databricks token required.',
            });
        }

        const {
            startDate,
            endDate,
            limit = '10000',
            offset = '0',
            format = 'jsonl'
        } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required (YYYY-MM-DD format)',
            });
        }

        const limitNum = Math.min(parseInt(limit as string), 50000);
        const offsetNum = parseInt(offset as string);

        const storage = getObservabilityStorage();
        const events = await storage.readAuditEvents({
            startDate: startDate as string,
            endDate: endDate as string,
            limit: limitNum,
            offset: offsetNum,
        });

        // Log da coleta para auditoria
        console.log('[DATA_COLLECTION]', {
            timestamp: new Date().toISOString(),
            type: 'audit_bulk_export',
            requestedBy: req.ip,
            userAgent: req.get('User-Agent'),
            parameters: { startDate, endDate, limit: limitNum, offset: offsetNum },
            recordsReturned: events.length,
        });

        if (format === 'json') {
            res.json({
                success: true,
                data: {
                    events,
                    metadata: {
                        startDate,
                        endDate,
                        limit: limitNum,
                        offset: offsetNum,
                        totalReturned: events.length,
                        exportedAt: new Date().toISOString(),
                    },
                },
            });
        } else {
            // JSONL
            const jsonl = events.map(event => JSON.stringify(event)).join('\n');
            res.setHeader('Content-Type', 'application/x-ndjson');
            res.setHeader('Content-Disposition', `attachment; filename="audit_${startDate}_${endDate}.jsonl"`);
            res.send(jsonl);
        }
    } catch (error) {
        console.error('[DATA_COLLECTION] Error in audit bulk export:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/data-collection/metrics/aggregated
 * Retorna métricas agregadas para análise no Databricks
 */
router.get('/metrics/aggregated', async (req: Request, res: Response) => {
    try {
        const authToken = req.get('Authorization');
        if (!isValidDatabricsToken(authToken)) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access. Valid Databricks token required.',
            });
        }

        const {
            startDate,
            endDate,
            granularity = 'daily' // daily, hourly
        } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required (YYYY-MM-DD format)',
            });
        }

        const days = Math.ceil((new Date(endDate as string).getTime() - new Date(startDate as string).getTime()) / (1000 * 60 * 60 * 24));

        const storage = getObservabilityStorage();

        const [usageStats, performanceStats, errorStats, userStats] = await Promise.all([
            storage.getUsageStats(days),
            storage.getPerformanceStats(days),
            storage.getErrorStats(days),
            storage.getUserStats(days),
        ]);

        const aggregatedMetrics = {
            period: {
                startDate,
                endDate,
                days,
                granularity,
            },
            usage: {
                totalEvents: usageStats.totalEvents,
                byChartType: usageStats.byChartType,
                dailyTrend: usageStats.dailyTrend,
            },
            performance: {
                avgRenderTime: performanceStats.avgRenderTime,
                medianRenderTime: performanceStats.medianRenderTime,
                p95RenderTime: performanceStats.p95RenderTime,
                byChartType: performanceStats.byChartType,
                dailyTrend: performanceStats.dailyTrend,
            },
            errors: {
                totalErrors: errorStats.totalErrors,
                errorRate: errorStats.errorRate,
                byChartType: errorStats.byChartType,
                topErrors: errorStats.topErrors,
                dailyTrend: errorStats.dailyTrend,
            },
            users: {
                uniqueUsers: userStats.uniqueUsers,
                uniqueSessions: userStats.uniqueSessions,
                topUsers: userStats.topUsers,
                userAgents: userStats.userAgents,
            },
            exportedAt: new Date().toISOString(),
        };

        // Log da coleta
        console.log('[DATA_COLLECTION]', {
            timestamp: new Date().toISOString(),
            type: 'metrics_aggregated_export',
            requestedBy: req.ip,
            parameters: { startDate, endDate, granularity },
        });

        res.json({
            success: true,
            data: aggregatedMetrics,
        });
    } catch (error) {
        console.error('[DATA_COLLECTION] Error in metrics aggregated export:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/data-collection/schema
 * Retorna o schema dos dados para configuração no Databricks
 */
router.get('/schema', (req: Request, res: Response) => {
    const schema = {
        analytics_events: {
            description: 'Eventos de analytics dos gráficos customizados',
            fields: {
                type: { type: 'string', description: 'Tipo do evento (usage, performance, error, interaction, config)' },
                chartType: { type: 'string', description: 'Tipo do gráfico (trellis, boxplot)' },
                timestamp: { type: 'timestamp', description: 'Timestamp do evento em ISO 8601' },
                sessionId: { type: 'string', description: 'ID único da sessão' },
                userId: { type: 'string', nullable: true, description: 'ID do usuário (se disponível)' },
                userAgent: { type: 'string', nullable: true, description: 'User agent do navegador' },
                ip: { type: 'string', nullable: true, description: 'Endereço IP do cliente' },
                config: { type: 'object', description: 'Configurações específicas do evento' },
                error: { type: 'string', nullable: true, description: 'Mensagem de erro (apenas para eventos de erro)' },
                stack: { type: 'string', nullable: true, description: 'Stack trace do erro' },
                renderTime: { type: 'number', nullable: true, description: 'Tempo de renderização em ms' },
                dataSize: { type: 'number', nullable: true, description: 'Tamanho dos dados processados' },
                numMeasures: { type: 'number', nullable: true, description: 'Número de medidas' },
                numDimensions: { type: 'number', nullable: true, description: 'Número de dimensões' },
                interactionType: { type: 'string', nullable: true, description: 'Tipo de interação do usuário' },
                element: { type: 'string', nullable: true, description: 'Elemento interagido' },
            },
        },
        audit_events: {
            description: 'Eventos de auditoria para rastreamento de ações',
            fields: {
                action: { type: 'string', description: 'Ação realizada (create, update, delete, view, export, share)' },
                resource: { type: 'string', description: 'Recurso afetado' },
                resourceId: { type: 'string', nullable: true, description: 'ID do recurso' },
                oldValue: { type: 'object', nullable: true, description: 'Valor anterior (para updates)' },
                newValue: { type: 'object', nullable: true, description: 'Novo valor' },
                userContext: {
                    type: 'object',
                    description: 'Contexto do usuário',
                    fields: {
                        userId: { type: 'string', nullable: true },
                        sessionId: { type: 'string' },
                        userAgent: { type: 'string' },
                        ip: { type: 'string', nullable: true },
                        organization: { type: 'string', nullable: true },
                        department: { type: 'string', nullable: true },
                        role: { type: 'string', nullable: true },
                        timestamp: { type: 'timestamp' },
                    },
                },
                metadata: { type: 'object', description: 'Metadados adicionais' },
            },
        },
        aggregated_metrics: {
            description: 'Métricas agregadas por período',
            fields: {
                period: {
                    type: 'object',
                    fields: {
                        startDate: { type: 'date' },
                        endDate: { type: 'date' },
                        days: { type: 'number' },
                        granularity: { type: 'string' },
                    },
                },
                usage: { type: 'object', description: 'Estatísticas de uso' },
                performance: { type: 'object', description: 'Estatísticas de performance' },
                errors: { type: 'object', description: 'Estatísticas de erros' },
                users: { type: 'object', description: 'Estatísticas de usuários' },
                exportedAt: { type: 'timestamp' },
            },
        },
    };

    res.json({
        success: true,
        data: {
            schema,
            endpoints: {
                analytics_bulk: '/api/data-collection/analytics/bulk',
                audit_bulk: '/api/data-collection/audit/bulk',
                metrics_aggregated: '/api/data-collection/metrics/aggregated',
            },
            databricks_integration: {
                recommended_format: 'jsonl',
                max_records_per_request: 50000,
                authentication: 'Bearer token required',
                rate_limits: 'No specific limits, but consider server resources',
            },
        },
    });
});

/**
 * POST /api/data-collection/webhook
 * Webhook para notificar o Databricks sobre novos dados disponíveis
 */
router.post('/webhook', async (req: Request, res: Response) => {
    try {
        const { webhookUrl, eventTypes, threshold } = req.body;

        if (!webhookUrl) {
            return res.status(400).json({
                success: false,
                message: 'webhookUrl is required',
            });
        }

        // Aqui você implementaria a lógica para registrar o webhook
        // e notificar quando houver dados suficientes para coleta

        res.json({
            success: true,
            message: 'Webhook registered successfully',
            data: {
                webhookUrl,
                eventTypes: eventTypes || ['analytics', 'audit'],
                threshold: threshold || 1000,
                registeredAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('[DATA_COLLECTION] Error registering webhook:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * Valida token de acesso do Databricks
 */
function isValidDatabricsToken(token?: string): boolean {
    if (!token) return false;

    // Lista de tokens válidos (implementar autenticação real)
    const validTokens = [
        process.env.DATABRICKS_ACCESS_TOKEN,
        process.env.DATA_COLLECTION_TOKEN,
        'Bearer databricks-collector-token', // Token de desenvolvimento
    ].filter(Boolean);

    return validTokens.includes(token);
}

/**
 * Converte eventos para formato CSV
 */
function convertToCSV(events: any[]): string {
    if (events.length === 0) return '';

    // Extrai todas as chaves possíveis
    const allKeys = new Set<string>();
    events.forEach(event => {
        Object.keys(event).forEach(key => allKeys.add(key));
    });

    const headers = Array.from(allKeys);
    const csvRows = [headers.join(',')];

    events.forEach(event => {
        const row = headers.map(header => {
            const value = event[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
            return String(value).replace(/"/g, '""');
        });
        csvRows.push(row.map(field => `"${field}"`).join(','));
    });

    return csvRows.join('\n');
}

export default router;