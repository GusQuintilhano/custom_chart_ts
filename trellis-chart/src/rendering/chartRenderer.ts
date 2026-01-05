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
import { renderReferenceLines } from './referenceLines';
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
    dividerLinesBetweenMeasuresColor: string;
    dividerLinesBetweenMeasuresWidth: number;
    dividerLinesBetweenGroupsColor: string;
    dividerLinesBetweenGroupsWidth: number;
    dividerLinesBetweenBarsColor: string;
    dividerLinesBetweenBarsWidth: number;
    forceLabels: boolean;
    labelFontSize: number;
    measureTitleFontSize: number;
    valueLabelFontSize: number;
    measureNameRotation: number;
    primaryDateFormat: string;
    secondaryDateFormat: string;
    yAxisColor: string;
    xAxisColor: string;
    axisStrokeWidth: number;
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
    measureLabelSpace: number;
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
        dividerLinesBetweenMeasuresColor,
        dividerLinesBetweenMeasuresWidth,
        dividerLinesBetweenGroupsColor,
        dividerLinesBetweenGroupsWidth,
        dividerLinesBetweenBarsColor,
        dividerLinesBetweenBarsWidth,
        forceLabels,
        labelFontSize,
        measureTitleFontSize,
        valueLabelFontSize,
        measureNameRotation,
        primaryDateFormat,
        secondaryDateFormat,
    yAxisColor,
    xAxisColor,
    axisStrokeWidth,
    backgroundColor,
        leftMargin,
        topMargin,
        spacingBetweenMeasures,
        chartWidth,
        chartHeight,
        measureRowHeight,
        plotAreaWidth,
        barWidth,
        barSpacing,
        measureLabelSpace,
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
        measureConfigs,
        topMargin,
        measureRowHeight,
        spacingBetweenMeasures,
        leftMargin,
        measureLabelSpace,
        measureTitleFontSize,
        measureNameRotation,
        showYAxis,
        yAxisColor,
        axisStrokeWidth,
        valueLabelFontSize
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
        dividerLinesColor: dividerLinesBetweenMeasuresColor,
        dividerLinesWidth: dividerLinesBetweenMeasuresWidth,
        measureLabelSpace,
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
        dividerLinesColor: dividerLinesBetweenBarsColor,
        dividerLinesWidth: dividerLinesBetweenBarsWidth,
    });

    // Linhas de referência
    const referenceLinesHtml = renderReferenceLines({
        measureConfigs,
        measureRanges,
        measureColsCount: measureCols.length,
        topMargin,
        measureRowHeight,
        spacingBetweenMeasures,
        leftMargin,
        plotAreaWidth,
        valueLabelFontSize,
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
            dividerLinesBetweenGroupsColor,
            dividerLinesBetweenGroupsWidth,
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
        xAxisColor,
        axisStrokeWidth,
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
        referenceLinesHtml,
        allChartElementsHtml,
        xAxis,
        xAxisLabels,
        backgroundColor || '#ffffff'
    );
}

