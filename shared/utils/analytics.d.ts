/**
 * Cliente de analytics para frontend
 * Envia eventos de utilização dos gráficos para o servidor
 */
import type { PerformanceEvent, ChartType, InteractionType } from '../types/analytics';
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
declare class AnalyticsClient {
    private config;
    private eventQueue;
    private flushTimer;
    private sessionId;
    constructor(config: AnalyticsClientConfig);
    /**
     * Gera um ID único de sessão
     */
    private generateSessionId;
    /**
     * Inicia timer para flush periódico
     */
    private startFlushTimer;
    /**
     * Rastreia uso do gráfico
     */
    trackUsage(chartType: ChartType, config: Record<string, unknown>, userId?: string): void;
    /**
     * Rastreia performance de renderização
     */
    trackPerformance(event: Omit<PerformanceEvent, 'sessionId' | 'timestamp'>): void;
    /**
     * Rastreia erros
     */
    trackError(chartType: ChartType, error: Error | string, context?: Record<string, unknown>): void;
    /**
     * Rastreia interações do usuário
     */
    trackInteraction(chartType: ChartType, interactionType: InteractionType, element: string, metadata?: Record<string, unknown>): void;
    /**
     * Rastreia configurações utilizadas
     */
    trackConfig(chartType: ChartType, configKey: string, configValue: unknown): void;
    /**
     * Adiciona evento à fila
     */
    private queueEvent;
    /**
     * Envia eventos em lote para o servidor
     */
    flush(): Promise<void>;
    /**
     * Envia eventos para o servidor
     */
    private sendEvents;
    /**
     * Limpa recursos (chamar quando não precisar mais)
     */
    destroy(): void;
}
/**
 * Obtém ou cria instância do cliente de analytics
 */
export declare function getAnalyticsClient(): AnalyticsClient;
/**
 * Funções de conveniência para uso direto
 */
export declare const analytics: {
    trackUsage: (chartType: ChartType, config: Record<string, unknown>, userId?: string) => void;
    trackPerformance: (event: Omit<PerformanceEvent, "sessionId" | "timestamp">) => void;
    trackError: (chartType: ChartType, error: Error | string, context?: Record<string, unknown>) => void;
    trackInteraction: (chartType: ChartType, interactionType: InteractionType, element: string, metadata?: Record<string, unknown>) => void;
    trackConfig: (chartType: ChartType, configKey: string, configValue: unknown) => void;
};
export {};
