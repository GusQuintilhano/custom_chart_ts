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
        
        const event: UsageEvent = {
            type: 'usage',
            chartType,
            timestamp: new Date().toISOString(),
            sessionId: generateRequestId(),
            userAgent: req.get('user-agent'),
            ip: req.ip || req.socket.remoteAddress,
            config: {
                method: req.method,
                path: req.path,
                responseTime,
                statusCode: res.statusCode,
            },
        };

        // Salva de forma assíncrona, não bloqueia resposta
        getAnalyticsStorage()
            .save(event)
            .catch(err => {
                console.error('Failed to save analytics event:', err);
            });
    });

    next();
}

/**
 * Extrai tipo de gráfico do path da requisição
 */
function getChartTypeFromPath(path: string): 'trellis' | 'boxplot' | null {
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

