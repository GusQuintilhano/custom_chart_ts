/**
 * Sistema de métricas de dashboard para rastreamento de acesso e uso
 * Foco em "quem e quanto acesso o dashboard"
 */

import type { UserInfo } from './userTracking';

export interface DashboardAccessEvent {
    eventId: string;
    timestamp: string;
    eventType: 'dashboard_access' | 'chart_view' | 'chart_interaction' | 'session_start' | 'session_end';

    // Informações do usuário
    user: UserInfo;

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

/**
 * Classe para rastreamento de métricas de dashboard
 */
export class DashboardMetrics {
    private static instance: DashboardMetrics;
    private sessionStartTime: number = Date.now();
    private pageViews: number = 0;
    private interactions: number = 0;
    private chartStartTime: number = 0;
    private currentUser: UserInfo | null = null;
    private eventQueue: DashboardAccessEvent[] = [];
    private flushTimer: ReturnType<typeof setInterval> | null = null;

    static getInstance(): DashboardMetrics {
        if (!DashboardMetrics.instance) {
            DashboardMetrics.instance = new DashboardMetrics();
        }
        return DashboardMetrics.instance;
    }

    constructor() {
        this.startFlushTimer();
        this.setupPageVisibilityTracking();
        this.setupUnloadTracking();
    }

    /**
     * Inicializar sessão de usuário
     */
    startSession(user: UserInfo, chartType: 'trellis' | 'boxplot'): void {
        this.currentUser = user;
        this.sessionStartTime = Date.now();
        this.pageViews = 1;
        this.interactions = 0;
        this.chartStartTime = Date.now();

        const event: DashboardAccessEvent = {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            eventType: 'session_start',
            user,
            dashboardInfo: {
                chartType,
                url: typeof window !== 'undefined' ? window.location.href : '',
                referrer: typeof window !== 'undefined' ? document.referrer : undefined,
            },
            accessMetrics: {
                pageViews: this.pageViews,
                interactions: this.interactions,
            },
            technicalContext: this.getTechnicalContext(),
        };

        this.queueEvent(event);
    }

    /**
     * Rastrear acesso ao dashboard
     */
    trackDashboardAccess(user: UserInfo, chartType: 'trellis' | 'boxplot', additionalInfo?: {
        chartId?: string;
        dashboardId?: string;
        dashboardName?: string;
    }): void {
        this.currentUser = user;
        this.pageViews++;

        const event: DashboardAccessEvent = {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            eventType: 'dashboard_access',
            user,
            dashboardInfo: {
                chartType,
                chartId: additionalInfo?.chartId,
                dashboardId: additionalInfo?.dashboardId,
                dashboardName: additionalInfo?.dashboardName,
                url: typeof window !== 'undefined' ? window.location.href : '',
                referrer: typeof window !== 'undefined' ? document.referrer : undefined,
            },
            accessMetrics: {
                sessionDuration: Date.now() - this.sessionStartTime,
                pageViews: this.pageViews,
                interactions: this.interactions,
                scrollDepth: this.getScrollDepth(),
            },
            technicalContext: this.getTechnicalContext(),
        };

        this.queueEvent(event);
    }

    /**
     * Rastrear visualização de chart específico
     */
    trackChartView(chartType: 'trellis' | 'boxplot', chartId?: string): void {
        if (!this.currentUser) return;

        this.chartStartTime = Date.now();

        const event: DashboardAccessEvent = {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            eventType: 'chart_view',
            user: this.currentUser,
            dashboardInfo: {
                chartType,
                chartId,
                url: typeof window !== 'undefined' ? window.location.href : '',
            },
            accessMetrics: {
                sessionDuration: Date.now() - this.sessionStartTime,
                pageViews: this.pageViews,
                interactions: this.interactions,
                timeOnChart: 0, // Será atualizado quando sair do chart
            },
            technicalContext: this.getTechnicalContext(),
        };

        this.queueEvent(event);
    }

    /**
     * Rastrear interação com chart
     */
    trackChartInteraction(chartType: 'trellis' | 'boxplot', interactionType: string, element?: string): void {
        if (!this.currentUser) return;

        this.interactions++;

        const event: DashboardAccessEvent = {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            eventType: 'chart_interaction',
            user: this.currentUser,
            dashboardInfo: {
                chartType,
                url: typeof window !== 'undefined' ? window.location.href : '',
            },
            accessMetrics: {
                sessionDuration: Date.now() - this.sessionStartTime,
                pageViews: this.pageViews,
                interactions: this.interactions,
                timeOnChart: this.chartStartTime > 0 ? Date.now() - this.chartStartTime : 0,
            },
            technicalContext: this.getTechnicalContext(),
        };

        this.queueEvent(event);
    }

    /**
     * Finalizar sessão
     */
    endSession(): void {
        if (!this.currentUser) return;

        const event: DashboardAccessEvent = {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            eventType: 'session_end',
            user: this.currentUser,
            dashboardInfo: {
                chartType: 'trellis', // Default, pode ser ajustado
                url: typeof window !== 'undefined' ? window.location.href : '',
            },
            accessMetrics: {
                sessionDuration: Date.now() - this.sessionStartTime,
                pageViews: this.pageViews,
                interactions: this.interactions,
                timeOnChart: this.chartStartTime > 0 ? Date.now() - this.chartStartTime : 0,
                scrollDepth: this.getScrollDepth(),
            },
            technicalContext: this.getTechnicalContext(),
        };

        this.queueEvent(event);
        this.flush(); // Enviar imediatamente ao finalizar sessão
    }

    /**
     * Obter contexto técnico
     */
    private getTechnicalContext(): DashboardAccessEvent['technicalContext'] {
        if (typeof window === 'undefined') {
            return {
                userAgent: 'server-side',
                screenResolution: 'unknown',
                browserLanguage: 'unknown',
                timezone: 'unknown',
                deviceType: 'unknown',
            };
        }

        return {
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            browserLanguage: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            connectionType: (navigator as any).connection?.effectiveType || 'unknown',
            deviceType: this.detectDeviceType(),
        };
    }

    /**
     * Detectar tipo de dispositivo
     */
    private detectDeviceType(): 'desktop' | 'tablet' | 'mobile' | 'unknown' {
        if (typeof window === 'undefined') return 'unknown';

        const userAgent = navigator.userAgent.toLowerCase();
        const screenWidth = screen.width;

        if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
            return 'mobile';
        } else if (/tablet|ipad/i.test(userAgent) || (screenWidth >= 768 && screenWidth <= 1024)) {
            return 'tablet';
        } else if (screenWidth > 1024) {
            return 'desktop';
        }

        return 'unknown';
    }

    /**
     * Obter profundidade de scroll
     */
    private getScrollDepth(): number {
        if (typeof window === 'undefined') return 0;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;

        if (documentHeight <= 0) return 100;

        return Math.round((scrollTop / documentHeight) * 100);
    }

    /**
     * Gerar ID único para evento
     */
    private generateEventId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Adicionar evento à fila
     */
    private queueEvent(event: DashboardAccessEvent): void {
        this.eventQueue.push(event);

        // Enviar em lotes de 5 eventos ou a cada 10 segundos
        if (this.eventQueue.length >= 5) {
            this.flush();
        }
    }

    /**
     * Enviar eventos para o servidor
     */
    private async flush(): Promise<void> {
        if (this.eventQueue.length === 0) return;

        const events = [...this.eventQueue];
        this.eventQueue = [];

        try {
            const response = await fetch('/api/analytics/dashboard-metrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ events }),
            });

            if (!response.ok) {
                console.warn('Failed to send dashboard metrics:', response.status);
                // Re-adicionar à fila em caso de erro
                this.eventQueue.unshift(...events);
            }
        } catch (error) {
            console.warn('Error sending dashboard metrics:', error);
            // Re-adicionar à fila em caso de erro
            this.eventQueue.unshift(...events);
        }
    }

    /**
     * Configurar timer para flush periódico
     */
    private startFlushTimer(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        this.flushTimer = setInterval(() => {
            this.flush();
        }, 10000); // A cada 10 segundos
    }

    /**
     * Rastrear visibilidade da página
     */
    private setupPageVisibilityTracking(): void {
        if (typeof document === 'undefined') return;

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Página ficou oculta - pausar contadores
                this.flush(); // Enviar dados antes de pausar
            } else {
                // Página ficou visível - retomar contadores
                this.chartStartTime = Date.now(); // Reiniciar contador de tempo no chart
            }
        });
    }

    /**
     * Rastrear saída da página
     */
    private setupUnloadTracking(): void {
        if (typeof window === 'undefined') return;

        window.addEventListener('beforeunload', () => {
            this.endSession();
        });

        // Fallback para navegadores que não suportam beforeunload
        window.addEventListener('pagehide', () => {
            this.endSession();
        });
    }

    /**
     * Limpar recursos
     */
    destroy(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        this.flush();
    }
}

/**
 * Instância singleton para uso direto
 */
export const dashboardMetrics = DashboardMetrics.getInstance();