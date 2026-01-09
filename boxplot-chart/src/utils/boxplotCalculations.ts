/**
 * Cálculos específicos para Boxplot Chart
 */

import { calculateBoxplotStats, type BoxplotStatistics, type CalculationMethod, type WhiskerType } from '@shared/utils/statistical';
import type { BoxplotDataGroup, BoxplotData } from '../types/boxplotTypes';
import type { ChartColumn, ChartModel, DataPointsArray } from '@thoughtspot/ts-chart-sdk';
import type { BoxplotOptions } from './boxplotOptions';

/**
 * Converte valores do ThoughtSpot para números
 */
function extractValue(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    if (value && typeof value === 'object' && 'v' in value) {
        const v = (value as any).v;
        if (typeof v === 'number') return v;
        if (v && typeof v === 'object' && 'n' in v) return v.n || 0;
        if (typeof v === 'string') {
            const parsed = parseFloat(v);
            return isNaN(parsed) ? 0 : parsed;
        }
    }
    return 0;
}

/**
 * Agrupa dados por dimensão e calcula estatísticas para cada grupo
 */
export function calculateBoxplotData(
    chartModel: ChartModel,
    measureColumn: ChartColumn,
    dimensionColumns: ChartColumn[],
    options?: BoxplotOptions
): BoxplotData | null {
    const data = chartModel.data?.[0]?.data;
    if (!data || !data.dataValue || data.dataValue.length === 0) {
        return null;
    }

    // Encontrar índices das colunas
    const measureIndex = data.columns.findIndex(col => col === measureColumn.id);
    if (measureIndex === -1) return null;

    const dimensionIndices = dimensionColumns.map(dim => 
        data.columns.findIndex(col => col === dim.id)
    ).filter(idx => idx !== -1);

    if (dimensionIndices.length === 0) return null;

    // Agrupar dados por dimensão
    const groupsMap = new Map<string, number[]>();

    for (const row of data.dataValue) {
        // Criar chave de agrupamento baseada nas dimensões
        const dimensionKey = dimensionIndices
            .map(idx => String(row[idx] || ''))
            .join('|');

        const value = extractValue(row[measureIndex]);
        if (!isNaN(value)) {
            const existing = groupsMap.get(dimensionKey) || [];
            existing.push(value);
            groupsMap.set(dimensionKey, existing);
        }
    }

    // Obter configurações de cálculo
    const calculationMethod: CalculationMethod = options?.calculationMethod || 'auto';
    const whiskerType: WhiskerType = options?.whiskerType || 'iqr_1_5';
    const includeMean = options?.showMean || false;

    // Calcular estatísticas para cada grupo
    const groups: BoxplotDataGroup[] = [];
    let allValues: number[] = [];

    for (const [dimensionKey, values] of groupsMap.entries()) {
        const stats = calculateBoxplotStats(values, includeMean, calculationMethod, whiskerType);
        allValues = allValues.concat(values);
        
        groups.push({
            dimensionValue: dimensionKey.split('|')[0], // Usar primeira dimensão como label principal
            values,
            stats,
            mean: includeMean ? stats.mean : undefined,
        });
    }

    // Ordenar grupos por valor da dimensão (para ordem consistente)
    groups.sort((a, b) => {
        const aVal = a.dimensionValue;
        const bVal = b.dimensionValue;
        // Tentar ordenação numérica se possível
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
        }
        return aVal.localeCompare(bVal);
    });

    // Calcular estatísticas globais
    const globalStats = calculateBoxplotStats(allValues, includeMean, calculationMethod, whiskerType);

    return {
        measure: measureColumn,
        groups,
        globalStats,
    };
}

/**
 * Converte valor para coordenada Y (vertical) ou X (horizontal)
 */
export function valueToCoordinate(
    value: number,
    min: number,
    max: number,
    start: number,
    length: number,
    orientation: 'vertical' | 'horizontal'
): number {
    if (max === min) return start + length / 2;
    const ratio = (value - min) / (max - min);
    return orientation === 'vertical' 
        ? start + length - (ratio * length)
        : start + (ratio * length);
}

/**
 * Calcula posição X ou Y do grupo
 */
export function calculateGroupPosition(
    groupIndex: number,
    totalGroups: number,
    start: number,
    availableLength: number,
    orientation: 'vertical' | 'horizontal'
): number {
    const spacing = availableLength / totalGroups;
    return start + (groupIndex * spacing) + (spacing / 2);
}

