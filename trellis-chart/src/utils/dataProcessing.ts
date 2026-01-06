/**
 * Utilitários para processamento de dados do ThoughtSpot
 */

import type { ChartColumn, QueryData, ChartModel } from '@thoughtspot/ts-chart-sdk';
import { ColumnType } from '@thoughtspot/ts-chart-sdk';
import type { TypedDataPointsArray, TypedQueryData, ChartDataPoint, CellValue } from '../types/chartTypes';
import { extractNumericValue, extractStringValue, isTypedDataPointsArray } from '../types/chartTypes';

/**
 * Extrai DataPointsArray tipado dos dados do ChartModel
 */
export function extractDataPointsArray(data: QueryData[] | undefined): TypedDataPointsArray | null {
    if (!data || data.length === 0) {
        return null;
    }

    const firstQueryData = data[0];
    if (!firstQueryData?.data) {
        return null;
    }

    // Type assertion segura - sabemos que é TypedDataPointsArray mesmo que o SDK use any[][]
    const dataPoints = firstQueryData.data as unknown as TypedDataPointsArray;
    
    if (!isTypedDataPointsArray(dataPoints)) {
        return null;
    }

    return dataPoints;
}

/**
 * Cria mapa de índice de colunas
 */
export function createColumnIndexMap(columns: string[]): Map<string, number> {
    const map = new Map<string, number>();
    columns.forEach((colId, idx) => {
        map.set(colId, idx);
    });
    return map;
}

/**
 * Filtra e ordena colunas pela ordem definida no dataArr
 */
export function filterAndSortColumns<T extends ChartColumn>(
    columns: T[],
    availableColumnIds: Set<string>,
    columnOrderMap: Map<string, number>
): T[] {
    return columns
        .filter(col => availableColumnIds.has(col.id))
        .sort((a, b) => {
            const orderA = columnOrderMap.get(a.id) ?? Infinity;
            const orderB = columnOrderMap.get(b.id) ?? Infinity;
            return orderA - orderB;
        });
}

/**
 * Separa dimensões e medidas do ChartModel
 */
export function separateDimensionsAndMeasures(columns: ChartColumn[]): {
    dimensions: ChartColumn[];
    measures: ChartColumn[];
} {
    const dimensions = columns.filter(col => col.type === ColumnType.ATTRIBUTE);
    const measures = columns.filter(col => col.type === ColumnType.MEASURE);
    
    return { dimensions, measures };
}

/**
 * Processa uma linha de dados e extrai valores das medidas
 */
export function processDataRow(
    row: CellValue[],
    columnIndexMap: Map<string, number>,
    primaryDimension: ChartColumn,
    secondaryDimensions: ChartColumn[],
    measureCols: ChartColumn[]
): ChartDataPoint | null {
    const primaryDimIdx = columnIndexMap.get(primaryDimension.id);
    
    if (primaryDimIdx === undefined || row[primaryDimIdx] === undefined) {
        return null;
    }

    // Extrair valor da dimensão principal
    const primaryDimValue = row[primaryDimIdx];
    const primaryLabel = extractStringValue(primaryDimValue);

    // Extrair valores das dimensões secundárias
    const secondaryLabels = secondaryDimensions
        .map(secDim => {
            const secDimIdx = columnIndexMap.get(secDim.id);
            if (secDimIdx !== undefined && row[secDimIdx] !== undefined) {
                return extractStringValue(row[secDimIdx]);
            }
            return null;
        })
        .filter((label): label is string => label !== null);

    // Combinar todas as labels
    const allLabels = [primaryLabel, ...secondaryLabels];

    // Extrair valores das medidas
    const values = measureCols.map(measure => {
        const measIdx = columnIndexMap.get(measure.id);
        if (measIdx !== undefined && row[measIdx] !== undefined) {
            const measValue = row[measIdx];
            return extractNumericValue(measValue);
        }
        return 0;
    });

    return {
        primaryLabel,
        secondaryLabels,
        labels: allLabels,
        values,
    };
}

/**
 * Processa todos os dados e retorna array de ChartDataPoint
 */
export function processChartData(
    dataPoints: TypedDataPointsArray,
    columnIndexMap: Map<string, number>,
    primaryDimension: ChartColumn,
    secondaryDimensions: ChartColumn[],
    measureCols: ChartColumn[]
): ChartDataPoint[] {
    const chartData: ChartDataPoint[] = [];
    
    dataPoints.dataValue.forEach(row => {
        const dataPoint = processDataRow(
            row,
            columnIndexMap,
            primaryDimension,
            secondaryDimensions,
            measureCols
        );
        
        if (dataPoint) {
            chartData.push(dataPoint);
        }
    });

    return chartData;
}

/**
 * Encontra medidas que estão faltando nos dados
 */
export function findMissingMeasures(
    measureCols: ChartColumn[],
    columnIndexMap: Map<string, number>
): ChartColumn[] {
    return measureCols.filter(measure => !columnIndexMap.has(measure.id));
}

