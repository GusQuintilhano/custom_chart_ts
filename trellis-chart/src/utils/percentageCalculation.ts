/**
 * Utilitários para cálculo de porcentagem do total
 */

import type { ChartDataPoint, MeasureConfig, PercentageOfTotalConfig } from '../types/chartTypes';
import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';

/**
 * Obtém o valor de uma dimensão de um ponto de dados
 */
function getDimensionValue(
    dataPoint: ChartDataPoint,
    dimensionId: string,
    primaryDimension: ChartColumn,
    secondaryDimensions: ChartColumn[]
): string | undefined {
    // Verificar se é a dimensão primária
    if (primaryDimension.id === dimensionId) {
        return dataPoint.primaryLabel;
    }
    
    // Verificar se é uma dimensão secundária
    const secondaryIndex = secondaryDimensions.findIndex(d => d.id === dimensionId);
    if (secondaryIndex >= 0 && secondaryIndex < dataPoint.secondaryLabels.length) {
        return dataPoint.secondaryLabels[secondaryIndex];
    }
    
    return undefined;
}

/**
 * Calcula porcentagem do total para uma medida
 * Se dimensionId for especificado, calcula % do total dentro de cada grupo da dimensão
 * Caso contrário, calcula % do total geral
 */
export function calculatePercentageOfTotal(
    chartData: ChartDataPoint[],
    measureIdx: number,
    measureConfig: MeasureConfig,
    primaryDimension: ChartColumn,
    secondaryDimensions: ChartColumn[]
): ChartDataPoint[] {
    const percentageOfTotal = measureConfig.percentageOfTotal;
    
    // Se não há configuração de porcentagem do total, retornar dados originais
    if (!percentageOfTotal || !percentageOfTotal.enabled) {
        return chartData;
    }
    
    // Se há dimensionId, calcular totais por grupo da dimensão
    if (percentageOfTotal.dimensionId) {
        // Agrupar dados por valor da dimensão
        const groups = new Map<string, ChartDataPoint[]>();
        
        chartData.forEach(dataPoint => {
            const dimensionValue = getDimensionValue(
                dataPoint,
                percentageOfTotal.dimensionId!,
                primaryDimension,
                secondaryDimensions
            );
            
            if (dimensionValue) {
                if (!groups.has(dimensionValue)) {
                    groups.set(dimensionValue, []);
                }
                groups.get(dimensionValue)!.push(dataPoint);
            }
        });
        
        // Calcular totais por grupo e porcentagens
        const result: ChartDataPoint[] = [];
        
        groups.forEach((groupDataPoints, groupKey) => {
            // Calcular total do grupo
            const groupTotal = groupDataPoints.reduce((sum, dp) => {
                const value = dp.values[measureIdx] || 0;
                return sum + value;
            }, 0);
            
            // Calcular porcentagem para cada ponto do grupo
            groupDataPoints.forEach(dataPoint => {
                const originalValue = dataPoint.values[measureIdx] || 0;
                const percentage = groupTotal > 0 ? (originalValue / groupTotal) * 100 : 0;
                
                // Criar novo ponto de dados com valor convertido para porcentagem
                const newDataPoint: ChartDataPoint = {
                    ...dataPoint,
                    values: [...dataPoint.values],
                };
                newDataPoint.values[measureIdx] = percentage;
                
                result.push(newDataPoint);
            });
        });
        
        return result;
    } else {
        // Calcular % do total geral
        const total = chartData.reduce((sum, dp) => {
            const value = dp.values[measureIdx] || 0;
            return sum + value;
        }, 0);
        
        // Converter cada valor para porcentagem
        return chartData.map(dataPoint => {
            const originalValue = dataPoint.values[measureIdx] || 0;
            const percentage = total > 0 ? (originalValue / total) * 100 : 0;
            
            const newDataPoint: ChartDataPoint = {
                ...dataPoint,
                values: [...dataPoint.values],
            };
            newDataPoint.values[measureIdx] = percentage;
            
            return newDataPoint;
        });
    }
}

/**
 * Aplica cálculo de porcentagem do total para todas as medidas que têm essa configuração
 */
export function applyPercentageOfTotalToAllMeasures(
    chartData: ChartDataPoint[],
    measureCols: ChartColumn[],
    measureConfigs: MeasureConfig[],
    primaryDimension: ChartColumn,
    secondaryDimensions: ChartColumn[]
): ChartDataPoint[] {
    let result = [...chartData];
    
    // Aplicar cálculo de porcentagem para cada medida que tem essa configuração
    measureConfigs.forEach((measureConfig, measureIdx) => {
        if (measureConfig.percentageOfTotal?.enabled) {
            result = calculatePercentageOfTotal(
                result,
                measureIdx,
                measureConfig,
                primaryDimension,
                secondaryDimensions
            );
        }
    });
    
    return result;
}

