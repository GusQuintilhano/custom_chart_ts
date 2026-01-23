/**
 * Middleware de observabilidade avançado
 * Captura métricas detalhadas, logs estruturados e auditoria
 */

import type { Request, Response, NextFunction } from 'express';
import { getObservabilityStorage } from '../utils/observabilityStorage';
import { getCachedUserInfo } from '../utils/thoughtspotAPI';
import type { UserContext } from '../../../shared/utils/observability';

/**
 * Interface estendida do Request com contexto de observabilidade
 */
interface ObservabilityRequest extends Request {
    observability?: {
        startTime: number;
        userContext: UserContext;
        requestId: string;
    };
}

/**
 * Middleware principal de observabilidade
 */
export function observabilityMiddleware(req: ObservabilityRequest, res: Response, next: NextFunction): void {
    const observabilityEnabled = process.env.OBSERVABILITY_ENABLED !== 'false';

    if (!observabilityEnabled) {
        return next();
    }

    const startTime = Date.now();
    const requestId = generateRequestId();

    // Cria contexto do usuário
    const userContext: UserContext = {
        sessionId: extractSessionId(req),
        userAgent: req.get('user-agent') || 'Unknown',
        ip: getClientIP(req),
        timestamp: new Date().toISOString(),
        userId: extractUserId(req),
        organization: extractOrganization(req),
        department: extractDepartment(req),
        role: extractRole(req),
    };

    // Adiciona contexto ao request
    req.observability = {
        startTime,
        userContext,
        requestId,
    };

    // Log estruturado da requisição
    logRequest(req, userContext, requestId);

    // Intercepta o fim da resposta
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        logResponse(req, res, responseTime, userContext, requestId);

        // Salva métricas de performance se for requisição de gráfico
        const chartType = getChartTypeFromPath(req.path);
        if (chartType) {
            trackChartRequest(chartType, req, res, responseTime, userContext);
        }
    });

    next();
}

/**
 * Middleware específico para auditoria de ações sensíveis
 */
export function auditMiddleware(action: string, resource: string) {
    return (req: ObservabilityRequest, res: Response, next: NextFunction): void => {
        const auditEnabled = process.env.AUDIT_ENABLED !== 'false';

        if (!auditEnabled || !req.observability) {
            return next();
        }

        // Captura dados antes da ação (para updates/deletes)
        const oldValue = req.method === 'PUT' || req.method === 'DELETE' ?
            captureResourceState(resource, req) : undefined;

        // Intercepta resposta para capturar dados após a ação
        const originalSend = res.send;
        res.send = function (data) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Ação bem-sucedida, registra auditoria
                const storage = getObservabilityStorage();
                storage.saveAuditEvent({
                    action: action as any,
                    resource,
                    resourceId: extractResourceId(req),
                    oldValue,
                    newValue: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
                    userContext: req.observability!.userContext,
                    metadata: {
                        requestId: req.observability!.requestId,
                        method: req.method,
                        path: req.path,
                        statusCode: res.statusCode,
                        timestamp: new Date().toISOString(),
                    },
                }).catch(err => {
                    console.error('[AUDIT] Failed to save audit event:', err);
                });
            }

            return originalSend.call(this, data);
        };

        next();
    };
}

/**
 * Middleware para rastrear erros automaticamente
 */
export function errorTrackingMiddleware(err: Error, req: ObservabilityRequest, res: Response, next: NextFunction): void {
    const observabilityEnabled = process.env.OBSERVABILITY_ENABLED !== 'false';

    if (observabilityEnabled && req.observability) {
        const storage = getObservabilityStorage();
        const chartType = getChartTypeFromPath(req.path) || 'unknown';

        storage.save({
            type: 'error',
            chartType: chartType as any,
            timestamp: new Date().toISOString(),
            sessionId: req.observability.userContext.sessionId,
            userId: req.observability.userContext.userId,
            error: err.message,
            stack: err.stack,
            context: {
                requestId: req.observability.requestId,
                method: req.method,
                path: req.path,
                userAgent: req.observability.userContext.userAgent,
                ip: req.observability.userContext.ip,
            },
        }).catch(saveErr => {
            console.error('[ERROR_TRACKING] Failed to save error event:', saveErr);
        });
    }

    // Log estruturado do erro
    console.error('[ERROR]', {
        timestamp: new Date().toISOString(),
        requestId: req.observability?.requestId,
        error: err.message,
        stack: err.stack,
        method: req.method,
        path: req.path,
        userAgent: req.get('user-agent'),
        ip: getClientIP(req),
    });

    next(err);
}

/**
 * Extrai ID da sessão do request
 */
function extractSessionId(req: Request): string {
    // Tenta extrair de headers customizados, cookies, ou gera novo
    return req.get('X-Session-ID') ||
        req.get('X-Request-ID') ||
        generateRequestId();
}

/**
 * Extrai ID do usuário do request
 */
function extractUserId(req: Request): string | undefined {
    // Tenta extrair de headers que o ThoughtSpot pode enviar
    return req.get('X-User-ID') ||
        req.get('X-TS-User-ID') ||
        req.get('X-ThoughtSpot-User') ||
        req.get('X-Username') ||
        req.get('X-User-Name') ||
        req.get('X-User-Email') ||
        // Headers de autenticação SAML/SSO
        req.get('X-SAML-User') ||
        req.get('X-SSO-User') ||
        // Headers de proxy reverso
        req.get('X-Remote-User') ||
        req.get('X-Forwarded-User') ||
        // Tentar extrair de JWT se disponível
        extractUserFromJWT(req.get('Authorization')) ||
        undefined;
}

/**
 * Extrai usuário de JWT token se disponível
 */
function extractUserFromJWT(authHeader?: string): string | undefined {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return undefined;
    }

    try {
        const token = authHeader.substring(7);
        // Decodifica JWT sem verificar assinatura (apenas para extrair dados)
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

        return payload.sub ||
            payload.user_id ||
            payload.userId ||
            payload.username ||
            payload.email ||
            payload.preferred_username ||
            undefined;
    } catch (error) {
        return undefined;
    }
}

/**
 * Extrai organização do usuário
 */
function extractOrganization(req: Request): string | undefined {
    return req.get('X-Organization') ||
        req.get('X-Tenant') ||
        undefined;
}

/**
 * Extrai departamento do usuário
 */
function extractDepartment(req: Request): string | undefined {
    return req.get('X-Department') || undefined;
}

/**
 * Extrai role do usuário
 */
function extractRole(req: Request): string | undefined {
    return req.get('X-User-Role') || undefined;
}

/**
 * Obtém IP real do cliente considerando proxies
 */
function getClientIP(req: Request): string {
    return req.ip ||
        req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
        req.get('X-Real-IP') ||
        req.socket.remoteAddress ||
        'unknown';
}

/**
 * Gera ID único para requisição
 */
function generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Extrai tipo de gráfico do path
 */
function getChartTypeFromPath(path: string): 'trellis' | 'boxplot' | null {
    if (path.startsWith('/trellis')) return 'trellis';
    if (path.startsWith('/boxplot')) return 'boxplot';
    return null;
}

/**
 * Log estruturado da requisição
 */
function logRequest(req: Request, userContext: UserContext, requestId: string): void {
    if (process.env.REQUEST_LOGGING === 'true') {
        console.log('[REQUEST]', {
            timestamp: new Date().toISOString(),
            requestId,
            method: req.method,
            path: req.path,
            query: req.query,
            userAgent: userContext.userAgent,
            ip: userContext.ip,
            userId: userContext.userId,
            organization: userContext.organization,
        });
    }
}

/**
 * Log estruturado da resposta
 */
function logResponse(req: Request, res: Response, responseTime: number, userContext: UserContext, requestId: string): void {
    if (process.env.RESPONSE_LOGGING === 'true') {
        console.log('[RESPONSE]', {
            timestamp: new Date().toISOString(),
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTime,
            contentLength: res.get('Content-Length'),
            userId: userContext.userId,
        });
    }
}

/**
 * Rastreia requisição de gráfico
 */
function trackChartRequest(
    chartType: 'trellis' | 'boxplot',
    req: Request,
    res: Response,
    responseTime: number,
    userContext: UserContext
): void {
    const storage = getObservabilityStorage();

    // Evento de uso
    storage.save({
        type: 'usage',
        chartType,
        timestamp: new Date().toISOString(),
        sessionId: userContext.sessionId,
        userId: userContext.userId,
        config: {
            method: req.method,
            path: req.path,
            query: req.query,
            statusCode: res.statusCode,
            responseTime,
        },
        userAgent: userContext.userAgent,
        ip: userContext.ip,
    }).catch(err => {
        console.error('[TRACKING] Failed to save usage event:', err);
    });

    // Evento de performance se for renderização
    if (req.method === 'GET' && res.statusCode === 200) {
        storage.save({
            type: 'performance',
            chartType,
            timestamp: new Date().toISOString(),
            sessionId: userContext.sessionId,
            userId: userContext.userId,
            renderTime: responseTime,
            dataProcessingTime: 0, // Seria calculado no frontend
            domManipulationTime: 0, // Seria calculado no frontend
            dataSize: parseInt(res.get('Content-Length') || '0'),
            numMeasures: 0, // Seria extraído da configuração
            numDimensions: 0, // Seria extraído da configuração
            containerWidth: 0, // Seria enviado do frontend
            containerHeight: 0, // Seria enviado do frontend
            devicePixelRatio: 1,
            browserEngine: extractBrowserEngine(userContext.userAgent),
        }).catch(err => {
            console.error('[TRACKING] Failed to save performance event:', err);
        });
    }
}

/**
 * Extrai engine do navegador do user agent
 */
function extractBrowserEngine(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Blink';
    if (userAgent.includes('Firefox')) return 'Gecko';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'WebKit';
    if (userAgent.includes('Edge')) return 'EdgeHTML';
    return 'Unknown';
}

/**
 * Captura estado atual do recurso (para auditoria)
 */
function captureResourceState(resource: string, req: Request): unknown {
    // Implementar captura baseada no tipo de recurso
    // Por exemplo, ler configuração atual antes de modificar
    return {
        resource,
        capturedAt: new Date().toISOString(),
        // Adicionar dados específicos do recurso
    };
}

/**
 * Extrai ID do recurso do request
 */
function extractResourceId(req: Request): string | undefined {
    // Extrai ID de parâmetros da URL, body, etc.
    return req.params.id || req.body?.id || undefined;
}