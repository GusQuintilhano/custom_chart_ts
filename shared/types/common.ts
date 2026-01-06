/**
 * Tipos comuns compartilhados entre gráficos
 */

import type { ChartColumn, ChartModel, VisualProps } from '@thoughtspot/ts-chart-sdk';

/**
 * Valor do ThoughtSpot (pode ser objeto ou primitivo)
 */
export interface ThoughtSpotValue {
    v?: {
        n?: number;
        s?: string;
    } | number | string;
}

/**
 * Tipo para valores de célula
 */
export type CellValue = ThoughtSpotValue | number | string | null | undefined;

/**
 * Linha de dados do ThoughtSpot
 */
export type DataRow = CellValue[];

/**
 * DataPointsArray tipado
 */
export interface TypedDataPointsArray {
    columns: string[];
    dataValue: DataRow[];
}

/**
 * QueryData tipado
 */
export interface TypedQueryData {
    data: TypedDataPointsArray;
    completionRatio?: number;
    samplingRatio?: number;
    totalRowCount: number;
}

/**
 * ChartModel com dados tipados
 */
export interface TypedChartModel {
    columns: ChartColumn[];
    data?: TypedQueryData[];
    sortInfo?: unknown;
    visualProps?: VisualProps;
    config: {
        chartConfig?: unknown;
    };
}

/**
 * Configuração base para medidas (usado por múltiplos gráficos)
 */
export interface BaseMeasureConfig {
    color?: string;
    format?: string;
    decimals?: number;
    useThousandsSeparator?: boolean;
    opacity?: number;
}

/**
 * Opções base de gráfico (compartilhadas entre gráficos)
 */
export interface BaseChartOptions {
    showYAxis?: boolean;
    labelFontSize?: number;
    valueLabelFontSize?: number;
    yAxisColor?: string;
    xAxisColor?: string;
    backgroundColor?: string;
    axisStrokeWidth?: number;
}

