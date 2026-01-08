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
import { renderReferenceLines } from '../rendering/referenceLines';
import { formatDimension } from '@shared/utils/formatters';
import { calculateLastMeasureRowTop } from '@shared/utils/calculations';

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
    measureLabelSpace: number;
    yAxisColor: string;
    xAxisColor: string;
    axisStrokeWidth: number;
    backgroundColor: string;
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
        measureLabelSpace,
        yAxisColor,
        xAxisColor,
        axisStrokeWidth,
        backgroundColor,
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
        // Tentar obter dimensões do container de várias formas
        // IMPORTANTE: Quando fitWidth está ativo, usar offsetWidth ou getBoundingClientRect
        // em vez de clientWidth, pois clientWidth não inclui padding
        let containerWidth = fitWidth 
            ? (containerDiv.offsetWidth || containerDiv.getBoundingClientRect().width || containerDiv.clientWidth || 0)
            : containerDiv.clientWidth;
        let containerHeight = fitHeight
            ? (containerDiv.offsetHeight || containerDiv.getBoundingClientRect().height || containerDiv.clientHeight || 0)
            : containerDiv.clientHeight;
        
        // Se ainda não temos dimensões, tentar outras formas
        if (fitWidth && containerWidth === 0) {
            containerWidth = containerDiv.offsetWidth || containerDiv.getBoundingClientRect().width || 0;
        }
        if (fitHeight && containerHeight === 0) {
            containerHeight = containerDiv.offsetHeight || containerDiv.getBoundingClientRect().height || 0;
        }
        
        // Se ainda não temos dimensões e fitWidth está ativo, tentar obter do elemento pai
        if (fitWidth && containerWidth === 0 && containerDiv.parentElement) {
            // Para o pai, também usar offsetWidth para incluir padding
            const parentWidth = containerDiv.parentElement.offsetWidth || 
                              containerDiv.parentElement.getBoundingClientRect().width ||
                              containerDiv.parentElement.clientWidth || 0;
            if (parentWidth > 0) {
                containerWidth = parentWidth;
                
                // Log quando obtemos dimensões do pai
                console.log('[FitWidth] Dimensões obtidas do elemento pai:', {
                    containerWidth,
                    parentWidth,
                    parentElement: containerDiv.parentElement.tagName,
                });
            }
        }
        
        // Se fitWidth está ativo mas o container ainda não tem dimensões, aguardar
        if (fitWidth && containerWidth === 0) {
            return;
        }

        let newChartWidth = chartWidth;
        let newChartHeight = chartHeight;
        let newMeasureRowHeight = measureRowHeight;
        let shouldUpdate = false;

        // Ajustar largura se fitWidth está ativo
        // Quando fitWidth está ativo, SEMPRE usar containerWidth (ajustar independente do valor anterior)
        if (fitWidth && containerWidth > 0) {
            // Sempre recalcular quando fitWidth está ativo, mesmo se o valor não mudou
            // Isso garante que o gráfico seja ajustado corretamente na primeira renderização
            newChartWidth = containerWidth;
            shouldUpdate = true;
            
            console.log('[FitWidth] Ajustando largura:', {
                fitWidth,
                containerWidth,
                chartWidth,
                newChartWidth,
                containerDivClientWidth: containerDiv.clientWidth,
                containerDivOffsetWidth: containerDiv.offsetWidth,
                containerDivBoundingRect: containerDiv.getBoundingClientRect().width,
                wrapperDivClientWidth: wrapperDiv?.clientWidth,
                wrapperDivOffsetWidth: wrapperDiv?.offsetWidth,
            });
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

        // Quando fitWidth está ativo, SEMPRE recalcular barWidth e barSpacing baseado no novo tamanho
        if (fitWidth && containerWidth > 0) {
            const newPlotAreaWidth = newChartWidth - leftMargin - rightMargin;
            newBarSpacing = showYAxis ? 20 : Math.max(15, newPlotAreaWidth / (chartData.length * 3));
            const newTotalSpacing = newBarSpacing * (chartData.length - 1);
            newBarWidth = showYAxis ? 40 : Math.max(30, (newPlotAreaWidth - newTotalSpacing) / chartData.length);
            // Garantir que sempre atualizamos quando fitWidth está ativo
            shouldUpdate = true;
        }

        // Se há mudanças (ou fitWidth está ativo e temos containerWidth), recalcular e atualizar
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
                measureConfigs,
                topMargin,
                newMeasureRowHeight,
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
                measureLabelSpace,
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
                hasSecondaryDimension,
                secondaryDateFormat,
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

            // Linhas de referência
            const newReferenceLinesHtml = renderReferenceLines({
                measureConfigs,
                measureRanges,
                measureColsCount: measureCols.length,
                topMargin,
                measureRowHeight: newMeasureRowHeight,
                spacingBetweenMeasures,
                leftMargin,
                plotAreaWidth: newPlotAreaWidth,
                valueLabelFontSize,
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
                xAxisColor,
                axisStrokeWidth,
            });

            // Atualizar wrapper e SVG
            // Quando fitWidth está ativo, wrapper deve ser 100% da largura
            if (wrapperDiv) {
                if (fitWidth) {
                    wrapperDiv.style.width = '100%';
                    wrapperDiv.style.minWidth = '100%';
                    wrapperDiv.style.maxWidth = '100%';
                    
                    console.log('[FitWidth] Aplicando estilos ao wrapper:', {
                        width: wrapperDiv.style.width,
                        minWidth: wrapperDiv.style.minWidth,
                        maxWidth: wrapperDiv.style.maxWidth,
                        computedWidth: window.getComputedStyle(wrapperDiv).width,
                        actualWidth: wrapperDiv.offsetWidth,
                    });
                } else {
                    wrapperDiv.style.width = `${newChartWidth}px`;
                    wrapperDiv.style.minWidth = '';
                    wrapperDiv.style.maxWidth = '';
                }
                wrapperDiv.style.height = fitHeight ? '100%' : `${newChartHeight}px`;
            }
            
            // Garantir que o container também tenha width: 100% quando fitWidth está ativo
            if (fitWidth) {
                containerDiv.style.width = '100%';
                containerDiv.style.minWidth = '100%';
                containerDiv.style.maxWidth = '100%';
                containerDiv.style.boxSizing = 'border-box';
                containerDiv.style.position = 'relative';
                containerDiv.style.margin = '0';
                containerDiv.style.padding = '0';
                
                // Se o container está menor que o pai, tentar compensar com margin negativo
                const parentWidth = containerDiv.parentElement?.offsetWidth || 0;
                const currentWidth = containerDiv.offsetWidth;
                const computedStyle = window.getComputedStyle(containerDiv);
                const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
                const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
                const marginLeft = parseFloat(computedStyle.marginLeft) || 0;
                const marginRight = parseFloat(computedStyle.marginRight) || 0;
                
                // Se há diferença entre parentWidth e currentWidth, pode ser padding do pai
                if (parentWidth > 0 && currentWidth < parentWidth) {
                    const parentComputedStyle = window.getComputedStyle(containerDiv.parentElement!);
                    const parentPaddingLeft = parseFloat(parentComputedStyle.paddingLeft) || 0;
                    const parentPaddingRight = parseFloat(parentComputedStyle.paddingRight) || 0;
                    
                    // Tentar usar calc para compensar padding do pai
                    if (parentPaddingLeft > 0 || parentPaddingRight > 0) {
                        containerDiv.style.width = `calc(100% + ${parentPaddingLeft + parentPaddingRight}px)`;
                        containerDiv.style.marginLeft = `-${parentPaddingLeft}px`;
                        containerDiv.style.marginRight = `-${parentPaddingRight}px`;
                    }
                }
                
                console.log('[FitWidth] Aplicando estilos ao container:', {
                    width: containerDiv.style.width,
                    minWidth: containerDiv.style.minWidth,
                    maxWidth: containerDiv.style.maxWidth,
                    boxSizing: containerDiv.style.boxSizing,
                    computedWidth: window.getComputedStyle(containerDiv).width,
                    actualWidth: containerDiv.offsetWidth,
                    parentWidth: containerDiv.parentElement?.offsetWidth,
                    parentPaddingLeft: parseFloat(window.getComputedStyle(containerDiv.parentElement!).paddingLeft) || 0,
                    parentPaddingRight: parseFloat(window.getComputedStyle(containerDiv.parentElement!).paddingRight) || 0,
                    paddingLeft,
                    paddingRight,
                    marginLeft,
                    marginRight,
                });
            }

            const svgElement = wrapperDiv?.querySelector('svg') as SVGSVGElement;
            if (svgElement) {
                // SVG sempre usa viewBox para scaling responsivo
                // IMPORTANTE: viewBox deve refletir as dimensões reais do gráfico
                svgElement.setAttribute('viewBox', `0 0 ${newChartWidth} ${newChartHeight}`);
                
                if (fitWidth) {
                    // Quando fitWidth está ativo, SVG deve ocupar 100% da largura do wrapper
                    svgElement.setAttribute('width', '100%');
                    svgElement.setAttribute('height', fitHeight ? '100%' : `${newChartHeight}px`);
                    // preserveAspectRatio: quando apenas fitWidth, usar 'xMidYMin slice' para permitir escala na largura
                    // quando apenas fitHeight, usar 'xMidYMid meet' para permitir escala na altura
                    // quando ambos, usar 'xMidYMid meet' para manter proporção
                    const preserveAspectRatio = fitWidth && fitHeight ? 'xMidYMid meet' 
                        : fitWidth ? 'xMidYMin slice' 
                        : fitHeight ? 'xMidYMid meet' 
                        : 'none';
                    svgElement.setAttribute('preserveAspectRatio', preserveAspectRatio);
                    
                    console.log('[FitWidth] Aplicando atributos ao SVG:', {
                        width: svgElement.getAttribute('width'),
                        height: svgElement.getAttribute('height'),
                        viewBox: svgElement.getAttribute('viewBox'),
                        preserveAspectRatio: svgElement.getAttribute('preserveAspectRatio'),
                        computedWidth: window.getComputedStyle(svgElement).width,
                        actualWidth: svgElement.clientWidth,
                        actualBoundingRect: svgElement.getBoundingClientRect().width,
                    });
                } else {
                    svgElement.setAttribute('width', `${newChartWidth}px`);
                    svgElement.setAttribute('height', `${newChartHeight}px`);
                    svgElement.setAttribute('preserveAspectRatio', fitHeight ? 'xMidYMid meet' : 'none');
                }
                
                svgElement.innerHTML = newSecondaryXAxisLabelsHtml + newYAxesHtml + 
                    newDividerLinesBetweenMeasuresHtml + newDividerLinesBetweenBarsHtml + newSecondaryXAxisHtml + 
                    newAllChartElementsHtml + newReferenceLinesHtml + newXAxis + newXAxisLabels + `<rect width="100%" height="100%" fill="${backgroundColor}" />`;
            }
        }
    };

    // Ajustar imediatamente
    adjustDimensions();
    
    // Também observar mudanças no container
    const resizeObserver = new ResizeObserver(() => {
        adjustDimensions();
    });
    resizeObserver.observe(containerDiv);
    chartElement.__resizeObserver = resizeObserver;
    
    // Ajustar novamente após delays para casos onde o container ainda não tem dimensões finais
    // Isso é especialmente importante quando fitWidth está ativo
    setTimeout(() => {
        adjustDimensions();
    }, 50);
    
    setTimeout(() => {
        adjustDimensions();
    }, 100);
    
    // Se fitWidth está ativo, fazer mais tentativas para garantir que o ajuste seja feito
    if (fitWidth) {
        setTimeout(() => {
            adjustDimensions();
        }, 200);
        setTimeout(() => {
            adjustDimensions();
        }, 300);
        setTimeout(() => {
            adjustDimensions();
        }, 500);
        setTimeout(() => {
            adjustDimensions();
        }, 1000);
    }
}

