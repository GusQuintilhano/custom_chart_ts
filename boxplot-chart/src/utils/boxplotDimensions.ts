/**
 * Cálculo de dimensões do Boxplot Chart
 */

import type { BoxplotRenderConfig, LayoutConfig } from '../types/boxplotTypes';

export interface BoxplotDimensionsParams {
    showYAxis: boolean;
    labelFontSize: number;
    valueLabelFontSize: number;
    numGroups: number;
    boxWidth?: number;
    groupSpacing?: number;
    layout?: LayoutConfig;
}

/**
 * Calcula margens baseadas no estilo de layout
 */
function getMarginsFromLayoutStyle(
    layoutStyle: 'compact' | 'normal' | 'spacious' | 'custom',
    showYAxis: boolean,
    labelFontSize: number
): { top: number; bottom: number; left: number; right: number } {
    switch (layoutStyle) {
        case 'compact':
            return {
                top: 20,
                bottom: labelFontSize + 10,
                left: showYAxis ? 60 : 20,
                right: 20,
            };
        case 'spacious':
            return {
                top: 60,
                bottom: labelFontSize * 2 + 30,
                left: showYAxis ? 100 : 50,
                right: 60,
            };
        case 'normal':
        default:
            return {
                top: 40,
                bottom: labelFontSize * 2 + 20,
                left: showYAxis ? 80 : 40,
                right: 40,
            };
    }
}

/**
 * Calcula espaçamento entre grupos baseado no estilo de layout
 */
function getGroupSpacingFromLayoutStyle(
    layoutStyle: 'compact' | 'normal' | 'spacious' | 'custom',
    customSpacing?: number
): number {
    if (customSpacing !== undefined) {
        return customSpacing;
    }
    
    switch (layoutStyle) {
        case 'compact':
            return 50;
        case 'spacious':
            return 120;
        case 'normal':
        default:
            return 80;
    }
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
        groupSpacing: paramGroupSpacing,
        layout,
    } = params;

    const layoutStyle = layout?.layoutStyle || 'normal';

    // Calcular margens baseadas no estilo de layout ou usar valores customizados
    const styleMargins = getMarginsFromLayoutStyle(layoutStyle, showYAxis, labelFontSize);
    
    const topMargin = layout?.marginTop !== undefined ? layout.marginTop : styleMargins.top;
    const bottomMargin = layout?.marginBottom !== undefined ? layout.marginBottom : styleMargins.bottom;
    const leftMargin = layout?.marginLeft !== undefined ? layout.marginLeft : styleMargins.left;
    const rightMargin = layout?.marginRight !== undefined ? layout.marginRight : styleMargins.right;

    // Área de plotagem
    const plotAreaWidth = containerWidth - leftMargin - rightMargin;
    const plotAreaHeight = containerHeight - topMargin - bottomMargin;

    // Calcular espaçamento entre grupos
    const baseGroupSpacing = getGroupSpacingFromLayoutStyle(layoutStyle, layout?.groupSpacing || paramGroupSpacing);
    
    // Calcular espaçamento entre grupos baseado no número de grupos
    const calculatedGroupSpacing = numGroups > 0 
        ? Math.max(baseGroupSpacing, plotAreaWidth / (numGroups + 1))
        : baseGroupSpacing;

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
