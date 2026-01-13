/**
 * Cálculos específicos para Boxplot Chart
 */

import { calculateBoxplotStats, type BoxplotStatistics, type CalculationMethod, type WhiskerType } from '@shared/utils/statistical';
import type { BoxplotDataGroup, BoxplotData, SortType } from '../types/boxplotTypes';
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

    // Ordenar grupos conforme configuração
    const sortType: SortType = options?.sortType || 'Alfabética';
    
    groups.sort((a, b) => {
        switch (sortType) {
            case 'Média (Crescente)':
                return (a.stats.mean || 0) - (b.stats.mean || 0);
            case 'Média (Decrescente)':
                return (b.stats.mean || 0) - (a.stats.mean || 0);
            case 'Mediana (Crescente)':
                return a.stats.q2 - b.stats.q2;
            case 'Mediana (Decrescente)':
                return b.stats.q2 - a.stats.q2;
            case 'Variabilidade (Crescente)':
                return a.stats.iqr - b.stats.iqr;
            case 'Variabilidade (Decrescente)':
                return b.stats.iqr - a.stats.iqr;
            case 'Alfabética':
            default:
                // Ordenação alfabética (tentativa numérica primeiro)
                const aVal = a.dimensionValue;
                const bVal = b.dimensionValue;
                const aNum = parseFloat(aVal);
                const bNum = parseFloat(bVal);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return aNum - bNum;
                }
                return aVal.localeCompare(bVal);
        }
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
 * Suporta escala linear e logarítmica
 */
export function valueToCoordinate(
    value: number,
    min: number,
    max: number,
    start: number,
    length: number,
    orientation: 'vertical' | 'horizontal',
    scale: 'linear' | 'log' = 'linear'
): number {
    if (max === min) return start + length / 2;
    
    let ratio: number;
    
    if (scale === 'log') {
        // Para escala logarítmica, garantir valores positivos
        // Se min <= 0, ajustar para usar um offset positivo
        let adjustedMin = min;
        let adjustedMax = max;
        let adjustedValue = value;
        
        if (min <= 0) {
            // Calcular offset para tornar todos os valores positivos
            const offset = Math.abs(min) + 1; // +1 para garantir que seja > 0
            adjustedMin = min + offset;
            adjustedMax = max + offset;
            adjustedValue = value + offset;
        }
        
        // Verificar se ainda há valores não positivos após ajuste
        if (adjustedMin <= 0 || adjustedMax <= 0 || adjustedValue <= 0) {
            // Se ainda não positivo após ajuste, usar escala linear como fallback
            console.warn('[BOXPLOT] Valores não positivos detectados na escala logarítmica, usando fallback linear. min:', min, 'max:', max, 'value:', value);
            ratio = (value - min) / (max - min);
        } else {
            // Escala logarítmica: log(value) entre log(min) e log(max)
            const logMin = Math.log10(adjustedMin);
            const logMax = Math.log10(adjustedMax);
            const logValue = Math.log10(adjustedValue);
            ratio = (logValue - logMin) / (logMax - logMin);
        }
    } else {
        // Escala linear (padrão)
        ratio = (value - min) / (max - min);
    }
    
    return orientation === 'vertical' 
        ? start + length - (ratio * length)
        : start + (ratio * length);
}

/**
 * Converte um valor para coordenada Y usando escala logarítmica ou linear
 * Helper para renderização vertical
 */
export function valueToYCoordinate(
    value: number,
    min: number,
    max: number,
    topMargin: number,
    plotAreaHeight: number,
    scale: 'linear' | 'log' = 'linear'
): number {
    return valueToCoordinate(value, min, max, topMargin, plotAreaHeight, 'vertical', scale);
}

/**
 * Converte um valor para coordenada X usando escala logarítmica ou linear
 * Helper para renderização horizontal
 */
export function valueToXCoordinate(
    value: number,
    min: number,
    max: number,
    leftMargin: number,
    plotAreaWidth: number,
    scale: 'linear' | 'log' = 'linear'
): number {
    return valueToCoordinate(value, min, max, leftMargin, plotAreaWidth, 'horizontal', scale);
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

