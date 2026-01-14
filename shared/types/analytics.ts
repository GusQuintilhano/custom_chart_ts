/**
 * Tipos para sistema de analytics de utilização dos gráficos
 */

/**
 * Tipos de eventos de analytics
 */
export type AnalyticsEventType = 'usage' | 'performance' | 'error' | 'interaction' | 'config';

/**
 * Tipos de gráficos disponíveis
 */
export type ChartType = 'trellis' | 'boxplot';

/**
 * Tipos de interação do usuário
 */
export type InteractionType = 'hover' | 'click' | 'tooltip_open' | 'tooltip_close';

/**
 * Evento base para todos os tipos de analytics
 */
export interface BaseAnalyticsEvent {
    type: AnalyticsEventType;
    chartType: ChartType;
    timestamp: string;
    sessionId: string;
    userId?: string;
}

/**
 * Evento de uso do gráfico
 */
export interface UsageEvent extends BaseAnalyticsEvent {
    type: 'usage';
    config: Record<string, unknown>;
    userAgent?: string;
    ip?: string;
}

/**
 * Evento de performance
 */
export interface PerformanceEvent extends BaseAnalyticsEvent {
    type: 'performance';
    renderTime: number; // em milissegundos
    dataSize: number; // tamanho dos dados em bytes (aproximado)
    numMeasures: number;
    numDimensions: number;
    containerWidth?: number;
    containerHeight?: number;
}

/**
 * Evento de erro
 */
export interface ErrorEvent extends BaseAnalyticsEvent {
    type: 'error';
    error: string;
    stack?: string;
    context: Record<string, unknown>;
}

/**
 * Evento de interação do usuário
 */
export interface InteractionEvent extends BaseAnalyticsEvent {
    type: 'interaction';
    interactionType: InteractionType;
    element: string; // identificador do elemento interagido
    metadata?: Record<string, unknown>;
}

/**
 * Evento de configuração utilizada
 */
export interface ConfigEvent extends BaseAnalyticsEvent {
    type: 'config';
    configKey: string;
    configValue: unknown;
}

/**
 * União de todos os tipos de eventos
 */
export type AnalyticsEvent = UsageEvent | PerformanceEvent | ErrorEvent | InteractionEvent | ConfigEvent;

/**
 * Requisição HTTP para enviar evento
 */
export interface AnalyticsEventRequest {
    event: AnalyticsEvent;
}

/**
 * Resposta da API de analytics
 */
export interface AnalyticsEventResponse {
    success: boolean;
    message?: string;
    eventId?: string;
}

/**
 * Interface para storage de analytics
 */
export interface AnalyticsStorage {
    save(event: AnalyticsEvent): Promise<void>;
    saveBatch(events: AnalyticsEvent[]): Promise<void>;
}

/**
 * Configuração do sistema de analytics
 */
export interface AnalyticsConfig {
    enabled: boolean;
    storageType: 'file' | 'database' | 'file+database';
    logPath?: string;
    dbUrl?: string;
    endpoint: string;
}

