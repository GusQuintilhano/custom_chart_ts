/**
 * Utilitários para cálculo de ranges (min/max) de medidas
 */

import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import type { ChartDataPoint } from '../types/chartTypes';

/**
 * Interface para range de valores de uma medida
 */
export interface MeasureRange {
    measure: ChartColumn;
    min: number;
    max: number;
    originalMin?: number;
    originalMax?: number;
}

/**
 * Calcula ranges (min/max) para cada medida individualmente
 */
export function calculateMeasureRanges(
    chartData: ChartDataPoint[],
    measureCols: ChartColumn[]
): MeasureRange[] {
    return measureCols.map((measure, measureIdx) => {
        const values = chartData.map(d => d.values[measureIdx] || 0);
        const allValues = values.filter(v => v !== null && v !== undefined);
        const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
        const maxValue = allValues.length > 0 ? Math.max(...allValues) : 1;
        
        // Adicionar pequena margem para melhor visualização (10% ou valor mínimo)
        const range = maxValue - minValue;
        const margin = range > 0 ? range * 0.1 : (maxValue > 0 ? maxValue * 0.1 : 0.1);
        
        return {
            min: Math.max(0, minValue - margin), // Não permitir valores negativos se todos forem positivos
            max: maxValue + margin,
            measure,
            originalMin: minValue,
            originalMax: maxValue,
        } as MeasureRange & { originalMin: number; originalMax: number };
    });
}

