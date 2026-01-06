/**
 * Cálculo de dimensões do Boxplot Chart
 */

import type { BoxplotRenderConfig } from '../types/boxplotTypes';

export interface BoxplotDimensionsParams {
    showYAxis: boolean;
    labelFontSize: number;
    valueLabelFontSize: number;
    numGroups: number;
    boxWidth?: number;
    groupSpacing?: number;
}

/**
 * Calcula as dimensões do gráfico boxplot
 */
export function calculateBoxplotDimensions(
    containerWidth: number,
    containerHeight: number,
    params: BoxplotDimensionsParams
): BoxplotRenderConfig {
    const {
        showYAxis,
        labelFontSize,
        valueLabelFontSize,
        numGroups,
        boxWidth = 60,
        groupSpacing = 80,
    } = params;

    // Margens
    const leftMargin = showYAxis ? 80 : 40;
    const rightMargin = 40;
    const topMargin = 40;
    const bottomMargin = labelFontSize * 2 + 20;

    // Área de plotagem
    const plotAreaWidth = containerWidth - leftMargin - rightMargin;
    const plotAreaHeight = containerHeight - topMargin - bottomMargin;

    // Calcular espaçamento entre grupos baseado no número de grupos
    const calculatedGroupSpacing = numGroups > 0 
        ? Math.max(groupSpacing, plotAreaWidth / (numGroups + 1))
        : groupSpacing;

    return {
        chartWidth: containerWidth,
        chartHeight: containerHeight,
        leftMargin,
        rightMargin,
        topMargin,
        bottomMargin,
        plotAreaWidth,
        plotAreaHeight,
        groupSpacing: calculatedGroupSpacing,
        boxWidth,
        showYAxis,
        labelFontSize,
        valueLabelFontSize,
    };
}

