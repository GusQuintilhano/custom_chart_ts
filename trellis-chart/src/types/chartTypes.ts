/**
 * Tipos TypeScript específicos para o Trellis Chart
 * Estende os tipos do ThoughtSpot Chart SDK com tipos mais específicos
 */

import type { ChartColumn, ColumnType, DataPointsArray, QueryData, ChartModel, VisualProps } from '@thoughtspot/ts-chart-sdk';

/**
 * Estrutura de valor retornado pelo ThoughtSpot
 * Valores podem ser números (v.n), strings (v.s) ou primitivos diretos
 */
export interface ThoughtSpotValue {
    v?: {
        n?: number;  // Valor numérico
        s?: string;  // Valor string
    } | number | string;
}

/**
 * Tipo para valores de célula (pode ser ThoughtSpotValue ou primitivo)
 */
export type CellValue = ThoughtSpotValue | number | string | null | undefined;

/**
 * Linha de dados do ThoughtSpot (array de valores)
 */
export type DataRow = CellValue[];

/**
 * DataPointsArray tipado com valores mais específicos
 * Nota: O SDK usa any[][], mas sabemos que são CellValue[]
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
 * Ponto de dados processado para o gráfico
 */
export interface ChartDataPoint {
    primaryLabel: string;
    secondaryLabels: string[];
    labels: string[];
    values: number[];
}

/**
 * Configuração de medida
 */
export interface MeasureConfig {
    measure: ChartColumn;
    color?: string;
    format?: string;
    showLabel?: boolean;
    decimals?: number;
    chartType?: string;
    useThousandsSeparator?: boolean;
    opacity?: number; // Opacidade da barra/linha (0-1)
    valueLabelPosition?: 'above' | 'inside-top' | 'inside-center' | 'below' | 'auto'; // Posição do label de valor
    minY?: number | 'auto'; // Valor mínimo do eixo Y
    maxY?: number | 'auto'; // Valor máximo do eixo Y
    yAxisTicks?: number | 'auto'; // Número de ticks no eixo Y
    showYAxisValues?: boolean; // Mostrar valores no eixo Y
    valuePrefix?: string; // Prefixo antes do valor (ex: "R$", "Total:")
    valueSuffix?: string; // Sufixo depois do valor (ex: "%", "un")
    showZeroValues?: boolean; // Mostrar valores zero
    valueFormat?: 'normal' | 'compact'; // Formato: normal ou compacto (1.5K, 1.2M)
    referenceLine?: {
        enabled: boolean;
        value: number;
        color?: string;
        style?: 'solid' | 'dashed' | 'dotted';
        showLabel?: boolean;
    };
    tooltip?: {
        enabled: boolean;
        format?: 'simple' | 'detailed';
        backgroundColor?: string;
        layout?: 'vertical' | 'horizontal' | 'grid';
    };
}

/**
 * Configuração de dimensão
 */
export interface DimensionConfig {
    dimension: ChartColumn;
    format?: string;
    showLabel?: boolean;
}

/**
 * Range de valores para uma medida
 */
export interface MeasureRange {
    measure: ChartColumn;
    min: number;
    max: number;
    effectiveMin?: number; // Valor mínimo efetivo (considerando minY configurado)
    effectiveMax?: number; // Valor máximo efetivo (considerando maxY configurado)
}

/**
 * Elemento HTML do gráfico com propriedades extendidas
 */
export interface ChartElement extends HTMLElement {
    __retryTimeout?: ReturnType<typeof setTimeout> | null;
    __retryInterval?: ReturnType<typeof setInterval> | null;
    __resizeObserver?: ResizeObserver | null;
    __configLogged?: boolean;
}

/**
 * Opções do gráfico (estrutura parcial baseada no código atual)
 */
export interface ChartOptions {
    showYAxis?: boolean;
    showLegend?: boolean;
    barWidth?: number | 'auto' | 'fit';
    spacing?: number;
    [key: string]: unknown;
}

/**
 * Type guard para verificar se um valor é ThoughtSpotValue com estrutura v.n/v.s
 */
export function isThoughtSpotValue(value: CellValue): value is ThoughtSpotValue {
    return (
        value !== null &&
        value !== undefined &&
        typeof value === 'object' &&
        'v' in value
    );
}

/**
 * Type guard para verificar se é TypedDataPointsArray
 */
export function isTypedDataPointsArray(value: unknown): value is TypedDataPointsArray {
    return (
        typeof value === 'object' &&
        value !== null &&
        'columns' in value &&
        'dataValue' in value &&
        Array.isArray((value as TypedDataPointsArray).columns) &&
        Array.isArray((value as TypedDataPointsArray).dataValue)
    );
}

/**
 * Extrai valor numérico de um CellValue
 */
export function extractNumericValue(value: CellValue): number {
    if (value === null || value === undefined) {
        return 0;
    }
    
    if (typeof value === 'number') {
        return value;
    }
    
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    
    if (isThoughtSpotValue(value)) {
        if (typeof value.v === 'number') {
            return value.v;
        }
        if (typeof value.v === 'string') {
            const parsed = parseFloat(value.v);
            return isNaN(parsed) ? 0 : parsed;
        }
        if (value.v && typeof value.v === 'object') {
            if (typeof value.v.n === 'number') {
                return value.v.n;
            }
            if (typeof value.v.s === 'string') {
                const parsed = parseFloat(value.v.s);
                return isNaN(parsed) ? 0 : parsed;
            }
        }
    }
    
    return 0;
}

/**
 * Extrai valor string de um CellValue
 */
export function extractStringValue(value: CellValue): string {
    if (value === null || value === undefined) {
        return '';
    }
    
    if (typeof value === 'string') {
        return value;
    }
    
    if (typeof value === 'number') {
        return String(value);
    }
    
    if (isThoughtSpotValue(value)) {
        if (typeof value.v === 'string') {
            return value.v;
        }
        if (typeof value.v === 'number') {
            return String(value.v);
        }
        if (value.v && typeof value.v === 'object') {
            if (typeof value.v.s === 'string') {
                return value.v.s;
            }
            if (typeof value.v.n === 'number') {
                return String(value.v.n);
            }
        }
    }
    
    return String(value);
}

