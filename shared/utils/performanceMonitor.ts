/**
 * Monitor de performance para gráficos
 * Mede tempo de renderização e calcula tamanho dos dados
 */

import type { PerformanceEvent } from '../types/analytics';

interface PerformanceMetrics {
    renderStartTime: number;
    dataSize: number;
    numMeasures: number;
    numDimensions: number;
    containerWidth?: number;
    containerHeight?: number;
}

/**
 * Classe para monitorar performance de renderização
 */
export class PerformanceMonitor {
    private metrics: Map<string, PerformanceMetrics> = new Map();

    /**
     * Inicia monitoramento de renderização
     */
    startRender(sessionId: string, dataSize: number, numMeasures: number, numDimensions: number, containerWidth?: number, containerHeight?: number): void {
        this.metrics.set(sessionId, {
            renderStartTime: performance.now(),
            dataSize,
            numMeasures,
            numDimensions,
            containerWidth,
            containerHeight,
        });
    }

    /**
     * Finaliza monitoramento e retorna métricas
     */
    endRender(sessionId: string): PerformanceEvent | null {
        const metrics = this.metrics.get(sessionId);
        if (!metrics) {
            return null;
        }

        const renderTime = performance.now() - metrics.renderStartTime;
        this.metrics.delete(sessionId);

        return {
            type: 'performance',
            chartType: 'trellis', // será sobrescrito pelo chamador
            timestamp: new Date().toISOString(),
            sessionId,
            renderTime: Math.round(renderTime * 100) / 100, // arredonda para 2 casas decimais
            dataSize: metrics.dataSize,
            numMeasures: metrics.numMeasures,
            numDimensions: metrics.numDimensions,
            containerWidth: metrics.containerWidth,
            containerHeight: metrics.containerHeight,
        };
    }

    /**
     * Calcula tamanho aproximado dos dados em bytes
     */
    static calculateDataSize(data: unknown): number {
        try {
            const jsonString = JSON.stringify(data);
            return new Blob([jsonString]).size;
        } catch {
            // Fallback: estimativa baseada em string length
            return JSON.stringify(data).length * 2; // aproximação UTF-16
        }
    }
}

