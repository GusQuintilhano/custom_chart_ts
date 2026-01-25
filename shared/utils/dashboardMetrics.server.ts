/**
 * Versão server-safe das métricas de dashboard
 * Para uso no charts-router (Node.js)
 */

export interface DashboardAccessEvent {
    eventId: string;
    timestamp: string;
    eventType: 'dashboard_access' | 'chart_view' | 'chart_interaction' | 'session_start' | 'session_end';

    // Informações do usuário
    user: {
        userId?: string;
        username?: string;
        email?: string;
        displayName?: string;
        orgId?: string;
        orgName?: string;
        groups?: string[];
        roles?: string[];
        sessionInfo?: {
            sessionId: string;
            loginTime?: string;
            lastActivity?: string;
        };
        browserInfo?: {
            userAgent: string;
            language: string;
            timezone: string;
            screenResolution: string;
        };
        source: 'thoughtspot_context' | 'thoughtspot_model' | 'browser_fingerprint' | 'session_storage' | 'url_params' | 'unknown';
    };

    // Informações do dashboard/chart
    dashboardInfo: {
        chartType: 'trellis' | 'boxplot';
        chartId?: string;
        dashboardId?: string;
        dashboardName?: string;
        url: string;
        referrer?: string;
    };

    // Métricas de acesso
    accessMetrics: {
        sessionDuration?: number; // em milissegundos
        pageViews: number;
        interactions: number;
        timeOnChart?: number; // tempo focado no chart específico
        scrollDepth?: number; // % da página visualizada
    };

    // Contexto técnico
    technicalContext: {
        userAgent: string;
        screenResolution: string;
        browserLanguage: string;
        timezone: string;
        connectionType?: string;
        deviceType: 'desktop' | 'tablet' | 'mobile' | 'unknown';
    };

    // Dados de performance
    performanceMetrics?: {
        loadTime: number;
        renderTime: number;
        interactionLatency: number;
        errorCount: number;
    };
}

export interface DashboardUsageStats {
    totalAccesses: number;
    uniqueUsers: number;
    averageSessionDuration: number;
    topUsers: Array<{
        userId: string;
        username?: string;
        accessCount: number;
        totalTime: number;
        lastAccess: string;
    }>;
    accessByHour: Record<string, number>;
    accessByDay: Record<string, number>;
    accessByWeek: Record<string, number>;
    deviceBreakdown: Record<string, number>;
    chartTypeBreakdown: Record<string, number>;
}

// Exportar apenas os tipos para uso no servidor
export type { DashboardAccessEvent as ServerDashboardAccessEvent };
export type { DashboardUsageStats as ServerDashboardUsageStats };