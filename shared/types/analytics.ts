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
 * 
 * IMPORTANTE: Coletamos TODAS as informações disponíveis do ThoughtSpot
 * para ter logs completos e visibilidade total do uso dos gráficos.
 */
export interface BaseAnalyticsEvent {
    type: AnalyticsEventType;
    chartType: ChartType;
    timestamp: string;
    sessionId: string;
    userId?: string;
    // Informações do contexto ThoughtSpot (coletamos todas as variações possíveis)
    org?: string;           // Organização/tenant do ThoughtSpot (nome)
    orgId?: string;        // ID da organização
    tenantId?: string;     // ID do tenant
    model?: string;         // Model/Worksheet ID ou nome
    modelId?: string;       // ID do modelo
    worksheetId?: string;  // ID do worksheet
    user?: string;          // Nome/username do usuário
    userName?: string;      // Nome do usuário (variação)
    userEmail?: string;     // Email do usuário
    userGuid?: string;      // GUID do usuário
    // Metadados adicionais do contexto (para análise)
    contextMetadata?: Record<string, unknown>;
}

/**
 * Evento de uso do gráfico
 * 
 * IMPORTANTE: Inclui informações sobre funcionalidades usadas para análise
 */
export interface UsageEvent extends BaseAnalyticsEvent {
    type: 'usage';
    config: Record<string, unknown>;
    userAgent?: string;
    ip?: string;
    // Informações sobre funcionalidades usadas
    features?: {
        // Funcionalidades específicas do gráfico que foram usadas
        usedFeatures?: string[]; // Ex: ['tooltip', 'zoom', 'export', 'filter']
        // Configurações específicas aplicadas
        appliedConfigs?: string[]; // Ex: ['fitWidth', 'showGrid', 'showLegend']
        // Interações realizadas
        interactions?: string[]; // Ex: ['hover', 'click', 'resize']
    };
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

