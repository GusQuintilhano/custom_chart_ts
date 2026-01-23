/**
 * Sistema de Observabilidade Avançado para Custom Charts
 * 
 * Este módulo fornece observabilidade completa incluindo:
 * - Rastreamento de usuários e sessões
 * - Métricas de performance detalhadas
 * - Logs estruturados
 * - Monitoramento de erros
 * - Auditoria de configurações
 * - Geolocalização e contexto do usuário
 */

import type { AnalyticsEvent, ChartType } from '../types/analytics';

/**
 * Informações estendidas do usuário e contexto
 */
export interface UserContext {
    userId?: string;
    sessionId: string;
    userAgent: string;
    ip?: string;
    country?: string;
    city?: string;
    organization?: string;
    department?: string;
    role?: string;
    timestamp: string;
}

/**
 * Métricas de performance detalhadas
 */
export interface PerformanceMetrics {
    renderTime: number;
    dataProcessingTime: number;
    domManipulationTime: number;
    networkTime?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    dataSize: number;
    numDataPoints: number;
    numMeasures: number;
    numDimensions: number;
    containerWidth: number;
    containerHeight: number;
    devicePixelRatio: number;
    browserEngine: string;
}

/**
 * Evento de auditoria para rastrear mudanças
 */
export interface AuditEvent {
    action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'share';
    resource: string;
    resourceId?: string;
    oldValue?: unknown;
    newValue?: unknown;
    userContext: UserContext;
    metadata?: Record<string, unknown>;
}

/**
 * Configuração de observabilidade
 */
export interface ObservabilityConfig {
    enabled: boolean;
    endpoints: {
        analytics: string;
        logs: string;
        metrics: string;
        audit: string;
    };
    sampling: {
        performance: number; // 0-1, porcentagem de eventos para capturar
        interactions: number;
        errors: number; // sempre 1.0 para erros
    };
    privacy: {
        collectIP: boolean;
        collectUserAgent: boolean;
        collectGeolocation: boolean;
        anonymizeUserId: boolean;
    };
    retention: {
        analytics: number; // dias
        logs: number;
        metrics: number;
        audit: number;
    };
}

/**
 * Cliente de observabilidade avançado
 */
class ObservabilityClient {
    private config: ObservabilityConfig;
    private userContext: UserContext;
    private performanceObserver?: PerformanceObserver;
    private eventQueue: Array<AnalyticsEvent | AuditEvent> = [];
    private flushTimer: ReturnType<typeof setInterval> | null = null;

    constructor(config: ObservabilityConfig) {
        this.config = config;
        this.userContext = this.initializeUserContext();
        this.setupPerformanceObserver();
        this.startFlushTimer();
        this.setupErrorHandling();
    }

    /**
     * Inicializa contexto do usuário
     */
    private initializeUserContext(): UserContext {
        const sessionId = this.generateSessionId();
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';

        return {
            sessionId,
            userAgent: this.config.privacy.collectUserAgent ? userAgent : 'Anonymous',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Configura observador de performance
     */
    private setupPerformanceObserver(): void {
        if (typeof PerformanceObserver === 'undefined') return;

        try {
            this.performanceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.entryType === 'measure' && entry.name.startsWith('chart-')) {
                        this.trackCustomPerformance(entry);
                    }
                });
            });

            this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
        } catch (error) {
            console.warn('Performance Observer not supported:', error);
        }
    }

    /**
     * Configura tratamento global de erros
     */
    private setupErrorHandling(): void {
        if (typeof window === 'undefined') return;

        // Erros JavaScript não capturados
        window.addEventListener('error', (event) => {
            this.trackError('unknown', event.error || event.message, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                type: 'javascript_error',
            });
        });

        // Promises rejeitadas não capturadas
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError('unknown', event.reason, {
                type: 'unhandled_promise_rejection',
            });
        });
    }

    /**
     * Rastreia performance customizada
     */
    private trackCustomPerformance(entry: PerformanceEntry): void {
        if (!this.shouldSample('performance')) return;

        const chartType = this.extractChartTypeFromMeasure(entry.name);
        if (!chartType) return;

        const metrics: Partial<PerformanceMetrics> = {
            renderTime: entry.duration,
            timestamp: new Date().toISOString(),
        };

        this.queueEvent({
            type: 'performance',
            chartType,
            timestamp: new Date().toISOString(),
            sessionId: this.userContext.sessionId,
            userId: this.userContext.userId,
            ...metrics,
        } as AnalyticsEvent);
    }

    /**
     * Rastreia uso do gráfico com contexto estendido
     */
    trackUsage(chartType: ChartType, config: Record<string, unknown>, additionalContext?: Record<string, unknown>): void {
        if (!this.config.enabled) return;

        const event: AnalyticsEvent = {
            type: 'usage',
            chartType,
            timestamp: new Date().toISOString(),
            sessionId: this.userContext.sessionId,
            userId: this.userContext.userId,
            config: {
                ...config,
                userContext: this.userContext,
                ...additionalContext,
            },
            userAgent: this.userContext.userAgent,
            ip: this.userContext.ip,
        };

        this.queueEvent(event);
        this.trackAudit('view', `chart-${chartType}`, undefined, config);
    }

    /**
     * Rastreia performance com métricas detalhadas
     */
    trackPerformance(chartType: ChartType, metrics: Partial<PerformanceMetrics>): void {
        if (!this.config.enabled || !this.shouldSample('performance')) return;

        // Adiciona métricas do navegador se disponível
        const enhancedMetrics = {
            ...metrics,
            devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
            browserEngine: this.getBrowserEngine(),
            memoryUsage: this.getMemoryUsage(),
            timestamp: new Date().toISOString(),
        };

        const event: AnalyticsEvent = {
            type: 'performance',
            chartType,
            timestamp: new Date().toISOString(),
            sessionId: this.userContext.sessionId,
            userId: this.userContext.userId,
            ...enhancedMetrics,
        };

        this.queueEvent(event);
    }

    /**
     * Rastreia erros com contexto detalhado
     */
    trackError(chartType: ChartType | 'unknown', error: Error | string, context?: Record<string, unknown>): void {
        if (!this.config.enabled) return;

        const errorMessage = error instanceof Error ? error.message : error;
        const stack = error instanceof Error ? error.stack : undefined;

        const event: AnalyticsEvent = {
            type: 'error',
            chartType: chartType as ChartType,
            timestamp: new Date().toISOString(),
            sessionId: this.userContext.sessionId,
            userId: this.userContext.userId,
            error: errorMessage,
            stack,
            context: {
                ...context,
                userContext: this.userContext,
                url: typeof window !== 'undefined' ? window.location.href : undefined,
                timestamp: new Date().toISOString(),
            },
        };

        this.queueEvent(event);
        this.trackAudit('view', 'error', undefined, { error: errorMessage, context });
    }

    /**
     * Rastreia interações com sampling
     */
    trackInteraction(chartType: ChartType, interactionType: string, element: string, metadata?: Record<string, unknown>): void {
        if (!this.config.enabled || !this.shouldSample('interactions')) return;

        const event: AnalyticsEvent = {
            type: 'interaction',
            chartType,
            timestamp: new Date().toISOString(),
            sessionId: this.userContext.sessionId,
            userId: this.userContext.userId,
            interactionType: interactionType as any,
            element,
            metadata: {
                ...metadata,
                userContext: this.userContext,
            },
        };

        this.queueEvent(event);
    }

    /**
     * Rastreia auditoria de ações
     */
    trackAudit(action: AuditEvent['action'], resource: string, resourceId?: string, data?: Record<string, unknown>): void {
        if (!this.config.enabled) return;

        const auditEvent: AuditEvent = {
            action,
            resource,
            resourceId,
            newValue: data,
            userContext: this.userContext,
            metadata: {
                timestamp: new Date().toISOString(),
                url: typeof window !== 'undefined' ? window.location.href : undefined,
            },
        };

        this.queueEvent(auditEvent);
    }

    /**
     * Atualiza contexto do usuário
     */
    updateUserContext(updates: Partial<UserContext>): void {
        this.userContext = {
            ...this.userContext,
            ...updates,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Determina se deve fazer sampling do evento
     */
    private shouldSample(type: keyof ObservabilityConfig['sampling']): boolean {
        const rate = this.config.sampling[type];
        return Math.random() < rate;
    }

    /**
     * Obtém informações de memória se disponível
     */
    private getMemoryUsage(): number | undefined {
        if (typeof performance !== 'undefined' && 'memory' in performance) {
            return (performance as any).memory.usedJSHeapSize;
        }
        return undefined;
    }

    /**
     * Detecta engine do navegador
     */
    private getBrowserEngine(): string {
        if (typeof navigator === 'undefined') return 'Unknown';

        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) return 'Blink';
        if (userAgent.includes('Firefox')) return 'Gecko';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'WebKit';
        if (userAgent.includes('Edge')) return 'EdgeHTML';
        return 'Unknown';
    }

    /**
     * Extrai tipo de gráfico do nome da medida
     */
    private extractChartTypeFromMeasure(measureName: string): ChartType | null {
        if (measureName.includes('trellis')) return 'trellis';
        if (measureName.includes('boxplot')) return 'boxplot';
        return null;
    }

    /**
     * Gera ID de sessão único
     */
    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Adiciona evento à fila
     */
    private queueEvent(event: AnalyticsEvent | AuditEvent): void {
        this.eventQueue.push(event);

        // Flush imediato para erros
        if ('type' in event && event.type === 'error') {
            this.flush();
        } else if (this.eventQueue.length >= 20) {
            this.flush();
        }
    }

    /**
     * Inicia timer de flush
     */
    private startFlushTimer(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        this.flushTimer = setInterval(() => {
            this.flush();
        }, 10000); // 10 segundos
    }

    /**
     * Envia eventos para o servidor
     */
    async flush(): Promise<void> {
        if (this.eventQueue.length === 0) return;

        const events = [...this.eventQueue];
        this.eventQueue = [];

        try {
            // Separa eventos por tipo
            const analyticsEvents = events.filter(e => 'type' in e) as AnalyticsEvent[];
            const auditEvents = events.filter(e => 'action' in e) as AuditEvent[];

            // Envia analytics
            if (analyticsEvents.length > 0) {
                await this.sendToEndpoint(this.config.endpoints.analytics, { events: analyticsEvents });
            }

            // Envia auditoria
            if (auditEvents.length > 0) {
                await this.sendToEndpoint(this.config.endpoints.audit, { events: auditEvents });
            }
        } catch (error) {
            console.warn('Failed to send observability events:', error);
            // Re-adiciona eventos à fila (com limite)
            if (this.eventQueue.length < 100) {
                this.eventQueue.unshift(...events);
            }
        }
    }

    /**
     * Envia dados para endpoint específico
     */
    private async sendToEndpoint(endpoint: string, data: unknown): Promise<void> {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    }

    /**
     * Limpa recursos
     */
    destroy(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }

        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }

        this.flush();
    }
}

/**
 * Configuração padrão de observabilidade
 */
const defaultConfig: ObservabilityConfig = {
    enabled: true,
    endpoints: {
        analytics: '/api/analytics/event',
        logs: '/api/logs',
        metrics: '/api/metrics',
        audit: '/api/audit',
    },
    sampling: {
        performance: 0.1, // 10% dos eventos de performance
        interactions: 0.05, // 5% das interações
        errors: 1.0, // 100% dos erros
    },
    privacy: {
        collectIP: true,
        collectUserAgent: true,
        collectGeolocation: false,
        anonymizeUserId: false,
    },
    retention: {
        analytics: 90, // 90 dias
        logs: 30,
        metrics: 365,
        audit: 2555, // 7 anos para auditoria
    },
};

/**
 * Instância singleton do cliente de observabilidade
 */
let observabilityClient: ObservabilityClient | null = null;

/**
 * Obtém ou cria instância do cliente de observabilidade
 */
export function getObservabilityClient(config?: Partial<ObservabilityConfig>): ObservabilityClient {
    if (!observabilityClient) {
        const finalConfig = { ...defaultConfig, ...config };
        observabilityClient = new ObservabilityClient(finalConfig);
    }
    return observabilityClient;
}

/**
 * API de conveniência para observabilidade
 */
export const observability = {
    trackUsage: (chartType: ChartType, config: Record<string, unknown>, context?: Record<string, unknown>) => {
        getObservabilityClient().trackUsage(chartType, config, context);
    },
    trackPerformance: (chartType: ChartType, metrics: Partial<PerformanceMetrics>) => {
        getObservabilityClient().trackPerformance(chartType, metrics);
    },
    trackError: (chartType: ChartType | 'unknown', error: Error | string, context?: Record<string, unknown>) => {
        getObservabilityClient().trackError(chartType, error, context);
    },
    trackInteraction: (chartType: ChartType, interactionType: string, element: string, metadata?: Record<string, unknown>) => {
        getObservabilityClient().trackInteraction(chartType, interactionType, element, metadata);
    },
    trackAudit: (action: AuditEvent['action'], resource: string, resourceId?: string, data?: Record<string, unknown>) => {
        getObservabilityClient().trackAudit(action, resource, resourceId, data);
    },
    updateUserContext: (updates: Partial<UserContext>) => {
        getObservabilityClient().updateUserContext(updates);
    },
};