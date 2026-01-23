/**
 * Monitor de performance para gráficos
 * Mede tempo de renderização e calcula tamanho dos dados
 */
import type { PerformanceEvent } from '../types/analytics';
/**
 * Classe para monitorar performance de renderização
 */
export declare class PerformanceMonitor {
    private metrics;
    /**
     * Inicia monitoramento de renderização
     */
    startRender(sessionId: string, dataSize: number, numMeasures: number, numDimensions: number, containerWidth?: number, containerHeight?: number): void;
    /**
     * Finaliza monitoramento e retorna métricas
     */
    endRender(sessionId: string): PerformanceEvent | null;
    /**
     * Calcula tamanho aproximado dos dados em bytes
     */
    static calculateDataSize(data: unknown): number;
}
