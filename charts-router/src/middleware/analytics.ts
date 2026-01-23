/**
 * Middleware de analytics para rastrear requisições HTTP
 */

import type { Request, Response, NextFunction } from 'express';
import { getAnalyticsStorage } from '../utils/analyticsStorage';
import type { UsageEvent } from '../../../shared/types/analytics';

/**
 * Middleware para rastrear requisições aos gráficos
 */
export function analyticsMiddleware(req: Request, res: Response, next: NextFunction): void {
    const analyticsEnabled = process.env.ANALYTICS_ENABLED !== 'false';
    
    if (!analyticsEnabled) {
        return next();
    }

    const startTime = Date.now();
    const chartType = getChartTypeFromPath(req.path);

    // Se não for uma requisição de gráfico, passa adiante
    if (!chartType) {
        return next();
    }

    // Intercepta o evento de fim da resposta
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        
        // Extrair informações adicionais dos headers HTTP (se disponíveis)
        // NOTA: Baseado na documentação, o ThoughtSpot pode enviar algumas informações via headers
        // quando usado através de proxy ou embed. Estas propriedades podem não estar sempre presentes.
        const org = req.get('x-thoughtspot-org') || 
                    req.get('x-org-id') || 
                    req.get('x-organization-id') ||
                    req.get('x-tenant-id') ||
                    undefined;
        const model = req.get('x-thoughtspot-model') || 
                     req.get('x-model-id') || 
                     req.get('x-worksheet-id') ||
                     undefined;
        const user = req.get('x-thoughtspot-user') || 
                    req.get('x-user-name') || 
                    req.get('x-username') ||
                    undefined;
        const userId = req.get('x-thoughtspot-user-id') || 
                      req.get('x-user-id') ||
                      undefined;
        
        const event: UsageEvent = {
            type: 'usage',
            chartType,
            timestamp: new Date().toISOString(),
            sessionId: generateRequestId(),
            userId: userId || undefined,
            org: org || undefined,
            model: model || undefined,
            user: user || undefined,
            userAgent: req.get('user-agent'),
            ip: req.ip || req.socket.remoteAddress,
            config: {
                method: req.method,
                path: req.path,
                responseTime,
                statusCode: res.statusCode,
                // Informações adicionais de headers
                referer: req.get('referer'),
                origin: req.get('origin'),
            },
        };

        // Log detalhado para debug (apenas se variável de ambiente estiver habilitada)
        if (process.env.ANALYTICS_DEBUG === 'true') {
            console.log('[Analytics Middleware] Event captured:', {
                chartType,
                responseTime,
                statusCode: res.statusCode,
                org,
                model,
                user,
                userId,
                ip: event.ip,
            });
        }

        // Salva de forma assíncrona, não bloqueia resposta
        getAnalyticsStorage()
            .save(event)
            .catch(err => {
                console.error('[Analytics Middleware] Failed to save analytics event:', {
                    error: err instanceof Error ? err.message : String(err),
                    stack: err instanceof Error ? err.stack : undefined,
                    eventType: event.type,
                    chartType: event.chartType,
                    timestamp: new Date().toISOString(),
                });
            });
    });

    next();
}

/**
 * Extrai tipo de gráfico do path da requisição
 * Ignora requisições de assets (imagens, logos, CSS, etc.)
 */
function getChartTypeFromPath(path: string): 'trellis' | 'boxplot' | null {
    // Ignorar requisições de assets
    const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.css', '.woff', '.woff2', '.ttf', '.otf', '.eot'];
    const hasAssetExtension = assetExtensions.some(ext => path.toLowerCase().endsWith(ext));
    
    // Ignorar paths que são claramente assets (logo, images, assets, etc.)
    const assetPaths = ['/logo', '/images', '/assets', '/favicon'];
    const isAssetPath = assetPaths.some(assetPath => path.toLowerCase().includes(assetPath));
    
    if (hasAssetExtension || isAssetPath) {
        return null;
    }
    
    if (path.startsWith('/trellis')) {
        return 'trellis';
    }
    if (path.startsWith('/boxplot')) {
        return 'boxplot';
    }
    return null;
}

/**
 * Gera ID único para requisição
 */
function generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

