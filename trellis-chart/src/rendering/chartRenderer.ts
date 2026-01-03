/**
 * Módulo para renderização completa do gráfico
 */

import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import type { ChartDataPoint, MeasureConfig, MeasureRange } from '../types/chartTypes';
import { calculateLastMeasureRowTop } from '../utils/calculations';
import { formatDimension } from '../utils/formatters';
import { renderAllChartElements } from './chartElements';
import { renderYAxes, renderXAxis } from './axes';
import { renderDividerLinesBetweenMeasures, renderDividerLinesBetweenBars } from './dividerLines';
import { renderSecondaryXAxis } from './secondaryAxis';
import { createChartHtmlStructure } from '../utils/htmlStructure';

export interface ChartRenderParams {
    chartData: ChartDataPoint[];
    measureCols: ChartColumn[];
    measureRanges: MeasureRange[];
    measureConfigs: MeasureConfig[];
    hasSecondaryDimension: boolean;
    secondaryDimensions: ChartColumn[];
    // Opções
    fitWidth: boolean;
    fitHeight: boolean;
    showYAxis: boolean;
    showGridLines: boolean;
    dividerLinesBetweenMeasures: boolean;
    dividerLinesBetweenGroups: boolean;
    dividerLinesBetweenBars: boolean;
    dividerLinesColor: string;
    forceLabels: boolean;
    labelFontSize: number;
    measureTitleFontSize: number;
    valueLabelFontSize: number;
    measureNameRotation: number;
    primaryDateFormat: string;
    secondaryDateFormat: string;
    // Dimensões
    leftMargin: number;
    topMargin: number;
    bottomMargin: number;
    rightMargin: number;
    spacingBetweenMeasures: number;
    chartWidth: number;
    chartHeight: number;
    measureRowHeight: number;
    plotAreaWidth: number;
    barWidth: number;
    barSpacing: number;
}

/**
 * Renderiza todo o gráfico e retorna o HTML
 */
export function renderCompleteChart(params: ChartRenderParams): string {
    const {
        chartData,
        measureCols,
        measureRanges,
        measureConfigs,
        hasSecondaryDimension,
        secondaryDimensions,
        fitWidth,
        fitHeight,
        showYAxis,
        showGridLines,
        dividerLinesBetweenMeasures,
        dividerLinesBetweenGroups,
        dividerLinesBetweenBars,
        dividerLinesColor,
        forceLabels,
        labelFontSize,
        measureTitleFontSize,
        valueLabelFontSize,
        measureNameRotation,
        primaryDateFormat,
        secondaryDateFormat,
        leftMargin,
        topMargin,
        spacingBetweenMeasures,
        chartWidth,
        chartHeight,
        measureRowHeight,
        plotAreaWidth,
        barWidth,
        barSpacing,
    } = params;

    // Renderizar todos os elementos do gráfico
    const allChartElementsHtml = renderAllChartElements({
        chartData,
        measureCols,
        measureRanges,
        measureConfigs,
        leftMargin,
        barWidth,
        barSpacing,
        topMargin,
        measureRowHeight,
        spacingBetweenMeasures,
        valueLabelFontSize,
        forceLabels,
    });

    // Renderizar eixos Y
    const yAxesHtml = renderYAxes(
        measureRanges,
        measureCols,
        topMargin,
        measureRowHeight,
        spacingBetweenMeasures,
        leftMargin,
        leftMargin,
        measureTitleFontSize,
        measureNameRotation,
        showYAxis
    );

    // Linhas divisórias
    const dividerLinesBetweenMeasuresHtml = renderDividerLinesBetweenMeasures({
        showGridLines,
        dividerLinesBetweenMeasures,
        measureCols,
        topMargin,
        measureRowHeight,
        spacingBetweenMeasures,
        leftMargin,
        plotAreaWidth,
        dividerLinesColor,
    });

    const dividerLinesBetweenBarsHtml = renderDividerLinesBetweenBars({
        showGridLines,
        dividerLinesBetweenBars,
        chartData,
        leftMargin,
        barWidth,
        barSpacing,
        topMargin,
        measureCols,
        measureRowHeight,
        spacingBetweenMeasures,
        dividerLinesColor,
    });

    // Eixo X secundário (se houver)
    let secondaryXAxisHtml = '';
    let secondaryXAxisLabelsHtml = '';

    if (hasSecondaryDimension) {
        const secondaryAxis = renderSecondaryXAxis(
            chartData,
            leftMargin,
            barWidth,
            barSpacing,
            measureCols,
            topMargin,
            measureRowHeight,
            spacingBetweenMeasures,
            labelFontSize,
            dividerLinesColor,
            showGridLines,
            dividerLinesBetweenGroups,
            secondaryDateFormat
        );
        secondaryXAxisHtml = secondaryAxis.axisHtml;
        secondaryXAxisLabelsHtml = secondaryAxis.labelsHtml;
    }

    // Eixo X principal
    const lastMeasureRowTop = calculateLastMeasureRowTop(
        measureCols.length,
        topMargin,
        measureRowHeight,
        spacingBetweenMeasures
    );

    const { xAxisLabels, xAxis } = renderXAxis({
        chartData,
        primaryDateFormat,
        formatDimension,
        leftMargin,
        barWidth,
        barSpacing,
        lastMeasureRowTop,
        measureRowHeight,
        labelFontSize,
        plotAreaWidth,
    });

    return createChartHtmlStructure(
        fitWidth,
        fitHeight,
        chartWidth,
        chartHeight,
        secondaryXAxisHtml,
        secondaryXAxisLabelsHtml,
        yAxesHtml,
        dividerLinesBetweenMeasuresHtml,
        dividerLinesBetweenBarsHtml,
        allChartElementsHtml,
        xAxis,
        xAxisLabels
    );
}

