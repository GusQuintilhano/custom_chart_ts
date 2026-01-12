/**
 * Tipos específicos para Boxplot Chart
 */

import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import type { BoxplotStatistics } from '@shared/utils/statistical';

/**
 * Método de cálculo dos quartis
 */
export type CalculationMethod = 'auto' | 'tukey' | 'exclusive' | 'inclusive';

/**
 * Tipo de bigode (whisker)
 */
export type WhiskerType = 'data_extremes' | 'iqr_1_5' | 'iqr_3' | 'percentile_5_95' | 'min_max';

/**
 * Formato do outlier
 */
export type OutlierShape = 'circle' | 'cross' | 'diamond' | 'square' | 'triangle';

/**
 * Orientação do boxplot
 */
export type BoxplotOrientation = 'vertical' | 'horizontal';

/**
 * Tipo de ordenação dos grupos
 */
export type SortType = 'alphabetical' | 'mean_asc' | 'mean_desc' | 'median_asc' | 'median_desc' | 'iqr_asc' | 'iqr_desc';

/**
 * Estilo da linha da mediana
 */
export interface MedianStyle {
    color: string;
    strokeWidth: number;
    strokeDasharray?: string; // Ex: "5,5" para tracejado
}

/**
 * Estilo dos bigodes (whiskers)
 */
export interface WhiskerStyle {
    color: string;
    strokeWidth: number;
    capWidth: number; // Largura do "T" na ponta do bigode
    strokeDasharray?: string;
}

/**
 * Configuração da caixa (box)
 */
export interface BoxStyle {
    fill: string;
    stroke: string;
    strokeWidth: number;
    borderRadius?: number; // Em pixels
    opacity: number;
}

/**
 * Configuração de outliers
 */
export interface OutlierStyle {
    show: boolean;
    shape: OutlierShape;
    size: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
}

/**
 * Configuração de linha de grade
 */
export interface GridLinesConfig {
    show: boolean;
    color: string;
    strokeWidth: number;
    strokeDasharray?: string;
}

/**
 * Configuração de tooltip
 */
export interface TooltipConfig {
    enabled: boolean;
    format?: 'simple' | 'detailed' | 'custom';
    customTemplate?: string; // Para formatos customizados
}

/**
 * Configuração de uma medida para boxplot
 */
export interface BoxplotMeasureConfig {
    id: string;
    name: string;
    color?: string;
    showOutliers?: boolean;
    orientation?: BoxplotOrientation;
    boxWidth?: number;
    whiskerWidth?: number;
    opacity?: number;
    
    // Novas configurações expandidas
    calculationMethod?: CalculationMethod;
    whiskerType?: WhiskerType;
    showMean?: boolean;
    meanStyle?: MedianStyle;
    medianStyle?: MedianStyle;
    whiskerStyle?: WhiskerStyle;
    boxStyle?: BoxStyle;
    outlierStyle?: OutlierStyle;
}

/**
 * Dados agrupados por dimensão para boxplot
 */
export interface BoxplotDataGroup {
    dimensionValue: string;
    values: number[];
    stats: BoxplotStatistics;
    mean?: number; // Média calculada, se necessário
}

/**
 * Dados completos do boxplot
 */
export interface BoxplotData {
    measure: ChartColumn;
    groups: BoxplotDataGroup[];
    globalStats: BoxplotStatistics;
}

/**
 * Configurações de renderização do boxplot
 */
export interface BoxplotRenderConfig {
    chartWidth: number;
    chartHeight: number;
    leftMargin: number;
    rightMargin: number;
    topMargin: number;
    bottomMargin: number;
    plotAreaWidth: number;
    plotAreaHeight: number;
    groupSpacing: number;
    boxWidth: number;
    showYAxis: boolean;
    labelFontSize: number;
    valueLabelFontSize: number;
    padding?: number; // Espaçamento entre grupos
    gridLines?: GridLinesConfig;
    axisLabels?: {
        x?: string;
        y?: string;
    };
}

