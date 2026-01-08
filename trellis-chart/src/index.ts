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
        const containerWidth = chartElement.clientWidth || 800;
        const containerHeight = chartElement.clientHeight || 600;
        const dataSize = PerformanceMonitor.calculateDataSize(chartModel);
        
        performanceMonitor.startRender(
            sessionId,
            dataSize,
            measureCols.length,
            hasSecondaryDimension ? secondaryDimensions.length + 1 : 1,
            containerWidth,
            containerHeight
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

    // Obter dimensões do container para uso no cálculo inicial (especialmente importante para fitWidth)
    let containerWidth = chartElement.clientWidth || chartElement.offsetWidth || 0;
    let containerHeight = chartElement.clientHeight || chartElement.offsetHeight || 0;
    
    // Se não temos dimensões, tentar obter do elemento pai
    if (containerWidth === 0 && chartElement.parentElement) {
        containerWidth = chartElement.parentElement.clientWidth || 
                         chartElement.parentElement.offsetWidth || 
                         chartElement.parentElement.getBoundingClientRect().width || 0;
    }
    if (containerHeight === 0 && chartElement.parentElement) {
        containerHeight = chartElement.parentElement.clientHeight || 
                         chartElement.parentElement.offsetHeight || 
                         chartElement.parentElement.getBoundingClientRect().height || 0;
    }
    
    // Calcular dimensões do gráfico
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

    // Calcular ranges (min/max) para cada medida (considerando minY/maxY das configurações)
    const measureRanges = calculateMeasureRanges(chartData, measureCols, measureConfigs);

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
