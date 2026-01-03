/**
 * Handler para ajuste dinâmico de dimensões quando fitWidth/fitHeight está ativo
 * Versão simplificada que usa os módulos de renderização existentes
 */

import type { ChartElement, ChartDataPoint, MeasureConfig, MeasureRange } from '../types/chartTypes';
import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import { renderYAxes, renderXAxis } from '../rendering/axes';
import { renderDividerLinesBetweenMeasures, renderDividerLinesBetweenBars } from '../rendering/dividerLines';
import { renderSecondaryXAxis } from '../rendering/secondaryAxis';
import { renderAllChartElements } from '../rendering/chartElements';
import { formatDimension } from '../utils/formatters';
import { calculateLastMeasureRowTop } from '../utils/calculations';

export interface DynamicResizeParams {
    chartElement: ChartElement;
    fitWidth: boolean;
    fitHeight: boolean;
    showYAxis: boolean;
    showGridLines: boolean;
    dividerLinesBetweenMeasures: boolean;
    dividerLinesBetweenBars: boolean;
    dividerLinesBetweenGroups: boolean;
    dividerLinesColor: string;
    forceLabels: boolean;
    chartData: ChartDataPoint[];
    measureCols: ChartColumn[];
    measureRanges: MeasureRange[];
    measureConfigs: MeasureConfig[];
    chartWidth: number;
    chartHeight: number;
    measureRowHeight: number;
    plotAreaWidth: number;
    barWidth: number;
    barSpacing: number;
    leftMargin: number;
    rightMargin: number;
    topMargin: number;
    bottomMargin: number;
    spacingBetweenMeasures: number;
    measureTitleFontSize: number;
    measureNameRotation: number;
    labelFontSize: number;
    valueLabelFontSize: number;
    primaryDateFormat: string;
    secondaryDateFormat: string;
    hasSecondaryDimension: boolean;
    secondaryDimensions: ChartColumn[];
}

/**
 * Configura o ResizeObserver para ajuste dinâmico
 */
export function setupDynamicResize(params: DynamicResizeParams): void {
    const {
        chartElement,
        fitWidth,
        fitHeight,
        showYAxis,
        showGridLines,
        dividerLinesBetweenMeasures,
        dividerLinesBetweenBars,
        dividerLinesBetweenGroups,
        dividerLinesColor,
        forceLabels,
        chartData,
        measureCols,
        measureRanges,
        measureConfigs,
        chartWidth,
        chartHeight,
        measureRowHeight,
        plotAreaWidth,
        barWidth,
        barSpacing,
        leftMargin,
        rightMargin,
        topMargin,
        bottomMargin,
        spacingBetweenMeasures,
        measureTitleFontSize,
        measureNameRotation,
        labelFontSize,
        valueLabelFontSize,
        primaryDateFormat,
        secondaryDateFormat,
        hasSecondaryDimension,
        secondaryDimensions,
    } = params;

    if (!fitWidth && !fitHeight) {
        return; // Não precisa de resize dinâmico
    }

    // Limpar observer anterior se existir
    if (chartElement.__resizeObserver) {
        chartElement.__resizeObserver.disconnect();
    }

    const containerDiv = chartElement.querySelector('div') as HTMLElement;
    const wrapperDiv = containerDiv?.querySelector('div') as HTMLElement;

    if (!containerDiv || !wrapperDiv) {
        return;
    }

    const adjustDimensions = () => {
        const containerWidth = containerDiv.clientWidth;
        const containerHeight = containerDiv.clientHeight;

        let newChartWidth = chartWidth;
        let newChartHeight = chartHeight;
        let newMeasureRowHeight = measureRowHeight;
        let shouldUpdate = false;

        // Ajustar largura se fitWidth está ativo
        if (fitWidth && containerWidth > 0 && containerWidth !== chartWidth) {
            newChartWidth = containerWidth;
            shouldUpdate = true;
        } else if (!fitWidth) {
            const numBars = chartData.length;
            const totalBarWidth = barWidth * numBars;
            const totalBarSpacing = (showYAxis ? 20 : 15) * (numBars - 1);
            const newPlotAreaWidth = totalBarWidth + totalBarSpacing;
            newChartWidth = newPlotAreaWidth + leftMargin + rightMargin;
            if (newChartWidth !== chartWidth) {
                shouldUpdate = true;
            }
        }

        // Ajustar altura se fitHeight está ativo
        if (fitHeight && containerHeight > 0) {
            newChartHeight = containerHeight;
            newMeasureRowHeight = (newChartHeight - topMargin - bottomMargin - (spacingBetweenMeasures * (measureCols.length - 1))) / measureCols.length;
            shouldUpdate = true;
        }

        // Definir largura e espaçamento das barras
        let newBarWidth = barWidth;
        let newBarSpacing = barSpacing;

        if (fitWidth && (shouldUpdate || containerWidth > 0)) {
            const newPlotAreaWidth = newChartWidth - leftMargin - rightMargin;
            newBarSpacing = showYAxis ? 20 : Math.max(15, newPlotAreaWidth / (chartData.length * 3));
            const newTotalSpacing = newBarSpacing * (chartData.length - 1);
            newBarWidth = showYAxis ? 40 : Math.max(30, (newPlotAreaWidth - newTotalSpacing) / chartData.length);
        }

        // Se há mudanças, recalcular e atualizar
        if (shouldUpdate || (fitWidth && containerWidth > 0)) {
            const newPlotAreaWidth = (!fitWidth) ? plotAreaWidth : (newChartWidth - leftMargin - rightMargin);
            const lastMeasureRowTop = calculateLastMeasureRowTop(
                measureCols.length,
                topMargin,
                newMeasureRowHeight,
                spacingBetweenMeasures
            );

            // Recalcular todos os elementos usando módulos
            const newYAxesHtml = renderYAxes(
                measureRanges,
                measureCols,
                topMargin,
                newMeasureRowHeight,
                spacingBetweenMeasures,
                leftMargin,
                leftMargin,
                measureTitleFontSize,
                measureNameRotation,
                showYAxis
            );

            const newDividerLinesBetweenMeasuresHtml = renderDividerLinesBetweenMeasures({
                showGridLines,
                dividerLinesBetweenMeasures,
                measureCols,
                topMargin,
                measureRowHeight: newMeasureRowHeight,
                spacingBetweenMeasures,
                leftMargin,
                plotAreaWidth: newPlotAreaWidth,
                dividerLinesColor,
            });

            const newDividerLinesBetweenBarsHtml = renderDividerLinesBetweenBars({
                showGridLines,
                dividerLinesBetweenBars,
                chartData,
                leftMargin,
                barWidth: newBarWidth,
                barSpacing: newBarSpacing,
                topMargin,
                measureCols,
                measureRowHeight: newMeasureRowHeight,
                spacingBetweenMeasures,
                dividerLinesColor,
            });

            const newAllChartElementsHtml = renderAllChartElements({
                chartData,
                measureCols,
                measureRanges,
                measureConfigs,
                leftMargin,
                barWidth: newBarWidth,
                barSpacing: newBarSpacing,
                topMargin,
                measureRowHeight: newMeasureRowHeight,
                spacingBetweenMeasures,
                valueLabelFontSize,
                forceLabels,
            });

            // Recalcular eixo X secundário (se houver)
            let newSecondaryXAxisHtml = '';
            let newSecondaryXAxisLabelsHtml = '';
            if (hasSecondaryDimension && secondaryDimensions.length >= 1) {
                const secondaryAxisResult = renderSecondaryXAxis(
                    chartData,
                    leftMargin,
                    newBarWidth,
                    newBarSpacing,
                    measureCols,
                    topMargin,
                    newMeasureRowHeight,
                    spacingBetweenMeasures,
                    labelFontSize,
                    dividerLinesColor,
                    showGridLines,
                    dividerLinesBetweenGroups,
                    secondaryDateFormat
                );
                newSecondaryXAxisHtml = secondaryAxisResult.axisHtml;
                newSecondaryXAxisLabelsHtml = secondaryAxisResult.labelsHtml;
            }

            // Recalcular eixo X principal
            const { xAxisLabels: newXAxisLabels, xAxis: newXAxis } = renderXAxis({
                chartData,
                primaryDateFormat,
                formatDimension,
                leftMargin,
                barWidth: newBarWidth,
                barSpacing: newBarSpacing,
                lastMeasureRowTop,
                measureRowHeight: newMeasureRowHeight,
                labelFontSize,
                plotAreaWidth: newPlotAreaWidth,
            });

            // Atualizar wrapper e SVG
            if (wrapperDiv && !fitWidth) {
                wrapperDiv.style.width = `${newChartWidth}px`;
                wrapperDiv.style.height = fitHeight ? '100%' : `${newChartHeight}px`;
            }

            if (wrapperDiv && !fitWidth) {
                const svgElement = wrapperDiv?.querySelector('svg') as SVGSVGElement;
                if (svgElement) {
                    svgElement.setAttribute('width', `${newChartWidth}px`);
                }
            }

            const svgElement = wrapperDiv?.querySelector('svg') as SVGSVGElement;
            if (svgElement) {
                svgElement.setAttribute('viewBox', `0 0 ${newChartWidth} ${newChartHeight}`);
                svgElement.innerHTML = newSecondaryXAxisHtml + newSecondaryXAxisLabelsHtml + newYAxesHtml + 
                    newDividerLinesBetweenMeasuresHtml + newDividerLinesBetweenBarsHtml + newAllChartElementsHtml + 
                    newXAxis + newXAxisLabels;
            }
        }
    };

    // Ajustar após um pequeno delay
    setTimeout(() => {
        adjustDimensions();
        const resizeObserver = new ResizeObserver(() => {
            adjustDimensions();
        });
        resizeObserver.observe(containerDiv);
        chartElement.__resizeObserver = resizeObserver;
    }, 100);
}

