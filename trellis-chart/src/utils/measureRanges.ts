/**
 * Utilitários para cálculo de ranges (min/max) de medidas
 */

import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import type { ChartDataPoint, MeasureConfig } from '../types/chartTypes';

/**
 * Interface para range de valores de uma medida
 */
export interface MeasureRange {
    measure: ChartColumn;
    min: number;
    max: number;
    effectiveMin?: number; // Valor mínimo efetivo (considerando minY configurado)
    effectiveMax?: number; // Valor máximo efetivo (considerando maxY configurado)
    originalMin?: number;
    originalMax?: number;
}

/**
 * Calcula ranges (min/max) para cada medida individualmente
 * Considera configurações de minY/maxY se fornecidas
 */
export function calculateMeasureRanges(
    chartData: ChartDataPoint[],
    measureCols: ChartColumn[],
    measureConfigs?: MeasureConfig[]
): MeasureRange[] {
    return measureCols.map((measure, measureIdx) => {
        const values = chartData.map(d => d.values[measureIdx] || 0);
        const allValues = values.filter(v => v !== null && v !== undefined);
        const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
        const maxValue = allValues.length > 0 ? Math.max(...allValues) : 1;
        
        // Adicionar pequena margem para melhor visualização (10% ou valor mínimo)
        const range = maxValue - minValue;
        const margin = range > 0 ? range * 0.1 : (maxValue > 0 ? maxValue * 0.1 : 0.1);
        
        const calculatedMin = Math.max(0, minValue - margin);
        const calculatedMax = maxValue + margin;
        
        // Aplicar minY/maxY das configurações se fornecidas
        const measureConfig = measureConfigs?.[measureIdx];
        const configuredMinY = measureConfig?.minY;
        const configuredMaxY = measureConfig?.maxY;
        
        const effectiveMin = configuredMinY !== undefined && configuredMinY !== 'auto' ? configuredMinY : calculatedMin;
        const effectiveMax = configuredMaxY !== undefined && configuredMaxY !== 'auto' ? configuredMaxY : calculatedMax;
        
        return {
            min: effectiveMin,
            max: effectiveMax,
            effectiveMin,
            effectiveMax,
            measure,
            originalMin: minValue,
            originalMax: maxValue,
        } as MeasureRange & { originalMin: number; originalMax: number };
    });
}

