/**
 * Custom Chart: Chart SDK - Multi-Measures
 * 
 * Usando apenas Chart SDK, sem bibliotecas externas (Muze, Highcharts, etc.)
 * Renderização simples com HTML/CSS
 */

import { CustomChartContext } from '@thoughtspot/ts-chart-sdk';
import { logger } from '@shared/utils/logger';
import { analytics } from '@shared/utils/analytics';
import { PerformanceMonitor } from '@shared/utils/performanceMonitor';
import { calculateChartDimensions } from './utils/chartDimensions';
import { calculateMeasureRanges } from './utils/measureRanges';
import { setupChartData } from './utils/dataSetup';
import { setupChartOptions } from './utils/chartOptions';
import { setupDynamicResize } from './handlers/dynamicResize';
import { renderCompleteChart } from './rendering/chartRenderer';
import { setupTooltips } from './rendering/tooltip';
import { initializeChartSDK, emitRenderComplete } from './config/init';

export const renderChart = async (ctx: CustomChartContext) => {
    const chartModel = ctx.getChartModel();
    const performanceMonitor = new PerformanceMonitor();
    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    try {
        // Setup e validação de dados
        const dataSetup = await setupChartData(ctx, chartModel);
        if (!dataSetup) {
            return Promise.resolve(); // Erro já foi tratado
        }

        const {
            chartElement,
            measureCols,
            primaryDimension,
            secondaryDimensions,
            hasSecondaryDimension,
            chartData,
        } = dataSetup;

        // Iniciar monitoramento de performance
        // Obter dimensões do container para uso no cálculo inicial
        // IMPORTANTE: Usar clientWidth (largura real do conteúdo) em vez de offsetWidth (que inclui padding)
        // O SVG renderizado ocupa apenas o clientWidth, então o conteúdo deve ser redesenhado para essa largura
        let containerWidth = chartElement.clientWidth || chartElement.offsetWidth || 0;
        let containerHeight = chartElement.clientHeight || chartElement.offsetHeight || 0;
        
        // Se não temos dimensões, tentar obter do elemento pai
        // Também usar clientWidth primeiro (largura real do conteúdo)
        if (containerWidth === 0 && chartElement.parentElement) {
            containerWidth = chartElement.parentElement.clientWidth || 
                             chartElement.parentElement.getBoundingClientRect().width ||
                             chartElement.parentElement.offsetWidth || 0;
        }
        if (containerHeight === 0 && chartElement.parentElement) {
            containerHeight = chartElement.parentElement.clientHeight || 
                             chartElement.parentElement.getBoundingClientRect().height ||
                             chartElement.parentElement.offsetHeight || 0;
        }
        
            // Usar valores padrão se ainda não temos dimensões
            const initialContainerWidth = containerWidth || 800;
            const initialContainerHeight = containerHeight || 600;
            
            // Log inicial de dimensões do container
            console.log('[FitWidth] Dimensões iniciais do container:', {
                chartElementClientWidth: chartElement.clientWidth,
                chartElementOffsetWidth: chartElement.offsetWidth,
                chartElementBoundingRect: chartElement.getBoundingClientRect().width,
                containerWidth,
                containerHeight,
                initialContainerWidth,
                initialContainerHeight,
                parentElement: chartElement.parentElement?.tagName,
                parentClientWidth: chartElement.parentElement?.clientWidth,
                parentOffsetWidth: chartElement.parentElement?.offsetWidth,
            });
            
            const dataSize = PerformanceMonitor.calculateDataSize(chartModel);
        
        performanceMonitor.startRender(
            sessionId,
            dataSize,
            measureCols.length,
            hasSecondaryDimension ? secondaryDimensions.length + 1 : 1,
            initialContainerWidth,
            initialContainerHeight
        );

        // Rastrear uso e configurações
        const { visualProps } = chartModel;
        const allVisualProps = visualProps as Record<string, unknown>;
        analytics.trackUsage('trellis', {
            numMeasures: measureCols.length,
            hasSecondaryDimension,
            numSecondaryDimensions: hasSecondaryDimension ? secondaryDimensions.length : 0,
        });

        // Setup de opções e configurações
        const options = setupChartOptions(
            allVisualProps,
            primaryDimension,
            secondaryDimensions,
            measureCols
        );

    const {
        fitWidth,
        fitHeight,
        showYAxis,
        measureNameRotation,
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
        primaryDateFormat,
        secondaryDateFormat,
        measureConfigs,
        chartOptions,
        yAxisColor,
        xAxisColor,
        axisStrokeWidth,
        backgroundColor,
        tooltipEnabled,
        tooltipFormat,
        tooltipShowAllMeasures,
        tooltipBackgroundColor,
        tooltipCustomTemplate,
    } = options;

    // Quando fitWidth está ativo, ajustar containerWidth para estimar a largura real do containerDiv
    // O containerDiv geralmente tem clientWidth = chartElement.clientWidth - padding/border do chartElement
    // Se houver diferença, o dynamicResize vai re-renderizar com as dimensões corretas
    if (fitWidth && containerWidth > 0) {
        const chartElementComputedStyle = window.getComputedStyle(chartElement);
        const chartElementPaddingLeft = parseFloat(chartElementComputedStyle.paddingLeft) || 0;
        const chartElementPaddingRight = parseFloat(chartElementComputedStyle.paddingRight) || 0;
        const chartElementBorderLeft = parseFloat(chartElementComputedStyle.borderLeftWidth) || 0;
        const chartElementBorderRight = parseFloat(chartElementComputedStyle.borderRightWidth) || 0;
        const totalPaddingBorder = chartElementPaddingLeft + chartElementPaddingRight + 
                                 chartElementBorderLeft + chartElementBorderRight;
        
        // Se há padding/border no chartElement, o containerDiv terá largura menor
        if (totalPaddingBorder > 0) {
            containerWidth = Math.max(0, containerWidth - totalPaddingBorder);
            
            console.log('[FitWidth] Estimando largura do containerDiv para renderização inicial:', {
                chartElementClientWidth: chartElement.clientWidth,
                chartElementOffsetWidth: chartElement.offsetWidth,
                totalPaddingBorder,
                estimatedContainerWidth: containerWidth,
            });
        }
    }

    // Calcular dimensões do gráfico
    // (containerWidth e containerHeight já foram obtidos acima)
    const chartDimensions = calculateChartDimensions(
        chartOptions,
        chartData,
        measureCols,
        hasSecondaryDimension,
        allVisualProps,
        containerWidth > 0 || containerHeight > 0 ? { width: containerWidth, height: containerHeight } : undefined
    );

    const {
        leftMargin,
        topMargin,
        bottomMargin,
        rightMargin,
        spacingBetweenMeasures,
        chartWidth,
        chartHeight,
        measureRowHeight,
        plotAreaWidth,
        barWidth,
        barSpacing,
        measureLabelSpace,
    } = chartDimensions;
    
    // Log das dimensões calculadas
    console.log('[FitWidth] Dimensões calculadas do gráfico:', {
        fitWidth,
        fitHeight,
        containerWidth,
        containerHeight,
        chartWidth,
        chartHeight,
        plotAreaWidth,
        barWidth,
        barSpacing,
    });

    // Calcular ranges (min/max) para cada medida (considerando minY/maxY das configurações)
    const measureRanges = calculateMeasureRanges(chartData, measureCols, measureConfigs);

    // Garantir que o chartElement ocupe 100% da largura quando fitWidth está ativo
    if (fitWidth) {
        chartElement.style.width = '100%';
        chartElement.style.minWidth = '100%';
        chartElement.style.maxWidth = '100%';
        chartElement.style.boxSizing = 'border-box';
        chartElement.style.margin = '0';
        chartElement.style.padding = '0';
        
        console.log('[FitWidth] Aplicando estilos ao chartElement:', {
            width: chartElement.style.width,
            minWidth: chartElement.style.minWidth,
            maxWidth: chartElement.style.maxWidth,
            boxSizing: chartElement.style.boxSizing,
            computedWidth: window.getComputedStyle(chartElement).width,
            actualWidth: chartElement.offsetWidth,
            clientWidth: chartElement.clientWidth,
            parentWidth: chartElement.parentElement?.offsetWidth,
        });
    }

    // Renderizar gráfico completo
    chartElement.innerHTML = renderCompleteChart({
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
        bottomMargin,
        rightMargin,
        spacingBetweenMeasures,
        chartWidth,
        chartHeight,
        measureRowHeight,
        plotAreaWidth,
        barWidth,
        barSpacing,
        measureLabelSpace,
    });

    // Garantir que o containerDiv também ocupe 100% da largura quando fitWidth está ativo
    // IMPORTANTE: Quando fitWidth está ativo, aguardar que o DOM seja atualizado e então
    // verificar se há diferença entre as dimensões usadas na renderização inicial e as dimensões reais do containerDiv
    // Se houver diferença, o dynamicResize vai re-renderizar o conteúdo com as dimensões corretas
    if (fitWidth) {
        // Aguardar um pouco para garantir que o DOM foi atualizado
        setTimeout(() => {
            const containerDiv = chartElement.querySelector('div') as HTMLElement;
            if (containerDiv) {
                // Remover qualquer padding/margin que possa estar limitando a largura
                containerDiv.style.width = '100%';
                containerDiv.style.minWidth = '100%';
                containerDiv.style.maxWidth = '100%';
                containerDiv.style.boxSizing = 'border-box';
                containerDiv.style.position = 'relative';
                containerDiv.style.margin = '0';
                containerDiv.style.padding = '0';
                containerDiv.style.border = 'none';
                containerDiv.style.display = 'block';
                containerDiv.style.overflow = 'visible';
                
                // Remover border explicitamente também
                containerDiv.style.borderLeft = 'none';
                containerDiv.style.borderRight = 'none';
                containerDiv.style.borderTop = 'none';
                containerDiv.style.borderBottom = 'none';

                const containerComputedStyle = window.getComputedStyle(containerDiv);
                const actualClientWidth = containerDiv.clientWidth;
                const actualOffsetWidth = containerDiv.offsetWidth;
                
                console.log('[FitWidth] Aplicando estilos ao containerDiv após renderização:', {
                    width: containerDiv.style.width,
                    computedWidth: containerComputedStyle.width,
                    computedPaddingLeft: containerComputedStyle.paddingLeft,
                    computedPaddingRight: containerComputedStyle.paddingRight,
                    computedBorderLeft: containerComputedStyle.borderLeftWidth,
                    computedBorderRight: containerComputedStyle.borderRightWidth,
                    actualWidth: actualOffsetWidth,
                    clientWidth: actualClientWidth,
                    diff: actualOffsetWidth - actualClientWidth,
                    parentWidth: containerDiv.parentElement?.offsetWidth,
                    parentClientWidth: containerDiv.parentElement?.clientWidth,
                    chartWidthUsed: chartWidth,
                    needsRerender: actualClientWidth !== chartWidth && actualClientWidth > 0,
                    info: actualClientWidth !== chartWidth && actualClientWidth > 0 
                        ? `ContainerDiv tem clientWidth=${actualClientWidth}px mas conteúdo foi desenhado para ${chartWidth}px. DynamicResize vai re-renderizar com dimensões corretas.`
                        : 'Dimensões estão corretas.',
                });
            }
        }, 0);
    }

    // Configurar tooltips (configuração global como fallback, individual por medida tem prioridade)
    setupTooltips(
        chartElement,
        tooltipEnabled ? {
            enabled: tooltipEnabled,
            format: tooltipFormat,
            showAllMeasures: tooltipShowAllMeasures,
            backgroundColor: tooltipBackgroundColor,
        } : null,
        {
            chartData,
            measureCols,
            measureConfigs,
            primaryDateFormat,
            secondaryDateFormat,
        }
    );

    // Configurar resize dinâmico se necessário
    setupDynamicResize({
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
    });

        // Finalizar monitoramento e rastrear performance
        const perfEvent = performanceMonitor.endRender(sessionId);
        if (perfEvent) {
            perfEvent.chartType = 'trellis';
            analytics.trackPerformance(perfEvent);
        }

        emitRenderComplete(ctx);
        return Promise.resolve();
    } catch (error) {
        // Rastrear erros
        analytics.trackError('trellis', error instanceof Error ? error : String(error), {
            sessionId,
        });
        logger.error('Erro ao renderizar Trellis Chart:', error);
        throw error;
    }
};

// Inicialização
initializeChartSDK(renderChart).catch((error) => {
    logger.error('Erro na inicialização:', error);
});

// Tornar renderChart disponível globalmente para handlers
if (typeof window !== 'undefined') {
    (window as any).__renderChart = renderChart;
}
