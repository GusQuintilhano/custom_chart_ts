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
import type { ThoughtSpotContextInfo } from './thoughtspotContext';

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
    trackUsage(
        chartType: ChartType, 
        config: Record<string, unknown>, 
        userId?: string,
        contextInfo?: ThoughtSpotContextInfo
    ): void {
        if (!this.config.enabled) return;

        // Extrair informações de funcionalidades do config se disponível
        const features = (config.features as { usedFeatures?: string[]; appliedConfigs?: string[]; interactions?: string[] }) || undefined;
        
        // Coletar TODAS as informações disponíveis do contexto
        const event: UsageEvent = {
            type: 'usage',
            chartType,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            userId: userId || contextInfo?.userId || contextInfo?.userGuid,
            org: contextInfo?.org,
            orgId: contextInfo?.orgId,
            tenantId: contextInfo?.tenantId,
            model: contextInfo?.model,
            modelId: contextInfo?.modelId,
            worksheetId: contextInfo?.worksheetId,
            user: contextInfo?.user,
            userName: contextInfo?.userName,
            userEmail: contextInfo?.userEmail,
            userGuid: contextInfo?.userGuid,
            contextMetadata: contextInfo?.contextMetadata,
            config,
            features, // Incluir informações de funcionalidades
        };

        this.queueEvent(event);
    }

    /**
     * Rastreia performance de renderização
     */
    trackPerformance(
        event: Omit<PerformanceEvent, 'sessionId' | 'timestamp'>,
        contextInfo?: ThoughtSpotContextInfo
    ): void {
        if (!this.config.enabled) return;

        // Coletar TODAS as informações disponíveis do contexto
        const fullEvent: PerformanceEvent = {
            ...event,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            // Incluir TODAS as informações do contexto se não estiverem no evento
            userId: event.userId || contextInfo?.userId || contextInfo?.userGuid,
            org: event.org || contextInfo?.org,
            orgId: event.orgId || contextInfo?.orgId,
            tenantId: event.tenantId || contextInfo?.tenantId,
            model: event.model || contextInfo?.model,
            modelId: event.modelId || contextInfo?.modelId,
            worksheetId: event.worksheetId || contextInfo?.worksheetId,
            user: event.user || contextInfo?.user,
            userName: event.userName || contextInfo?.userName,
            userEmail: event.userEmail || contextInfo?.userEmail,
            userGuid: event.userGuid || contextInfo?.userGuid,
            contextMetadata: event.contextMetadata || contextInfo?.contextMetadata,
        };

        this.queueEvent(fullEvent);
    }

    /**
     * Rastreia erros
     */
    trackError(
        chartType: ChartType, 
        error: Error | string, 
        context?: Record<string, unknown>,
        contextInfo?: ThoughtSpotContextInfo
    ): void {
        if (!this.config.enabled) return;

        const errorMessage = error instanceof Error ? error.message : error;
        const stack = error instanceof Error ? error.stack : undefined;

        // Coletar TODAS as informações disponíveis do contexto
        const event: ErrorEvent = {
            type: 'error',
            chartType,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            userId: contextInfo?.userId || contextInfo?.userGuid,
            org: contextInfo?.org,
            orgId: contextInfo?.orgId,
            tenantId: contextInfo?.tenantId,
            model: contextInfo?.model,
            modelId: contextInfo?.modelId,
            worksheetId: contextInfo?.worksheetId,
            user: contextInfo?.user,
            userName: contextInfo?.userName,
            userEmail: contextInfo?.userEmail,
            userGuid: contextInfo?.userGuid,
            contextMetadata: contextInfo?.contextMetadata,
            error: errorMessage,
            stack,
            context: context || {},
        };

        this.queueEvent(event);
    }

    /**
     * Rastreia interações do usuário
     */
    trackInteraction(
        chartType: ChartType, 
        interactionType: InteractionType, 
        element: string, 
        metadata?: Record<string, unknown>,
        contextInfo?: ThoughtSpotContextInfo
    ): void {
        if (!this.config.enabled) return;

        // Coletar TODAS as informações disponíveis do contexto
        const event: InteractionEvent = {
            type: 'interaction',
            chartType,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            userId: contextInfo?.userId || contextInfo?.userGuid,
            org: contextInfo?.org,
            orgId: contextInfo?.orgId,
            tenantId: contextInfo?.tenantId,
            model: contextInfo?.model,
            modelId: contextInfo?.modelId,
            worksheetId: contextInfo?.worksheetId,
            user: contextInfo?.user,
            userName: contextInfo?.userName,
            userEmail: contextInfo?.userEmail,
            userGuid: contextInfo?.userGuid,
            contextMetadata: contextInfo?.contextMetadata,
            interactionType,
            element,
            metadata: metadata || {},
        };

        this.queueEvent(event);
    }

    /**
     * Rastreia configurações utilizadas
     */
    trackConfig(
        chartType: ChartType, 
        configKey: string, 
        configValue: unknown,
        contextInfo?: ThoughtSpotContextInfo
    ): void {
        if (!this.config.enabled) return;

        // Coletar TODAS as informações disponíveis do contexto
        const event: ConfigEvent = {
            type: 'config',
            chartType,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            userId: contextInfo?.userId || contextInfo?.userGuid,
            org: contextInfo?.org,
            orgId: contextInfo?.orgId,
            tenantId: contextInfo?.tenantId,
            model: contextInfo?.model,
            modelId: contextInfo?.modelId,
            worksheetId: contextInfo?.worksheetId,
            user: contextInfo?.user,
            userName: contextInfo?.userName,
            userEmail: contextInfo?.userEmail,
            userGuid: contextInfo?.userGuid,
            contextMetadata: contextInfo?.contextMetadata,
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
            if (window.ANALYTICS_ENDPOINT) {
                endpoint = window.ANALYTICS_ENDPOINT;
            }
            // Caso contrário, usa o endpoint padrão relativo à raiz
        }
        
        const enabled = typeof window !== 'undefined'
            ? window.ANALYTICS_ENABLED !== false
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
    trackUsage: (
        chartType: ChartType, 
        config: Record<string, unknown>, 
        userId?: string,
        contextInfo?: ThoughtSpotContextInfo
    ) => {
        getAnalyticsClient().trackUsage(chartType, config, userId, contextInfo);
    },
    trackPerformance: (
        event: Omit<PerformanceEvent, 'sessionId' | 'timestamp'>,
        contextInfo?: ThoughtSpotContextInfo
    ) => {
        getAnalyticsClient().trackPerformance(event, contextInfo);
    },
    trackError: (
        chartType: ChartType, 
        error: Error | string, 
        context?: Record<string, unknown>,
        contextInfo?: ThoughtSpotContextInfo
    ) => {
        getAnalyticsClient().trackError(chartType, error, context, contextInfo);
    },
    trackInteraction: (
        chartType: ChartType, 
        interactionType: InteractionType, 
        element: string, 
        metadata?: Record<string, unknown>,
        contextInfo?: ThoughtSpotContextInfo
    ) => {
        getAnalyticsClient().trackInteraction(chartType, interactionType, element, metadata, contextInfo);
    },
    trackConfig: (
        chartType: ChartType, 
        configKey: string, 
        configValue: unknown,
        contextInfo?: ThoughtSpotContextInfo
    ) => {
        getAnalyticsClient().trackConfig(chartType, configKey, configValue, contextInfo);
    },
};

