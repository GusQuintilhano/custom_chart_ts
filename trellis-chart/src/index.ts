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
import { extractThoughtSpotContext } from '@shared/utils/thoughtspotContext';
import { calculateChartDimensions } from './utils/chartDimensions';
import { calculateMeasureRanges } from './utils/measureRanges';
import { setupChartData } from './utils/dataSetup';
import { setupChartOptions } from './utils/chartOptions';
import { setupDynamicResize } from './handlers/dynamicResize';
import { renderCompleteChart } from './rendering/chartRenderer';
import { setupTooltips } from './rendering/tooltip';
import { applyPercentageOfTotalToAllMeasures } from './utils/percentageCalculation';
import { initializeChartSDK, emitRenderComplete } from './config/init';

/**
 * Configura rastreamento de interações do usuário no gráfico Trellis
 */
function setupInteractionTracking(
    chartElement: HTMLElement, 
    userId?: string,
    contextInfo?: import('@shared/utils/thoughtspotContext').ThoughtSpotContextInfo
): void {
    // Rastrear hover em barras/séries
    const bars = chartElement.querySelectorAll('rect[class*="bar"], rect[data-series]');
    bars.forEach((bar, index) => {
        bar.addEventListener('mouseenter', () => {
            analytics.trackInteraction('trellis', 'hover', `bar-${index}`, {
                elementType: 'bar',
            }, contextInfo);
        });
        
        bar.addEventListener('click', () => {
            analytics.trackInteraction('trellis', 'click', `bar-${index}`, {
                elementType: 'bar',
            }, contextInfo);
        });
    });
    
    // Rastrear hover em pontos/linhas (se houver)
    const points = chartElement.querySelectorAll('circle[class*="point"], circle[data-series]');
    points.forEach((point, index) => {
        point.addEventListener('mouseenter', () => {
            analytics.trackInteraction('trellis', 'hover', `point-${index}`, {
                elementType: 'point',
            }, contextInfo);
        });
    });
    
    // Rastrear tooltips
    const elementsWithTooltips = chartElement.querySelectorAll('title');
    elementsWithTooltips.forEach((title, index) => {
        const parent = title.parentElement;
        if (parent) {
            parent.addEventListener('mouseenter', () => {
                analytics.trackInteraction('trellis', 'tooltip_open', `tooltip-${index}`, {
                    elementType: 'tooltip',
                }, contextInfo);
            });
        }
    });
    
    // Rastrear hover em linhas de referência
    const referenceLines = chartElement.querySelectorAll('line[class*="reference"], .reference-line');
    referenceLines.forEach((line, index) => {
        line.addEventListener('mouseenter', () => {
            analytics.trackInteraction('trellis', 'hover', `reference-line-${index}`, {
                elementType: 'reference-line',
            }, contextInfo);
        });
    });
    
    // Rastrear hover em labels/eixos
    const labels = chartElement.querySelectorAll('text[class*="label"], text[class*="axis"]');
    labels.forEach((label, index) => {
        label.addEventListener('mouseenter', () => {
            analytics.trackInteraction('trellis', 'hover', `label-${index}`, {
                elementType: 'label',
            }, contextInfo);
        });
    });
}

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
            
            // Log inicial de dimensões do container (apenas em debug)
            logger.debug('[FitWidth] Dimensões iniciais do container:', {
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

        // Extrair informações do contexto ThoughtSpot (ORG, MODEL, USUARIO)
        const contextInfo = extractThoughtSpotContext(ctx, chartModel);
        const userId = contextInfo.userId;

        // Rastrear uso e configurações
        const { visualProps } = chartModel;
        const allVisualProps = visualProps as Record<string, unknown>;
        
        // Setup de opções primeiro para ter acesso às configurações
        const options = setupChartOptions(
            allVisualProps,
            primaryDimension,
            secondaryDimensions,
            measureCols
        );
        
        // Identificar funcionalidades usadas
        const usedFeatures: string[] = [];
        const appliedConfigs: string[] = [];
        
        if (options.showYAxis) appliedConfigs.push('showYAxis');
        if (options.showGridLines) appliedConfigs.push('showGridLines');
        if (options.fitWidth) appliedConfigs.push('fitWidth');
        if (options.fitHeight) appliedConfigs.push('fitHeight');
        if (options.dividerLinesBetweenMeasures) appliedConfigs.push('dividerLinesBetweenMeasures');
        if (options.dividerLinesBetweenGroups) appliedConfigs.push('dividerLinesBetweenGroups');
        if (options.dividerLinesBetweenBars) appliedConfigs.push('dividerLinesBetweenBars');
        if (options.forceLabels) appliedConfigs.push('forceLabels');
        
        // Funcionalidades baseadas em interações disponíveis
        usedFeatures.push('render'); // Sempre presente
        if (hasSecondaryDimension) usedFeatures.push('secondaryDimension');
        
        analytics.trackUsage('trellis', {
            numMeasures: measureCols.length,
            hasSecondaryDimension,
            numSecondaryDimensions: hasSecondaryDimension ? secondaryDimensions.length : 0,
            // Configurações principais do trellis
            showYAxis: options.showYAxis,
            showGridLines: options.showGridLines,
            fitWidth: options.fitWidth,
            fitHeight: options.fitHeight,
            dividerLinesBetweenMeasures: options.dividerLinesBetweenMeasures,
            dividerLinesBetweenGroups: options.dividerLinesBetweenGroups,
            dividerLinesBetweenBars: options.dividerLinesBetweenBars,
            forceLabels: options.forceLabels,
            // Informações sobre funcionalidades usadas
            features: {
                usedFeatures,
                appliedConfigs,
            },
        }, userId, contextInfo);

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

    // Aplicar cálculo de porcentagem do total se configurado
    // Isso deve ser feito ANTES de calcular dimensões e ranges, pois pode alterar os valores
    const processedChartData = applyPercentageOfTotalToAllMeasures(
        chartData,
        measureCols,
        measureConfigs,
        primaryDimension,
        secondaryDimensions
    );

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
            
            logger.debug('[FitWidth] Estimando largura do containerDiv para renderização inicial:', {
                chartElementClientWidth: chartElement.clientWidth,
                chartElementOffsetWidth: chartElement.offsetWidth,
                totalPaddingBorder,
                estimatedContainerWidth: containerWidth,
            });
        }
    }

    // Calcular dimensões do gráfico
    // (containerWidth e containerHeight já foram obtidos acima)
    // Usar processedChartData para cálculos de dimensões
    const chartDimensions = calculateChartDimensions(
        chartOptions,
        processedChartData,
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
    logger.debug('[FitWidth] Dimensões calculadas do gráfico:', {
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
    // Usar processedChartData para cálculo de ranges
    const measureRanges = calculateMeasureRanges(processedChartData, measureCols, measureConfigs);

    // Garantir que o chartElement ocupe 100% da largura quando fitWidth está ativo
    if (fitWidth) {
        chartElement.style.width = '100%';
        chartElement.style.minWidth = '100%';
        chartElement.style.maxWidth = '100%';
        chartElement.style.boxSizing = 'border-box';
        chartElement.style.margin = '0';
        chartElement.style.padding = '0';
        chartElement.style.paddingLeft = '0';
        chartElement.style.paddingRight = '0';
        chartElement.style.paddingTop = '0';
        chartElement.style.paddingBottom = '0';
        chartElement.style.border = 'none';
        chartElement.style.borderLeft = 'none';
        chartElement.style.borderRight = 'none';
        chartElement.style.borderTop = 'none';
        chartElement.style.borderBottom = 'none';
        
        // Verificar se há padding no elemento pai
        if (chartElement.parentElement) {
            const parentComputedStyle = window.getComputedStyle(chartElement.parentElement);
            const parentPaddingLeft = parseFloat(parentComputedStyle.paddingLeft) || 0;
            const parentPaddingRight = parseFloat(parentComputedStyle.paddingRight) || 0;
            
            if (parentPaddingLeft > 0 || parentPaddingRight > 0) {
                // Se há padding no pai, usar calc para compensar
                chartElement.style.width = `calc(100% + ${parentPaddingLeft + parentPaddingRight}px)`;
                chartElement.style.marginLeft = `-${parentPaddingLeft}px`;
                chartElement.style.marginRight = `-${parentPaddingRight}px`;
            }
        }
        
        const computedStyle = window.getComputedStyle(chartElement);
        logger.debug('[FitWidth] Aplicando estilos ao chartElement:', {
            width: chartElement.style.width,
            minWidth: chartElement.style.minWidth,
            maxWidth: chartElement.style.maxWidth,
            boxSizing: chartElement.style.boxSizing,
            computedWidth: computedStyle.width,
            computedPaddingLeft: computedStyle.paddingLeft,
            computedPaddingRight: computedStyle.paddingRight,
            computedBorderLeft: computedStyle.borderLeftWidth,
            computedBorderRight: computedStyle.borderRightWidth,
            actualWidth: chartElement.offsetWidth,
            clientWidth: chartElement.clientWidth,
            parentWidth: chartElement.parentElement?.offsetWidth,
            parentClientWidth: chartElement.parentElement?.clientWidth,
            parentPaddingLeft: chartElement.parentElement ? parseFloat(window.getComputedStyle(chartElement.parentElement).paddingLeft) || 0 : 0,
            parentPaddingRight: chartElement.parentElement ? parseFloat(window.getComputedStyle(chartElement.parentElement).paddingRight) || 0 : 0,
        });
    }

    // Renderizar gráfico completo
    // Usar processedChartData que já tem porcentagens calculadas se necessário
    chartElement.innerHTML = renderCompleteChart({
        chartData: processedChartData,
        measureCols,
        measureRanges,
        measureConfigs,
        hasSecondaryDimension,
        primaryDimension,
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

    // O setupDynamicResize já aplica os estilos necessários ao containerDiv
    // Não precisamos aplicar estilos aqui, pois isso seria feito após o DOM ser atualizado
    // e pode causar atrasos desnecessários na renderização inicial

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
        chartData: processedChartData,
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
        primaryDimension,
        secondaryDimensions,
        measureLabelSpace,
        yAxisColor,
        xAxisColor,
        axisStrokeWidth,
        backgroundColor,
    });
    
    // Adicionar event listeners para rastrear interações do usuário
        setupInteractionTracking(chartElement, userId, contextInfo);

    // Finalizar monitoramento e rastrear performance
        const perfEvent = performanceMonitor.endRender(sessionId);
        if (perfEvent) {
            perfEvent.chartType = 'trellis';
            analytics.trackPerformance(perfEvent, contextInfo);
        }

        emitRenderComplete(ctx);
        return Promise.resolve();
    } catch (error) {
        // Extrair contexto para logs de erro (pode não ter sido extraído antes)
        const errorContextInfo = extractThoughtSpotContext(ctx, chartModel);
        // Rastrear erros
        analytics.trackError('trellis', error instanceof Error ? error : String(error), {
            sessionId,
        }, errorContextInfo);
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
    window.__renderChart = renderChart;
}
