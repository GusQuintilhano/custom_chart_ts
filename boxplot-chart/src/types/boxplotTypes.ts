/**
 * Tipos específicos para Boxplot Chart
 */

import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import type { BoxplotStatistics } from '@shared/utils/statistical';

/**
 * Configuração de uma medida para boxplot
 */
export interface BoxplotMeasureConfig {
    id: string;
    name: string;
    color?: string;
    showOutliers?: boolean;
    orientation?: 'vertical' | 'horizontal';
    boxWidth?: number;
    whiskerWidth?: number;
    opacity?: number;
}

/**
 * Dados agrupados por dimensão para boxplot
 */
export interface BoxplotDataGroup {
    dimensionValue: string;
    values: number[];
    stats: BoxplotStatistics;
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
}

