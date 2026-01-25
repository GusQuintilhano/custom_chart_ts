/**
 * API para métricas de dashboard - rastreamento de acesso e uso
 */

import express, { type Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import type {
    DashboardAccessEvent,
    DashboardUsageStats
} from '../../../shared/utils/dashboardMetrics.server';

const router = express.Router();

/**
 * Diretório para armazenar métricas de dashboard
 */
const METRICS_DIR = path.join(process.cwd(), 'logs', 'dashboard-metrics');

/**
 * Garantir que o diretório de métricas existe
 */
async function ensureMetricsDir(): Promise<void> {
    try {
        await fs.mkdir(METRICS_DIR, { recursive: true });
    } catch (error) {
        // Diretório já existe ou erro de permissão
    }
}

/**
 * POST /api/analytics/dashboard-metrics
 * Recebe eventos de métricas de dashboard
 */
router.post('/dashboard-metrics', async (req: Request, res: Response) => {
    try {
        const events: DashboardAccessEvent[] = req.body.events || [req.body.event].filter(Boolean);

        if (events.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No events provided',
            });
        }

        await ensureMetricsDir();

        // Salvar eventos em arquivo diário
        const today = new Date().toISOString().split('T')[0];
        const filePath = path.join(METRICS_DIR, `dashboard-metrics-${today}.jsonl`);

        const lines = events.map(event => JSON.stringify(event)).join('\n') + '\n';
        await fs.appendFile(filePath, lines, 'utf8');

        res.json({
            success: true,
            message: `Saved ${events.length} dashboard metric event(s)`,
        });
    } catch (error) {
        console.error('Error processing dashboard metrics:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/analytics/dashboard-stats
 * Retorna estatísticas de uso do dashboard
 */
router.get('/dashboard-stats', async (req: Request, res: Response) => {
    try {
        const days = parseInt(req.query.days as string) || 7; // Últimos 7 dias por padrão
        const stats = await generateDashboardStats(days);

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Error generating dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/analytics/dashboard-events
 * Retorna eventos de dashboard para análise
 */
router.get('/dashboard-events', async (req: Request, res: Response) => {
    try {
        const offset = parseInt(req.query.offset as string) || 0;
        const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
        const eventType = req.query.eventType as string;
        const userId = req.query.userId as string;

        const events = await getDashboardEvents({ offset, limit, eventType, userId });

        res.json({
            success: true,
            data: {
                events,
                pagination: {
                    offset,
                    limit,
                    returned: events.length,
                },
            },
        });
    } catch (error) {
        console.error('Error reading dashboard events:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * Gerar estatísticas de uso do dashboard
 */
async function generateDashboardStats(days: number): Promise<DashboardUsageStats> {
    await ensureMetricsDir();

    const events = await getAllEventsFromLastDays(days);

    // Calcular estatísticas
    const totalAccesses = events.filter(e => e.eventType === 'dashboard_access').length;
    const uniqueUsers = new Set(events.map(e => e.user.userId)).size;

    // Calcular duração média de sessão
    const sessionDurations = events
        .filter(e => e.eventType === 'session_end')
        .map(e => e.accessMetrics.sessionDuration || 0)
        .filter(d => d > 0);

    const averageSessionDuration = sessionDurations.length > 0
        ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
        : 0;

    // Top usuários
    const userStats = new Map<string, { accessCount: number; totalTime: number; lastAccess: string; username?: string }>();

    events.forEach(event => {
        const userId = event.user.userId || 'unknown';
        const existing = userStats.get(userId) || { accessCount: 0, totalTime: 0, lastAccess: '', username: event.user.username };

        if (event.eventType === 'dashboard_access') {
            existing.accessCount++;
        }

        if (event.accessMetrics.sessionDuration) {
            existing.totalTime += event.accessMetrics.sessionDuration;
        }

        if (event.timestamp > existing.lastAccess) {
            existing.lastAccess = event.timestamp;
        }

        userStats.set(userId, existing);
    });

    const topUsers = Array.from(userStats.entries())
        .map(([userId, stats]) => ({
            userId,
            username: stats.username,
            accessCount: stats.accessCount,
            totalTime: stats.totalTime,
            lastAccess: stats.lastAccess,
        }))
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 10);

    // Acessos por hora
    const accessByHour: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
        accessByHour[i.toString().padStart(2, '0')] = 0;
    }

    events.filter(e => e.eventType === 'dashboard_access').forEach(event => {
        const hour = new Date(event.timestamp).getHours().toString().padStart(2, '0');
        accessByHour[hour]++;
    });

    // Acessos por dia da semana
    const accessByDay: Record<string, number> = {
        'sunday': 0, 'monday': 0, 'tuesday': 0, 'wednesday': 0,
        'thursday': 0, 'friday': 0, 'saturday': 0
    };

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    events.filter(e => e.eventType === 'dashboard_access').forEach(event => {
        const dayIndex = new Date(event.timestamp).getDay();
        accessByDay[dayNames[dayIndex]]++;
    });

    // Acessos por semana (últimas 4 semanas)
    const accessByWeek: Record<string, number> = {};
    const now = new Date();
    for (let i = 0; i < 4; i++) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
        const weekKey = `Week ${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
        accessByWeek[weekKey] = 0;
    }

    events.filter(e => e.eventType === 'dashboard_access').forEach(event => {
        const eventDate = new Date(event.timestamp);
        const weeksDiff = Math.floor((now.getTime() - eventDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (weeksDiff < 4) {
            const weekStart = new Date(eventDate);
            weekStart.setDate(eventDate.getDate() - eventDate.getDay());
            const weekKey = `Week ${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
            if (accessByWeek[weekKey] !== undefined) {
                accessByWeek[weekKey]++;
            }
        }
    });

    // Breakdown por dispositivo
    const deviceBreakdown: Record<string, number> = {};
    events.forEach(event => {
        const deviceType = event.technicalContext.deviceType;
        deviceBreakdown[deviceType] = (deviceBreakdown[deviceType] || 0) + 1;
    });

    // Breakdown por tipo de chart
    const chartTypeBreakdown: Record<string, number> = {};
    events.forEach(event => {
        const chartType = event.dashboardInfo.chartType;
        chartTypeBreakdown[chartType] = (chartTypeBreakdown[chartType] || 0) + 1;
    });

    return {
        totalAccesses,
        uniqueUsers,
        averageSessionDuration,
        topUsers,
        accessByHour,
        accessByDay,
        accessByWeek,
        deviceBreakdown,
        chartTypeBreakdown,
    };
}

/**
 * Obter todos os eventos dos últimos N dias
 */
async function getAllEventsFromLastDays(days: number): Promise<DashboardAccessEvent[]> {
    const events: DashboardAccessEvent[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        try {
            const filePath = path.join(METRICS_DIR, `dashboard-metrics-${dateStr}.jsonl`);
            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.trim().split('\n').filter(line => line.trim());

            for (const line of lines) {
                try {
                    const event = JSON.parse(line) as DashboardAccessEvent;
                    events.push(event);
                } catch (parseError) {
                    console.warn('Failed to parse dashboard metrics line:', parseError);
                }
            }
        } catch (fileError) {
            // Arquivo não existe para este dia - normal
        }
    }

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Obter eventos de dashboard com filtros
 */
async function getDashboardEvents(options: {
    offset: number;
    limit: number;
    eventType?: string;
    userId?: string;
}): Promise<DashboardAccessEvent[]> {
    const allEvents = await getAllEventsFromLastDays(30); // Últimos 30 dias

    let filteredEvents = allEvents;

    if (options.eventType) {
        filteredEvents = filteredEvents.filter(e => e.eventType === options.eventType);
    }

    if (options.userId) {
        filteredEvents = filteredEvents.filter(e => e.user.userId === options.userId);
    }

    return filteredEvents.slice(options.offset, options.offset + options.limit);
}

export default router;