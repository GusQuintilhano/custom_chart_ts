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

    // Garantir que o chartElement ocupe 100% da largura quando fitWidth está ativo
    if (fitWidth) {
        chartElement.style.width = '100%';
        chartElement.style.minWidth = '100%';
        chartElement.style.maxWidth = '100%';
        chartElement.style.boxSizing = 'border-box';
        chartElement.style.margin = '0';
        chartElement.style.padding = '0';
    }
    
    const containerDiv = chartElement.querySelector('div') as HTMLElement;
    const wrapperDiv = containerDiv?.querySelector('div') as HTMLElement;

    if (!containerDiv || !wrapperDiv) {
        return;
    }
    
    // Armazenar as últimas dimensões para evitar re-renderizações desnecessárias
    let lastContainerWidth = 0;
    let lastContainerHeight = 0;
    let lastChartWidth = chartWidth;
    let lastChartHeight = chartHeight;

    const adjustDimensions = () => {
        // Tentar obter dimensões do container de várias formas
        // IMPORTANTE: Quando fitWidth está ativo, usar clientWidth (espaço útil) como prioridade
        // Isso garante que o SVG seja calculado para o espaço útil disponível, sem criar barra de rolagem
        // O SVG com width: 100% vai escalar para ocupar exatamente o espaço útil do container
        let containerWidth = fitWidth 
            ? (containerDiv.clientWidth || containerDiv.getBoundingClientRect().width || containerDiv.offsetWidth || 0)
            : containerDiv.clientWidth;
        let containerHeight = fitHeight
            ? (containerDiv.clientHeight || containerDiv.getBoundingClientRect().height || containerDiv.offsetHeight || 0)
            : containerDiv.clientHeight;
        
        // Se ainda não temos dimensões, tentar outras formas
        if (fitWidth && containerWidth === 0) {
            containerWidth = containerDiv.clientWidth || containerDiv.getBoundingClientRect().width || containerDiv.offsetWidth || 0;
        }
        if (fitHeight && containerHeight === 0) {
            containerHeight = containerDiv.clientHeight || containerDiv.getBoundingClientRect().height || containerDiv.offsetHeight || 0;
        }
        
        // Se ainda não temos dimensões e fitWidth está ativo, tentar obter do elemento pai
        if (fitWidth && containerWidth === 0 && containerDiv.parentElement) {
            const parentWidth = containerDiv.parentElement.offsetWidth || 
                              containerDiv.parentElement.getBoundingClientRect().width ||
                              containerDiv.parentElement.clientWidth || 0;
            if (parentWidth > 0) {
                containerWidth = parentWidth;
            }
        }
        
        // Se fitWidth está ativo mas o container ainda não tem dimensões, aguardar
        if (fitWidth && containerWidth === 0) {
            console.log('[FitWidth] adjustDimensions: containerWidth ainda é 0, aguardando...', {
                containerDivClientWidth: containerDiv.clientWidth,
                containerDivOffsetWidth: containerDiv.offsetWidth,
                containerDivBoundingRect: containerDiv.getBoundingClientRect().width,
                parentWidth: containerDiv.parentElement?.clientWidth,
            });
            return;
        }

        // Verificar se as dimensões mudaram significativamente (diferença maior que 1px)
        // Isso evita re-renderizações desnecessárias quando há apenas pequenas variações
        // IMPORTANTE: Sempre renderizar na primeira vez (lastContainerWidth === 0)
        const isFirstRender = lastContainerWidth === 0;
        const widthChanged = Math.abs(containerWidth - lastContainerWidth) > 1;
        const heightChanged = Math.abs(containerHeight - lastContainerHeight) > 1;
        const chartSizeChanged = lastChartWidth !== chartWidth || lastChartHeight !== chartHeight;
        
        // Se não houve mudança significativa e já renderizamos com essas dimensões, não atualizar
        // MAS sempre renderizar na primeira vez (isFirstRender)
        // IMPORTANTE: Se fitWidth está ativo e ainda não renderizamos com essas dimensões, sempre atualizar
        if (!isFirstRender && !widthChanged && !heightChanged && !chartSizeChanged) {
            console.log('[FitWidth] adjustDimensions: Pulando atualização - dimensões não mudaram', {
                containerWidth,
                lastContainerWidth,
                widthChanged,
                heightChanged,
                chartSizeChanged,
            });
            return;
        }

        let newChartWidth = chartWidth;
        let newChartHeight = chartHeight;
        let newMeasureRowHeight = measureRowHeight;
        let shouldUpdate = false;

        // Ajustar largura se fitWidth está ativo
        if (fitWidth && containerWidth > 0) {
            // IMPORTANTE: O conteúdo do gráfico deve ser renderizado no mesmo tamanho do viewBox
            // Para isso, precisamos usar o espaço real disponível do wrapper
            // Primeiro, garantir que o wrapper está configurado corretamente
            let actualWidth = containerWidth;
            if (wrapperDiv) {
                // Configurar o wrapper primeiro
                wrapperDiv.style.width = '100%';
                wrapperDiv.style.boxSizing = 'border-box';
                // Forçar um reflow para garantir que o DOM seja atualizado
                void wrapperDiv.offsetWidth;
                // Obter o tamanho real do wrapper após o reflow
                const wrapperRect = wrapperDiv.getBoundingClientRect();
                const wrapperClientWidth = wrapperDiv.clientWidth || wrapperRect.width || containerWidth;
                actualWidth = wrapperClientWidth;
            }
            newChartWidth = actualWidth;
            shouldUpdate = true;
            
            console.log('[FitWidth] adjustDimensions: Ajustando largura do gráfico', {
                containerWidth,
                wrapperClientWidth: wrapperDiv?.clientWidth,
                wrapperBoundingRect: wrapperDiv?.getBoundingClientRect().width,
                actualWidth,
                chartWidth,
                newChartWidth,
                lastContainerWidth,
                widthChanged,
                isFirstRender,
                shouldUpdate,
                info: 'newChartWidth será usado tanto para o viewBox quanto para renderizar o conteúdo',
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
        // IGNORAR configurações de largura de barras e calcular para que ocupe exatamente a largura disponível
        // Estratégia: usar espaçamento mínimo fixo e distribuir o restante entre as barras
        if (fitWidth && containerWidth > 0) {
            const newPlotAreaWidth = newChartWidth - leftMargin - rightMargin;
            const numBars = chartData.length;
            
            if (numBars === 0) {
                newBarWidth = 0;
                newBarSpacing = 0;
            } else if (numBars === 1) {
                // Se há apenas uma barra, usar toda a largura disponível
                newBarWidth = newPlotAreaWidth;
                newBarSpacing = 0;
            } else {
                // Usar espaçamento mínimo fixo (2px) e distribuir o restante entre as barras
                // Isso garante que o gráfico caiba exatamente na largura disponível
                const minBarSpacing = 2;
                const totalSpacing = minBarSpacing * (numBars - 1);
                const availableWidthForBars = newPlotAreaWidth - totalSpacing;
                
                if (availableWidthForBars <= 0) {
                    // Se não há espaço suficiente, usar espaçamento mínimo e dividir o restante
                    newBarSpacing = minBarSpacing;
                    newBarWidth = Math.max(1, newPlotAreaWidth / (numBars * 2)); // Dividir espaço igualmente
                } else {
                    newBarSpacing = minBarSpacing;
                    newBarWidth = availableWidthForBars / numBars;
                }
                
                // Garantir que a soma seja exatamente newPlotAreaWidth (ajuste fino)
                const calculatedTotal = (newBarWidth * numBars) + (newBarSpacing * (numBars - 1));
                const diff = newPlotAreaWidth - calculatedTotal;
                if (Math.abs(diff) > 0.01) {
                    // Ajustar barWidth para compensar qualquer diferença
                    newBarWidth += diff / numBars;
                }
            }
            
            // Garantir que sempre atualizamos quando fitWidth está ativo
            shouldUpdate = true;
            
            console.log('[FitWidth] adjustDimensions: Recalculando barWidth e barSpacing para fitWidth', {
                newPlotAreaWidth,
                numBars,
                newBarWidth,
                newBarSpacing,
                calculatedTotal: (newBarWidth * numBars) + (newBarSpacing * (numBars - 1)),
                shouldEqual: newPlotAreaWidth,
                diff: newPlotAreaWidth - ((newBarWidth * numBars) + (newBarSpacing * (numBars - 1))),
            });
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
                    // Usar clientWidth (espaço útil) em vez de offsetWidth para evitar barra de rolagem
                    // O wrapper deve ocupar 100% do container, sem margens negativas
                    wrapperDiv.style.width = '100%';
                    wrapperDiv.style.marginLeft = '0';
                    wrapperDiv.style.marginRight = '0';
                    wrapperDiv.style.minWidth = '100%';
                    wrapperDiv.style.maxWidth = '100%';
                    wrapperDiv.style.boxSizing = 'border-box';
                } else {
                    wrapperDiv.style.width = `${newChartWidth}px`;
                    wrapperDiv.style.minWidth = '';
                    wrapperDiv.style.maxWidth = '';
                    wrapperDiv.style.marginLeft = '';
                    wrapperDiv.style.marginRight = '';
                }
                // Quando apenas fitWidth está ativo, o wrapper deve ter altura fixa para permitir scroll
                // Quando fitHeight está ativo, o wrapper deve ter altura 100%
                wrapperDiv.style.height = fitHeight ? '100%' : `${newChartHeight}px`;
                wrapperDiv.style.flexShrink = '0';
            }
            
            // Garantir que o container também tenha width: 100% quando fitWidth está ativo
            if (fitWidth) {
                // Remover qualquer padding/margin que possa estar limitando a largura
                // IMPORTANTE: Remover explicitamente todos os lados para garantir que não há padding/border
                containerDiv.style.width = '100%';
                containerDiv.style.minWidth = '100%';
                containerDiv.style.maxWidth = '100%';
                containerDiv.style.boxSizing = 'border-box';
                containerDiv.style.position = 'relative';
                containerDiv.style.margin = '0';
                containerDiv.style.padding = '0';
                containerDiv.style.border = 'none';
                containerDiv.style.borderLeft = 'none';
                containerDiv.style.borderRight = 'none';
                containerDiv.style.borderTop = 'none';
                containerDiv.style.borderBottom = 'none';
                containerDiv.style.paddingLeft = '0';
                containerDiv.style.paddingRight = '0';
                containerDiv.style.paddingTop = '0';
                containerDiv.style.paddingBottom = '0';
                containerDiv.style.marginLeft = '0';
                containerDiv.style.marginRight = '0';
                containerDiv.style.marginTop = '0';
                containerDiv.style.marginBottom = '0';
                containerDiv.style.display = 'block';
                // Manter overflow correto: se apenas fitWidth, permitir scroll vertical
                // Se ambos fitWidth e fitHeight, esconder overflow
                containerDiv.style.overflow = fitHeight ? 'hidden' : 'auto';
                
                // Verificar se ainda há diferença entre offsetWidth e clientWidth após remover padding/border
                const computedStyle = window.getComputedStyle(containerDiv);
                const actualClientWidth = containerDiv.clientWidth;
                const actualOffsetWidth = containerDiv.offsetWidth;
                const diff = actualOffsetWidth - actualClientWidth;
                
                if (diff > 0) {
                    console.log('[FitWidth] adjustDimensions: Ainda há diferença entre offsetWidth e clientWidth após remover padding/border', {
                        offsetWidth: actualOffsetWidth,
                        clientWidth: actualClientWidth,
                        diff,
                        computedPaddingLeft: computedStyle.paddingLeft,
                        computedPaddingRight: computedStyle.paddingRight,
                        computedBorderLeft: computedStyle.borderLeftWidth,
                        computedBorderRight: computedStyle.borderRightWidth,
                        info: 'Usando offsetWidth (' + actualOffsetWidth + 'px) para ocupar todo o espaço disponível',
                    });
                }
            }

            const svgElement = wrapperDiv?.querySelector('svg') as SVGSVGElement;
            if (svgElement) {
                // SVG sempre usa viewBox para scaling responsivo
                // IMPORTANTE: viewBox deve refletir as dimensões reais do gráfico
                svgElement.setAttribute('viewBox', `0 0 ${newChartWidth} ${newChartHeight}`);
                
                if (fitWidth) {
                    // Quando fitWidth está ativo, SVG deve ocupar 100% da largura do wrapper
                    // Usar clientWidth do container para evitar barra de rolagem horizontal
                    // O SVG vai escalar para ocupar todo o espaço útil disponível
                    svgElement.setAttribute('width', '100%');
                    svgElement.setAttribute('height', fitHeight ? '100%' : `${newChartHeight}px`);
                    // preserveAspectRatio: quando apenas fitWidth, usar 'none' para permitir escala independente
                    // Isso evita comprimir o texto - o SVG vai escalar para ocupar 100% da largura
                    // sem manter proporção, permitindo que o conteúdo ocupe todo o espaço disponível
                    // quando apenas fitHeight, usar 'xMidYMid meet' para permitir escala na altura
                    // quando ambos, usar 'xMidYMid meet' para manter proporção
                    const preserveAspectRatio = fitWidth && fitHeight ? 'xMidYMid meet' 
                        : fitWidth ? 'none' 
                        : fitHeight ? 'xMidYMid meet' 
                        : 'none';
                    svgElement.setAttribute('preserveAspectRatio', preserveAspectRatio);
                    
                    console.log('[FitWidth] adjustDimensions: SVG atualizado com fitWidth', {
                        viewBox: svgElement.getAttribute('viewBox'),
                        width: svgElement.getAttribute('width'),
                        height: svgElement.getAttribute('height'),
                        preserveAspectRatio: svgElement.getAttribute('preserveAspectRatio'),
                        svgBoundingRect: svgElement.getBoundingClientRect().width,
                        wrapperClientWidth: wrapperDiv?.clientWidth,
                        wrapperOffsetWidth: wrapperDiv?.offsetWidth,
                        containerClientWidth: containerDiv.clientWidth,
                        containerOffsetWidth: containerDiv.offsetWidth,
                        newChartWidth,
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
            
            // Atualizar variáveis de controle para evitar re-renderizações desnecessárias
            lastContainerWidth = containerWidth;
            lastContainerHeight = containerHeight;
            lastChartWidth = newChartWidth;
            lastChartHeight = newChartHeight;
            
            console.log('[FitWidth] adjustDimensions: Atualização concluída', {
                containerWidth,
                containerHeight,
                newChartWidth,
                newChartHeight,
                lastContainerWidth,
                lastContainerHeight,
                lastChartWidth,
                lastChartHeight,
                shouldUpdate,
            });
        }
    };

    // Ajustar imediatamente (primeira renderização)
    // A função adjustDimensions verifica internamente se o container tem dimensões
    // Se não tiver, retorna sem fazer nada e tentamos novamente após o DOM ser atualizado
    console.log('[FitWidth] setupDynamicResize: Iniciando, containerDiv tem dimensões?', {
        containerDivClientWidth: containerDiv.clientWidth,
        containerDivOffsetWidth: containerDiv.offsetWidth,
        fitWidth,
        fitHeight,
    });
    
    adjustDimensions();
    
    // Se fitWidth está ativo, garantir que ajustamos novamente quando o DOM estiver completamente estável
    // Isso é importante porque na primeira renderização o container pode ainda não ter dimensões finais
    if (fitWidth) {
        // Usar requestAnimationFrame para garantir que o DOM foi atualizado antes de tentar novamente
        requestAnimationFrame(() => {
            console.log('[FitWidth] setupDynamicResize: requestAnimationFrame callback, containerDiv tem dimensões?', {
                containerDivClientWidth: containerDiv.clientWidth,
                containerDivOffsetWidth: containerDiv.offsetWidth,
            });
            adjustDimensions();
            
            // Se ainda não tem dimensões após requestAnimationFrame, tentar mais uma vez após um pequeno delay
            if (containerDiv.clientWidth === 0) {
                setTimeout(() => {
                    console.log('[FitWidth] setupDynamicResize: setTimeout callback, containerDiv tem dimensões?', {
                        containerDivClientWidth: containerDiv.clientWidth,
                        containerDivOffsetWidth: containerDiv.offsetWidth,
                    });
                    adjustDimensions();
                }, 50);
            }
        });
    }
    
    // Também observar mudanças no container para ajustes futuros
    const resizeObserver = new ResizeObserver(() => {
        adjustDimensions();
    });
    resizeObserver.observe(containerDiv);
    chartElement.__resizeObserver = resizeObserver;
}

