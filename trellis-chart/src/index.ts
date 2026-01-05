/**
 * Custom Chart: Chart SDK - Multi-Measures
 * 
 * Usando apenas Chart SDK, sem bibliotecas externas (Muze, Highcharts, etc.)
 * Renderização simples com HTML/CSS
 */

import { CustomChartContext } from '@thoughtspot/ts-chart-sdk';
import { logger } from './utils/logger';
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

    // Setup de opções e configurações
    const { visualProps } = chartModel;
    const allVisualProps = visualProps as Record<string, unknown>;
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
        tooltipEnabled,
        tooltipFormat,
        tooltipShowAllMeasures,
        tooltipBackgroundColor,
    } = options;

    // Calcular dimensões do gráfico
    const chartDimensions = calculateChartDimensions(
        chartOptions,
        chartData,
        measureCols,
        hasSecondaryDimension,
        allVisualProps
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

    // Configurar tooltips se habilitado
    if (tooltipEnabled) {
        setupTooltips(
            chartElement,
            {
                enabled: tooltipEnabled,
                format: tooltipFormat,
                showAllMeasures: tooltipShowAllMeasures,
                backgroundColor: tooltipBackgroundColor,
            },
            {
                chartData,
                measureCols,
                measureConfigs,
                primaryDateFormat,
                secondaryDateFormat,
            }
        );
    }

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
    });

    emitRenderComplete(ctx);
    return Promise.resolve();
};

// Inicialização
initializeChartSDK(renderChart).catch((error) => {
    logger.error('Erro na inicialização:', error);
});

// Tornar renderChart disponível globalmente para handlers
if (typeof window !== 'undefined') {
    (window as any).__renderChart = renderChart;
}
