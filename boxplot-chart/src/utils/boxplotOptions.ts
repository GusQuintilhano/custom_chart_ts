/**
 * Leitura e configuração de opções do Boxplot Chart
 */

import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import type { BoxplotMeasureConfig } from '../types/boxplotTypes';

export interface BoxplotOptions {
    showYAxis: boolean;
    showOutliers: boolean;
    orientation: 'vertical' | 'horizontal';
    boxWidth: number;
    whiskerWidth: number;
    color: string;
    opacity: number;
    labelFontSize: number;
    valueLabelFontSize: number;
    yAxisColor: string;
    xAxisColor: string;
    backgroundColor: string;
    axisStrokeWidth: number;
}

/**
 * Lê opções do visualProps e retorna configurações do boxplot
 */
export function readBoxplotOptions(
    allVisualProps: Record<string, unknown>,
    measureColumn: ChartColumn
): BoxplotOptions {
    const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    // Ler configurações da medida específica
    const measureConfig = (allVisualProps?.columnVisualProps as Record<string, unknown>)?.[measureColumn.id] as Record<string, unknown> || {};
    const visualization = (measureConfig.visualization || {}) as Record<string, unknown>;
    const chartOptions = (allVisualProps?.chart_options || {}) as Record<string, unknown>;
    const axes = (allVisualProps?.axes || {}) as Record<string, unknown>;
    const textSizes = (allVisualProps?.text_sizes || {}) as Record<string, unknown>;
    const colorsStyle = (allVisualProps?.chart_colors_style || {}) as Record<string, unknown>;

    return {
        showYAxis: (axes.showYAxis !== undefined ? axes.showYAxis : chartOptions.showYAxis !== false) as boolean,
        showOutliers: (measureConfig.showOutliers !== undefined ? measureConfig.showOutliers : true) as boolean,
        orientation: (measureConfig.orientation || 'vertical') as 'vertical' | 'horizontal',
        boxWidth: (measureConfig.boxWidth as number) || 60,
        whiskerWidth: (measureConfig.whiskerWidth as number) || 40,
        color: (visualization.color as string) || defaultColors[0],
        opacity: (measureConfig.opacity as number) ?? 0.8,
        labelFontSize: (textSizes.labelFontSize as number) ?? 12,
        valueLabelFontSize: (textSizes.valueLabelFontSize as number) ?? 10,
        yAxisColor: (colorsStyle.yAxisColor as string) || '#374151',
        xAxisColor: (colorsStyle.xAxisColor as string) || '#374151',
        backgroundColor: (colorsStyle.backgroundColor as string) || 'transparent',
        axisStrokeWidth: (colorsStyle.axisStrokeWidth as number) ?? 1.5,
    };
}

