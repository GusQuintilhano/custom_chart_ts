/**
 * Handler para ajuste dinâmico de dimensões quando fitWidth/fitHeight está ativo
 */

import type { ChartColumn, CustomChartContext } from '@thoughtspot/ts-chart-sdk';
import type { ChartDataPoint, ChartElement, MeasureRange, MeasureConfig } from '../types/chartTypes';
import { formatValue, formatDimension } from '../utils/formatters';
import { calculateLastMeasureRowTop } from '../utils/calculations';
import { renderYAxes, renderXAxis } from '../rendering/axes';
import { renderDividerLinesBetweenMeasures, renderDividerLinesBetweenBars } from '../rendering/dividerLines';
import { renderSecondaryXAxis } from '../rendering/secondaryAxis';
import { renderAllChartElements } from '../rendering/chartElements';

interface AdjustDimensionsParams {
    containerDiv: HTMLElement;
    wrapperDiv: HTMLElement;
    chartElement: ChartElement;
    fitWidth: boolean;
    fitHeight: boolean;
    showYAxis: boolean;
    showGridLines: boolean;
    dividerLinesBetweenMeasures: boolean;
    dividerLinesBetweenBars: boolean;
    dividerLinesBetweenGroups: boolean;
    dividerLinesColor: string;
    dividerLinesBetweenMeasuresColor: string;
    dividerLinesBetweenMeasuresWidth: number;
    dividerLinesBetweenGroupsColor: string;
    dividerLinesBetweenGroupsWidth: number;
    dividerLinesBetweenBarsColor: string;
    dividerLinesBetweenBarsWidth: number;
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
    ctx: CustomChartContext;
}

/**
 * Cria função de ajuste de dimensões para ResizeObserver
 */
export function createAdjustDimensionsFunction(params: AdjustDimensionsParams): () => void {
    const {
        containerDiv,
        wrapperDiv,
        chartElement,
        fitWidth,
        fitHeight,
        showYAxis,
        showGridLines,
        dividerLinesBetweenMeasures,
        dividerLinesBetweenBars,
        dividerLinesBetweenGroups,
        dividerLinesColor,
        dividerLinesBetweenMeasuresColor,
        dividerLinesBetweenMeasuresWidth,
        dividerLinesBetweenGroupsColor,
        dividerLinesBetweenGroupsWidth,
        dividerLinesBetweenBarsColor,
        dividerLinesBetweenBarsWidth,
        forceLabels,
        chartData,
        measureCols,
        measureRanges,
        measureConfigs,
        chartWidth: initialChartWidth,
        chartHeight: initialChartHeight,
        measureRowHeight: initialMeasureRowHeight,
        plotAreaWidth: initialPlotAreaWidth,
        barWidth: initialBarWidth,
        barSpacing: initialBarSpacing,
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

    return () => {
        const containerWidth = containerDiv.clientWidth;
        const containerHeight = containerDiv.clientHeight;
        
        let newChartWidth = initialChartWidth;
        let newChartHeight = initialChartHeight;
        let newMeasureRowHeight = initialMeasureRowHeight;
        let shouldUpdate = false;
        
        // Ajustar largura apenas se fitWidth está ativo
        if (fitWidth && containerWidth > 0 && containerWidth !== initialChartWidth) {
            newChartWidth = containerWidth;
            shouldUpdate = true;
        } else if (!fitWidth) {
            // Quando fitWidth não está ativo, recalcular largura baseada na largura fixa das barras
            const numBars = chartData.length;
            const totalBarWidth = initialBarWidth * numBars;
            const totalBarSpacing = (showYAxis ? 20 : 15) * (numBars - 1);
            const newPlotAreaWidth = totalBarWidth + totalBarSpacing;
            newChartWidth = newPlotAreaWidth + leftMargin + rightMargin;
            
            if (newChartWidth !== initialChartWidth) {
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
        let newBarWidth = initialBarWidth;
        let newBarSpacing = initialBarSpacing;
        
        if (fitWidth && (shouldUpdate || containerWidth > 0)) {
            const newPlotAreaWidth = newChartWidth - leftMargin - rightMargin;
            newBarSpacing = showYAxis ? 20 : Math.max(15, newPlotAreaWidth / (chartData.length * 3));
            const newTotalSpacing = newBarSpacing * (chartData.length - 1);
            newBarWidth = showYAxis ? 40 : Math.max(30, (newPlotAreaWidth - newTotalSpacing) / chartData.length);
        }
        
        // Se há mudanças para aplicar (altura ou largura), recalcular posições
        if (shouldUpdate || (fitWidth && containerWidth > 0)) {
            const newPlotAreaWidth = (!fitWidth) ? initialPlotAreaWidth : (newChartWidth - leftMargin - rightMargin);
            const lastMeasureRowTop = calculateLastMeasureRowTop(
                measureCols.length,
                topMargin,
                newMeasureRowHeight,
                spacingBetweenMeasures
            );
            
            // Recalcular eixos Y
            const newYAxesHtml = renderYAxes(
                measureRanges,
                measureCols,
                topMargin,
                newMeasureRowHeight,
                spacingBetweenMeasures,
                leftMargin,
                leftMargin, // measureLabelSpace = leftMargin
                measureTitleFontSize,
                measureNameRotation,
                showYAxis
            );
            
            // Recalcular linhas divisórias
            const newDividerLinesBetweenMeasuresHtml = renderDividerLinesBetweenMeasures({
                showGridLines,
                dividerLinesBetweenMeasures,
                measureCols,
                topMargin,
                measureRowHeight: newMeasureRowHeight,
                spacingBetweenMeasures,
                leftMargin,
                plotAreaWidth: newPlotAreaWidth,
                dividerLinesColor: dividerLinesBetweenMeasuresColor,
                dividerLinesWidth: dividerLinesBetweenMeasuresWidth,
                measureLabelSpace: leftMargin, // measureLabelSpace é igual a leftMargin
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
                dividerLinesColor: dividerLinesBetweenBarsColor,
                dividerLinesWidth: dividerLinesBetweenBarsWidth,
            });
            
            // Recalcular elementos do gráfico
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
                    dividerLinesBetweenGroupsColor,
                    dividerLinesBetweenGroupsWidth,
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
            
            // Atualizar wrapper e SVG com novos valores
            if (wrapperDiv && !fitWidth) {
                wrapperDiv.style.width = `${newChartWidth}px`;
                wrapperDiv.style.height = fitHeight ? '100%' : `${newChartHeight}px`;
            }
            
            // Atualizar SVG width também quando não está em fitWidth
            if (wrapperDiv && !fitWidth) {
                const svgElement = wrapperDiv?.querySelector('svg') as SVGSVGElement;
                if (svgElement) {
                    svgElement.setAttribute('width', `${newChartWidth}px`);
                }
            }
            
            const svgElement = wrapperDiv?.querySelector('svg') as SVGSVGElement;
            if (svgElement) {
                svgElement.setAttribute('viewBox', `0 0 ${newChartWidth} ${newChartHeight}`);
                svgElement.innerHTML = newSecondaryXAxisHtml + newSecondaryXAxisLabelsHtml + newYAxesHtml + newDividerLinesBetweenMeasuresHtml + newDividerLinesBetweenBarsHtml + newAllChartElementsHtml + newXAxis + newXAxisLabels;
            }
        }
    };
}

/**
 * Configura ResizeObserver para ajustar dimensões dinamicamente
 */
export function setupResizeObserver(
    chartElement: ChartElement,
    containerDiv: HTMLElement,
    adjustDimensions: () => void
): void {
    // Limpar observer anterior se existir
    if (chartElement.__resizeObserver) {
        chartElement.__resizeObserver.disconnect();
    }
    
    // Ajustar após um pequeno delay para garantir que o container foi renderizado
    setTimeout(() => {
        adjustDimensions();
        
        // Observar mudanças no tamanho do container
        const resizeObserver = new ResizeObserver(() => {
            adjustDimensions();
        });
        
        resizeObserver.observe(containerDiv);
        chartElement.__resizeObserver = resizeObserver;
    }, 100);
}

