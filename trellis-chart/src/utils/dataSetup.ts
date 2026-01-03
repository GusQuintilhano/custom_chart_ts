/**
 * Módulo para preparação e validação de dados
 */

import type { ChartModel, CustomChartContext, ChartColumn } from '@thoughtspot/ts-chart-sdk';
import type { ChartElement, ChartDataPoint } from '../types/chartTypes';
import { extractDataPointsArray, createColumnIndexMap, filterAndSortColumns, separateDimensionsAndMeasures, processChartData, findMissingMeasures } from './dataProcessing';
import { setupMissingMeasuresRetry } from '../handlers/missingMeasuresHandler';
import { ERROR_MESSAGES } from './errorMessages';

export interface DataSetupResult {
    chartElement: ChartElement;
    measureCols: ChartColumn[];
    primaryDimension: ChartColumn;
    secondaryDimensions: ChartColumn[];
    hasSecondaryDimension: boolean;
    chartData: ChartDataPoint[];
}

/**
 * Prepara e valida os dados para renderização
 */
export async function setupChartData(
    ctx: CustomChartContext,
    chartModel: ChartModel
): Promise<DataSetupResult | null> {
    const chartElement = document.getElementById('chart') as ChartElement | null;
    if (!chartElement) {
        return null;
    }

    const { columns, data } = chartModel;
    
    if (!data || data.length === 0) {
        chartElement.innerHTML = ERROR_MESSAGES.NO_DATA;
        return null;
    }
    
    const dataArr = extractDataPointsArray(data);
    if (!dataArr) {
        chartElement.innerHTML = ERROR_MESSAGES.INVALID_DATA(data);
        return null;
    }
    
    // Criar mapeamento de colunas
    const columnIndexMap = createColumnIndexMap(dataArr.columns);
    
    // Separar dimensões e medidas
    const { dimensions: allDimensions, measures: allMeasures } = separateDimensionsAndMeasures(columns);
    
    // Filtrar e ordenar colunas pela ordem do chartConfig
    const availableColumnIds = new Set(dataArr.columns);
    const sortedDimensions = filterAndSortColumns(allDimensions, availableColumnIds, columnIndexMap);
    
    const measureCols = filterAndSortColumns(allMeasures, availableColumnIds, columnIndexMap);
    
    if (sortedDimensions.length === 0 || measureCols.length === 0) {
        chartElement.innerHTML = ERROR_MESSAGES.INSUFFICIENT_DATA;
        return null;
    }

    // Suportar múltiplas dimensões
    const primaryDimension = sortedDimensions[0];
    const secondaryDimensions = sortedDimensions.slice(1);
    const hasSecondaryDimension = secondaryDimensions.length >= 1;
    
    // Verificar medidas faltantes e configurar retry se necessário
    const missingMeasures = findMissingMeasures(measureCols, columnIndexMap);
    if (missingMeasures.length > 0) {
        await setupMissingMeasuresRetry(ctx, chartElement, missingMeasures);
        return null;
    }

    // Processar dados
    let chartData = processChartData(
        dataArr,
        columnIndexMap,
        primaryDimension,
        secondaryDimensions,
        measureCols
    );
    
    // Ordenar dados para garantir agrupamento correto
    if (hasSecondaryDimension && secondaryDimensions.length > 0) {
        chartData = [...chartData].sort((a, b) => {
            const secondaryA = a.secondaryLabels[0] || '';
            const secondaryB = b.secondaryLabels[0] || '';
            const secondaryCompare = secondaryA.localeCompare(secondaryB);
            
            if (secondaryCompare !== 0) {
                return secondaryCompare;
            }
            
            return a.primaryLabel.localeCompare(b.primaryLabel);
        });
    }
    
    if (chartData.length === 0) {
        chartElement.innerHTML = ERROR_MESSAGES.PROCESSING_ERROR;
        return null;
    }
    
    return {
        chartElement,
        measureCols,
        primaryDimension,
        secondaryDimensions,
        hasSecondaryDimension,
        chartData,
    };
}

