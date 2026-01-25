/**
 * Sistema de armazenamento estendido para observabilidade completa
 * Inclui analytics, auditoria, métricas e logs
 */

import fs from 'fs/promises';
import path from 'path';
import type { AnalyticsEvent } from '../../../shared/types/analytics';
import type { AuditEvent } from '../../../shared/utils/observability';

/**
 * Interface para storage de observabilidade
 */
export interface ObservabilityStorage {
    // Analytics
    save(event: AnalyticsEvent): Promise<void>;
    saveBatch(events: AnalyticsEvent[]): Promise<void>;
    readEvents(options: ReadEventsOptions): Promise<AnalyticsEvent[]>;
    getTotalEvents(): Promise<number>;

    // Auditoria
    saveAuditEvent(event: AuditEvent): Promise<void>;
    readAuditEvents(options: ReadAuditEventsOptions): Promise<AuditEvent[]>;
    getTotalAuditEvents(): Promise<number>;
    getAuditSummary(days: number): Promise<AuditSummary>;

    // Métricas e estatísticas
    getUsageStats(days: number, chartType?: string): Promise<UsageStats>;
    getPerformanceStats(days: number, chartType?: string): Promise<PerformanceStats>;
    getErrorStats(days: number, chartType?: string): Promise<ErrorStats>;
    getUserStats(days: number): Promise<UserStats>;
    getRealtimeStats(minutes: number): Promise<RealtimeStats>;

    // Manutenção
    healthCheck(): Promise<void>;
    cleanup(retentionDays: number): Promise<void>;
}

export interface ReadEventsOptions {
    offset?: number;
    limit?: number;
    type?: AnalyticsEvent['type'];
    chartType?: AnalyticsEvent['chartType'];
    startDate?: string;
    endDate?: string;
}

export interface ReadAuditEventsOptions {
    offset?: number;
    limit?: number;
    action?: AuditEvent['action'];
    resource?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
}

export interface AuditSummary {
    totalEvents: number;
    byAction: Record<string, number>;
    byResource: Record<string, number>;
    byUser: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
    topResources: Array<{ resource: string; count: number }>;
}

export interface UsageStats {
    totalEvents: number;
    byChartType: Record<string, number>;
    dailyTrend: Array<{ date: string; count: number }>;
    topConfigurations: Array<{ config: string; count: number }>;
}

export interface PerformanceStats {
    avgRenderTime: number;
    medianRenderTime: number;
    p95RenderTime: number;
    byChartType: Record<string, {
        avgRenderTime: number;
        medianRenderTime: number;
        p95RenderTime: number;
    }>;
    dailyTrend: Array<{ date: string; avgRenderTime: number }>;
}

export interface ErrorStats {
    totalErrors: number;
    errorRate: number;
    byChartType: Record<string, number>;
    topErrors: Array<{ error: string; count: number }>;
    dailyTrend: Array<{ date: string; count: number }>;
}

export interface UserStats {
    uniqueUsers: number;
    uniqueSessions: number;
    avgSessionDuration: number;
    topUsers: Array<{ userId: string; sessionCount: number }>;
    userAgents: Record<string, number>;
}

export interface RealtimeStats {
    activeUsers: number;
    activeSessions: number;
    recentEvents: number;
    recentErrors: number;
    avgResponseTime: number;
}

/**
 * Implementação de storage baseada em arquivos com suporte completo a observabilidade
 */
export class FileObservabilityStorage implements ObservabilityStorage {
    private baseLogPath: string;
    private auditLogPath: string;

    constructor(baseLogPath: string) {
        this.baseLogPath = baseLogPath;
        this.auditLogPath = baseLogPath.replace('analytics', 'audit');
        this.ensureDirectories();
    }

    /**
     * Garante que os diretórios existem
     */
    private async ensureDirectories(): Promise<void> {
        const analyticsDir = path.dirname(this.baseLogPath);
        const auditDir = path.dirname(this.auditLogPath);

        await fs.mkdir(analyticsDir, { recursive: true });
        await fs.mkdir(auditDir, { recursive: true });
    }

    /**
     * Obtém caminho do arquivo para uma data específica
     */
    private getLogPath(type: 'analytics' | 'audit', date?: Date): string {
        const now = date || new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        const basePath = type === 'audit' ? this.auditLogPath : this.baseLogPath;
        const dir = path.dirname(basePath);
        const filename = `${type}-${year}-${month}-${day}.jsonl`;

        return path.join(dir, filename);
    }

    /**
     * Salva evento de analytics
     */
    async save(event: AnalyticsEvent): Promise<void> {
        const logPath = this.getLogPath('analytics');
        const logLine = JSON.stringify(event) + '\n';
        await fs.appendFile(logPath, logLine, 'utf8');
    }

    /**
     * Salva múltiplos eventos de analytics
     */
    async saveBatch(events: AnalyticsEvent[]): Promise<void> {
        if (events.length === 0) return;

        const logPath = this.getLogPath('analytics');
        const logLines = events.map(event => JSON.stringify(event)).join('\n') + '\n';
        await fs.appendFile(logPath, logLines, 'utf8');
    }

    /**
     * Salva evento de auditoria
     */
    async saveAuditEvent(event: AuditEvent): Promise<void> {
        const logPath = this.getLogPath('audit');
        const logLine = JSON.stringify(event) + '\n';
        await fs.appendFile(logPath, logLine, 'utf8');
    }

    /**
     * Lê eventos de analytics com filtros
     */
    async readEvents(options: ReadEventsOptions = {}): Promise<AnalyticsEvent[]> {
        const { offset = 0, limit = 1000, type, chartType, startDate, endDate } = options;

        const files = await this.getLogFiles('analytics', startDate, endDate);
        const events: AnalyticsEvent[] = [];

        for (const file of files) {
            const content = await fs.readFile(file, 'utf8');
            const lines = content.trim().split('\n').filter(line => line.trim());

            for (const line of lines) {
                try {
                    const event = JSON.parse(line) as AnalyticsEvent;

                    // Aplica filtros
                    if (type && event.type !== type) continue;
                    if (chartType && event.chartType !== chartType) continue;

                    events.push(event);
                } catch (error) {
                    console.warn('Failed to parse analytics event:', line);
                }
            }
        }

        // Ordena por timestamp (mais recente primeiro)
        events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return events.slice(offset, offset + limit);
    }

    /**
     * Lê eventos de auditoria com filtros
     */
    async readAuditEvents(options: ReadAuditEventsOptions = {}): Promise<AuditEvent[]> {
        const { offset = 0, limit = 100, action, resource, userId, startDate, endDate } = options;

        const files = await this.getLogFiles('audit', startDate, endDate);
        const events: AuditEvent[] = [];

        for (const file of files) {
            const content = await fs.readFile(file, 'utf8');
            const lines = content.trim().split('\n').filter(line => line.trim());

            for (const line of lines) {
                try {
                    const event = JSON.parse(line) as AuditEvent;

                    // Aplica filtros
                    if (action && event.action !== action) continue;
                    if (resource && !event.resource.includes(resource)) continue;
                    if (userId && event.userContext.userId !== userId) continue;

                    events.push(event);
                } catch (error) {
                    console.warn('Failed to parse audit event:', line);
                }
            }
        }

        // Ordena por timestamp (mais recente primeiro)
        events.sort((a, b) => new Date(b.userContext.timestamp).getTime() - new Date(a.userContext.timestamp).getTime());

        return events.slice(offset, offset + limit);
    }

    /**
     * Obtém arquivos de log para um período
     */
    private async getLogFiles(type: 'analytics' | 'audit', startDate?: string, endDate?: string): Promise<string[]> {
        const dir = path.dirname(type === 'audit' ? this.auditLogPath : this.baseLogPath);

        try {
            const files = await fs.readdir(dir);
            const logFiles = files
                .filter(file => file.startsWith(`${type}-`) && file.endsWith('.jsonl'))
                .map(file => path.join(dir, file));

            if (!startDate && !endDate) {
                return logFiles;
            }

            // Filtra por data se especificado
            return logFiles.filter(file => {
                const filename = path.basename(file);
                const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
                if (!dateMatch) return false;

                const fileDate = dateMatch[1];
                if (startDate && fileDate < startDate) return false;
                if (endDate && fileDate > endDate) return false;

                return true;
            });
        } catch (error) {
            return [];
        }
    }

    /**
     * Conta total de eventos de analytics
     */
    async getTotalEvents(): Promise<number> {
        const files = await this.getLogFiles('analytics');
        let total = 0;

        for (const file of files) {
            try {
                const content = await fs.readFile(file, 'utf8');
                const lines = content.trim().split('\n').filter(line => line.trim());
                total += lines.length;
            } catch (error) {
                console.warn('Failed to count events in file:', file);
            }
        }

        return total;
    }

    /**
     * Conta total de eventos de auditoria
     */
    async getTotalAuditEvents(): Promise<number> {
        const files = await this.getLogFiles('audit');
        let total = 0;

        for (const file of files) {
            try {
                const content = await fs.readFile(file, 'utf8');
                const lines = content.trim().split('\n').filter(line => line.trim());
                total += lines.length;
            } catch (error) {
                console.warn('Failed to count audit events in file:', file);
            }
        }

        return total;
    }

    /**
     * Gera resumo de auditoria
     */
    async getAuditSummary(days: number): Promise<AuditSummary> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const events = await this.readAuditEvents({
            startDate: startDate.toISOString().split('T')[0],
            limit: 10000,
        });

        const byAction: Record<string, number> = {};
        const byResource: Record<string, number> = {};
        const byUser: Record<string, number> = {};

        events.forEach(event => {
            byAction[event.action] = (byAction[event.action] || 0) + 1;
            byResource[event.resource] = (byResource[event.resource] || 0) + 1;

            if (event.userContext.userId) {
                byUser[event.userContext.userId] = (byUser[event.userContext.userId] || 0) + 1;
            }
        });

        const topUsers = Object.entries(byUser)
            .map(([userId, count]) => ({ userId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const topResources = Object.entries(byResource)
            .map(([resource, count]) => ({ resource, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            totalEvents: events.length,
            byAction,
            byResource,
            byUser,
            topUsers,
            topResources,
        };
    }

    /**
     * Obtém estatísticas de uso
     */
    async getUsageStats(days: number, chartType?: string): Promise<UsageStats> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const events = await this.readEvents({
            type: 'usage',
            chartType: chartType as any,
            startDate: startDate.toISOString().split('T')[0],
            limit: 10000,
        });

        const byChartType: Record<string, number> = {};
        const dailyCount: Record<string, number> = {};
        const configCount: Record<string, number> = {};

        events.forEach(event => {
            byChartType[event.chartType] = (byChartType[event.chartType] || 0) + 1;

            const date = event.timestamp.split('T')[0];
            dailyCount[date] = (dailyCount[date] || 0) + 1;

            if (event.type === 'usage') {
                const configKey = JSON.stringify(event.config);
                configCount[configKey] = (configCount[configKey] || 0) + 1;
            }
        });

        const dailyTrend = Object.entries(dailyCount)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        const topConfigurations = Object.entries(configCount)
            .map(([config, count]) => ({ config, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            totalEvents: events.length,
            byChartType,
            dailyTrend,
            topConfigurations,
        };
    }

    /**
     * Obtém estatísticas de performance
     */
    async getPerformanceStats(days: number, chartType?: string): Promise<PerformanceStats> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const events = await this.readEvents({
            type: 'performance',
            chartType: chartType as any,
            startDate: startDate.toISOString().split('T')[0],
            limit: 10000,
        });

        const renderTimes: number[] = [];
        const byChartType: Record<string, number[]> = {};
        const dailyTimes: Record<string, number[]> = {};

        events.forEach(event => {
            if (event.type === 'performance' && event.renderTime) {
                renderTimes.push(event.renderTime);

                if (!byChartType[event.chartType]) {
                    byChartType[event.chartType] = [];
                }
                byChartType[event.chartType].push(event.renderTime);

                const date = event.timestamp.split('T')[0];
                if (!dailyTimes[date]) {
                    dailyTimes[date] = [];
                }
                dailyTimes[date].push(event.renderTime);
            }
        });

        const avgRenderTime = renderTimes.length > 0 ?
            renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length : 0;

        const sortedTimes = [...renderTimes].sort((a, b) => a - b);
        const medianRenderTime = sortedTimes.length > 0 ?
            sortedTimes[Math.floor(sortedTimes.length / 2)] : 0;
        const p95RenderTime = sortedTimes.length > 0 ?
            sortedTimes[Math.floor(sortedTimes.length * 0.95)] : 0;

        const chartTypeStats: Record<string, any> = {};
        Object.entries(byChartType).forEach(([type, times]) => {
            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            const sorted = [...times].sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)];
            const p95 = sorted[Math.floor(sorted.length * 0.95)];

            chartTypeStats[type] = {
                avgRenderTime: avg,
                medianRenderTime: median,
                p95RenderTime: p95,
            };
        });

        const dailyTrend = Object.entries(dailyTimes)
            .map(([date, times]) => ({
                date,
                avgRenderTime: times.reduce((a, b) => a + b, 0) / times.length,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            avgRenderTime,
            medianRenderTime,
            p95RenderTime,
            byChartType: chartTypeStats,
            dailyTrend,
        };
    }

    /**
     * Obtém estatísticas de erros
     */
    async getErrorStats(days: number, chartType?: string): Promise<ErrorStats> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [errorEvents, totalEvents] = await Promise.all([
            this.readEvents({
                type: 'error',
                chartType: chartType as any,
                startDate: startDate.toISOString().split('T')[0],
                limit: 10000,
            }),
            this.readEvents({
                startDate: startDate.toISOString().split('T')[0],
                limit: 10000,
            }),
        ]);

        const byChartType: Record<string, number> = {};
        const errorCount: Record<string, number> = {};
        const dailyCount: Record<string, number> = {};

        errorEvents.forEach(event => {
            byChartType[event.chartType] = (byChartType[event.chartType] || 0) + 1;

            if (event.type === 'error') {
                errorCount[event.error] = (errorCount[event.error] || 0) + 1;
            }

            const date = event.timestamp.split('T')[0];
            dailyCount[date] = (dailyCount[date] || 0) + 1;
        });

        const topErrors = Object.entries(errorCount)
            .map(([error, count]) => ({ error, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const dailyTrend = Object.entries(dailyCount)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        const errorRate = totalEvents.length > 0 ?
            (errorEvents.length / totalEvents.length) * 100 : 0;

        return {
            totalErrors: errorEvents.length,
            errorRate,
            byChartType,
            topErrors,
            dailyTrend,
        };
    }

    /**
     * Obtém estatísticas de usuários
     */
    async getUserStats(days: number): Promise<UserStats> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const events = await this.readEvents({
            startDate: startDate.toISOString().split('T')[0],
            limit: 10000,
        });

        const uniqueUsers = new Set<string>();
        const uniqueSessions = new Set<string>();
        const userSessions: Record<string, Set<string>> = {};
        const userAgents: Record<string, number> = {};

        events.forEach(event => {
            if (event.userId) {
                uniqueUsers.add(event.userId);

                if (!userSessions[event.userId]) {
                    userSessions[event.userId] = new Set();
                }
                userSessions[event.userId].add(event.sessionId);
            }

            uniqueSessions.add(event.sessionId);

            if (event.userAgent) {
                userAgents[event.userAgent] = (userAgents[event.userAgent] || 0) + 1;
            }
        });

        const topUsers = Object.entries(userSessions)
            .map(([userId, sessions]) => ({ userId, sessionCount: sessions.size }))
            .sort((a, b) => b.sessionCount - a.sessionCount)
            .slice(0, 10);

        return {
            uniqueUsers: uniqueUsers.size,
            uniqueSessions: uniqueSessions.size,
            avgSessionDuration: 0, // Calcularia baseado em timestamps
            topUsers,
            userAgents,
        };
    }

    /**
     * Obtém estatísticas em tempo real
     */
    async getRealtimeStats(minutes: number): Promise<RealtimeStats> {
        const startTime = new Date();
        startTime.setMinutes(startTime.getMinutes() - minutes);

        const events = await this.readEvents({
            startDate: startTime.toISOString().split('T')[0],
            limit: 1000,
        });

        const recentEvents = events.filter(event =>
            new Date(event.timestamp) >= startTime
        );

        const activeUsers = new Set<string>();
        const activeSessions = new Set<string>();
        let recentErrors = 0;
        const renderTimes: number[] = [];

        recentEvents.forEach(event => {
            if (event.userId) activeUsers.add(event.userId);
            activeSessions.add(event.sessionId);

            if (event.type === 'error') recentErrors++;
            if (event.type === 'performance' && event.renderTime) {
                renderTimes.push(event.renderTime);
            }
        });

        const avgResponseTime = renderTimes.length > 0 ?
            renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length : 0;

        return {
            activeUsers: activeUsers.size,
            activeSessions: activeSessions.size,
            recentEvents: recentEvents.length,
            recentErrors,
            avgResponseTime,
        };
    }

    /**
     * Verifica saúde do sistema de armazenamento
     */
    async healthCheck(): Promise<void> {
        // Tenta escrever um arquivo de teste
        const testPath = path.join(path.dirname(this.baseLogPath), 'health-check.tmp');
        await fs.writeFile(testPath, 'health check', 'utf8');
        await fs.unlink(testPath);
    }

    /**
     * Limpa arquivos antigos
     */
    async cleanup(retentionDays: number): Promise<void> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const cutoffString = cutoffDate.toISOString().split('T')[0];

        for (const type of ['analytics', 'audit'] as const) {
            const files = await this.getLogFiles(type);

            for (const file of files) {
                const filename = path.basename(file);
                const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);

                if (dateMatch && dateMatch[1] < cutoffString) {
                    try {
                        await fs.unlink(file);
                        console.log(`Removed old log file: ${file}`);
                    } catch (error) {
                        console.warn(`Failed to remove old log file ${file}:`, error);
                    }
                }
            }
        }
    }
}

/**
 * Instância singleton do storage de observabilidade
 */
let observabilityStorage: FileObservabilityStorage | null = null;

/**
 * Obtém instância do storage de observabilidade
 */
export function getObservabilityStorage(): FileObservabilityStorage {
    if (!observabilityStorage) {
        const logPath = process.env.ANALYTICS_LOG_PATH || './logs/analytics.jsonl';
        observabilityStorage = new FileObservabilityStorage(logPath);
    }
    return observabilityStorage;
}