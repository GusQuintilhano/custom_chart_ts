/**
 * Cliente de analytics para frontend
 * Envia eventos de utilização dos gráficos para o servidor
 */

import type {
    AnalyticsEvent,
    UsageEvent,
    PerformanceEvent,
    ErrorEvent,
    InteractionEvent,
    ConfigEvent,
    ChartType,
    InteractionType,
} from '../types/analytics';

/**
 * Configuração do cliente de analytics
 */
interface AnalyticsClientConfig {
    endpoint: string;
    enabled: boolean;
    batchSize?: number;
    flushInterval?: number;
}

/**
 * Cliente de analytics
 */
class AnalyticsClient {
    private config: AnalyticsClientConfig;
    private eventQueue: AnalyticsEvent[] = [];
    private flushTimer: ReturnType<typeof setInterval> | null = null;
    private sessionId: string;

    constructor(config: AnalyticsClientConfig) {
        this.config = config;
        this.sessionId = this.generateSessionId();
        this.startFlushTimer();
    }

    /**
     * Gera um ID único de sessão
     */
    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Inicia timer para flush periódico
     */
    private startFlushTimer(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        const interval = this.config.flushInterval || 5000; // 5 segundos por padrão
        this.flushTimer = setInterval(() => {
            this.flush();
        }, interval);
    }

    /**
     * Rastreia uso do gráfico
     */
    trackUsage(chartType: ChartType, config: Record<string, unknown>, userId?: string): void {
        if (!this.config.enabled) return;

        const event: UsageEvent = {
            type: 'usage',
            chartType,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            userId,
            config,
        };

        this.queueEvent(event);
    }

    /**
     * Rastreia performance de renderização
     */
    trackPerformance(event: Omit<PerformanceEvent, 'sessionId' | 'timestamp'>): void {
        if (!this.config.enabled) return;

        const fullEvent: PerformanceEvent = {
            ...event,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
        };

        this.queueEvent(fullEvent);
    }

    /**
     * Rastreia erros
     */
    trackError(chartType: ChartType, error: Error | string, context?: Record<string, unknown>): void {
        if (!this.config.enabled) return;

        const errorMessage = error instanceof Error ? error.message : error;
        const stack = error instanceof Error ? error.stack : undefined;

        const event: ErrorEvent = {
            type: 'error',
            chartType,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            error: errorMessage,
            stack,
            context: context || {},
        };

        this.queueEvent(event);
    }

    /**
     * Rastreia interações do usuário
     */
    trackInteraction(chartType: ChartType, interactionType: InteractionType, element: string, metadata?: Record<string, unknown>): void {
        if (!this.config.enabled) return;

        const event: InteractionEvent = {
            type: 'interaction',
            chartType,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            interactionType,
            element,
            metadata,
        };

        this.queueEvent(event);
    }

    /**
     * Rastreia configurações utilizadas
     */
    trackConfig(chartType: ChartType, configKey: string, configValue: unknown): void {
        if (!this.config.enabled) return;

        const event: ConfigEvent = {
            type: 'config',
            chartType,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            configKey,
            configValue,
        };

        this.queueEvent(event);
    }

    /**
     * Adiciona evento à fila
     */
    private queueEvent(event: AnalyticsEvent): void {
        this.eventQueue.push(event);

        const batchSize = this.config.batchSize || 10;
        if (this.eventQueue.length >= batchSize) {
            this.flush();
        }
    }

    /**
     * Envia eventos em lote para o servidor
     */
    async flush(): Promise<void> {
        if (this.eventQueue.length === 0) return;

        const events = [...this.eventQueue];
        this.eventQueue = [];

        // Fire and forget - não bloqueia renderização
        this.sendEvents(events).catch(err => {
            console.warn('Failed to send analytics events:', err);
            // Re-adiciona eventos à fila em caso de erro (até um limite)
            if (this.eventQueue.length < 100) {
                this.eventQueue.unshift(...events);
            }
        });
    }

    /**
     * Envia eventos para o servidor
     */
    private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
        try {
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ events }),
            });

            if (!response.ok) {
                throw new Error(`Analytics API returned ${response.status}`);
            }
        } catch (error) {
            // Silenciosamente falha - não queremos que analytics quebre o gráfico
            throw error;
        }
    }

    /**
     * Limpa recursos (chamar quando não precisar mais)
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
 * Instância singleton do cliente de analytics
 */
let analyticsClient: AnalyticsClient | null = null;

/**
 * Obtém ou cria instância do cliente de analytics
 */
export function getAnalyticsClient(): AnalyticsClient {
    if (!analyticsClient) {
        // Determina endpoint baseado no contexto
        let endpoint = '/api/analytics/event';
        
        if (typeof window !== 'undefined') {
            // Se customizado via window, usa esse
            if ((window as any).ANALYTICS_ENDPOINT) {
                endpoint = (window as any).ANALYTICS_ENDPOINT;
            }
            // Caso contrário, usa o endpoint padrão relativo à raiz
        }
        
        const enabled = typeof window !== 'undefined'
            ? (window as any).ANALYTICS_ENABLED !== false
            : true;

        analyticsClient = new AnalyticsClient({
            endpoint,
            enabled,
            batchSize: 10,
            flushInterval: 5000,
        });
    }

    return analyticsClient;
}

/**
 * Funções de conveniência para uso direto
 */
export const analytics = {
    trackUsage: (chartType: ChartType, config: Record<string, unknown>, userId?: string) => {
        getAnalyticsClient().trackUsage(chartType, config, userId);
    },
    trackPerformance: (event: Omit<PerformanceEvent, 'sessionId' | 'timestamp'>) => {
        getAnalyticsClient().trackPerformance(event);
    },
    trackError: (chartType: ChartType, error: Error | string, context?: Record<string, unknown>) => {
        getAnalyticsClient().trackError(chartType, error, context);
    },
    trackInteraction: (chartType: ChartType, interactionType: InteractionType, element: string, metadata?: Record<string, unknown>) => {
        getAnalyticsClient().trackInteraction(chartType, interactionType, element, metadata);
    },
    trackConfig: (chartType: ChartType, configKey: string, configValue: unknown) => {
        getAnalyticsClient().trackConfig(chartType, configKey, configValue);
    },
};

