/**
 * Rotas de API para auditoria e logs de segurança
 */

import express, { type Request, Response } from 'express';
import { getFileStorage } from '../utils/analyticsStorage';
import type { AuditEvent } from '../../../shared/utils/observability';

const router = express.Router();

/**
 * POST /api/audit/event
 * Recebe eventos de auditoria
 */
router.post('/event', async (req: Request, res: Response) => {
    try {
        const auditEnabled = process.env.AUDIT_ENABLED !== 'false';

        if (!auditEnabled) {
            return res.json({
                success: true,
                message: 'Audit disabled',
            });
        }

        const events: AuditEvent[] = req.body.events || [req.body.event].filter(Boolean);

        if (events.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No audit events provided',
            });
        }

        // Valida eventos de auditoria
        for (const event of events) {
            if (!isValidAuditEvent(event)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid audit event: ${JSON.stringify(event)}`,
                });
            }
        }

        // Enriquece eventos com informações do servidor
        const enrichedEvents = events.map(event => ({
            ...event,
            serverTimestamp: new Date().toISOString(),
            serverIP: req.ip || req.socket.remoteAddress,
            forwardedFor: req.get('X-Forwarded-For'),
            userAgent: req.get('User-Agent'),
        }));

        // Salva eventos de auditoria
        const fileStorage = getFileStorage();
        for (const event of enrichedEvents) {
            await fileStorage.saveAuditEvent(event);
        }

        // Log crítico para auditoria
        if (process.env.AUDIT_LOG === 'true') {
            console.log('[AUDIT]', JSON.stringify({
                timestamp: new Date().toISOString(),
                count: enrichedEvents.length,
                actions: enrichedEvents.map(e => e.action),
                resources: enrichedEvents.map(e => e.resource),
                users: enrichedEvents.map(e => e.userContext.userId).filter(Boolean),
                ip: req.ip,
            }));
        }

        res.json({
            success: true,
            message: `Saved ${events.length} audit event(s)`,
        });
    } catch (error) {
        console.error('[AUDIT] Error processing audit event:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
            ip: req.ip,
        });

        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/audit/events
 * Retorna eventos de auditoria (acesso restrito)
 */
router.get('/events', async (req: Request, res: Response) => {
    try {
        const auditEnabled = process.env.AUDIT_ENABLED !== 'false';

        if (!auditEnabled) {
            return res.status(503).json({
                success: false,
                message: 'Audit disabled',
            });
        }

        // Verificação básica de autorização (implementar autenticação real)
        const authToken = req.get('Authorization');
        if (!authToken || !isValidAuditToken(authToken)) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access to audit logs',
            });
        }

        // Parse query parameters
        const offset = parseInt(req.query.offset as string) || 0;
        const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
        const action = req.query.action as AuditEvent['action'] | undefined;
        const resource = req.query.resource as string | undefined;
        const userId = req.query.userId as string | undefined;
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;

        // Validar filtros
        if (action) {
            const validActions = ['create', 'update', 'delete', 'view', 'export', 'share'];
            if (!validActions.includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid action filter. Valid actions: ${validActions.join(', ')}`,
                });
            }
        }

        const fileStorage = getFileStorage();
        const auditEvents = await fileStorage.readAuditEvents({
            offset,
            limit,
            action,
            resource,
            userId,
            startDate,
            endDate,
        });

        const total = await fileStorage.getTotalAuditEvents();

        // Log acesso aos logs de auditoria
        console.log('[AUDIT ACCESS]', JSON.stringify({
            timestamp: new Date().toISOString(),
            accessedBy: req.ip,
            userAgent: req.get('User-Agent'),
            filters: { action, resource, userId, startDate, endDate },
            resultsCount: auditEvents.length,
        }));

        res.json({
            success: true,
            data: {
                events: auditEvents,
                pagination: {
                    offset,
                    limit,
                    total,
                    returned: auditEvents.length,
                    hasMore: offset + auditEvents.length < total,
                },
                filters: {
                    action: action || null,
                    resource: resource || null,
                    userId: userId || null,
                    startDate: startDate || null,
                    endDate: endDate || null,
                },
            },
        });
    } catch (error) {
        console.error('[AUDIT] Error reading audit events:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
            ip: req.ip,
        });

        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/audit/summary
 * Retorna resumo de atividades de auditoria
 */
router.get('/summary', async (req: Request, res: Response) => {
    try {
        const auditEnabled = process.env.AUDIT_ENABLED !== 'false';

        if (!auditEnabled) {
            return res.status(503).json({
                success: false,
                message: 'Audit disabled',
            });
        }

        // Verificação de autorização
        const authToken = req.get('Authorization');
        if (!authToken || !isValidAuditToken(authToken)) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access to audit summary',
            });
        }

        const days = parseInt(req.query.days as string) || 7;
        const fileStorage = getFileStorage();

        const summary = await fileStorage.getAuditSummary(days);

        res.json({
            success: true,
            data: {
                period: `Last ${days} days`,
                summary,
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('[AUDIT] Error generating audit summary:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
            ip: req.ip,
        });

        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * Valida se o evento de auditoria tem estrutura correta
 */
function isValidAuditEvent(event: unknown): event is AuditEvent {
    if (!event || typeof event !== 'object') {
        return false;
    }

    const e = event as Record<string, unknown>;

    // Verifica campos obrigatórios
    if (!e.action || !e.resource || !e.userContext) {
        return false;
    }

    // Verifica ações válidas
    const validActions = ['create', 'update', 'delete', 'view', 'export', 'share'];
    if (!validActions.includes(e.action as string)) {
        return false;
    }

    // Verifica estrutura do userContext
    const userContext = e.userContext as Record<string, unknown>;
    if (!userContext.sessionId || !userContext.timestamp) {
        return false;
    }

    return true;
}

/**
 * Valida token de acesso para auditoria (implementar autenticação real)
 */
function isValidAuditToken(token: string): boolean {
    // Implementação básica - substituir por autenticação real
    const validTokens = [
        process.env.AUDIT_ACCESS_TOKEN,
        'Bearer audit-admin-token', // Token de desenvolvimento
    ].filter(Boolean);

    return validTokens.includes(token);
}

export default router;