/**
 * Custom Chart: Boxplot Chart SDK
 * 
 * Boxplot para visualização de distribuições estatísticas
 */

import { CustomChartContext } from '@thoughtspot/ts-chart-sdk';
import { logger } from '@shared/utils/logger';
import { analytics } from '@shared/utils/analytics';
import { PerformanceMonitor } from '@shared/utils/performanceMonitor';
import { initializeChartSDK } from '@shared/config/init';
import { getDefaultChartConfig, getQueriesFromChartConfig } from './config/chartConfig';
import { createVisualPropEditorDefinition, createChartConfigEditorDefinition } from './config/visualPropEditor';
import { calculateBoxplotData } from './utils/boxplotCalculations';
import { calculateBoxplotDimensions } from './utils/boxplotDimensions';
import { readBoxplotOptions } from './utils/boxplotOptions';
import { renderBoxplot, renderYAxis } from './rendering/boxplotRenderer';
import { createChartHtmlStructure } from '@shared/utils/htmlStructure';
import { ChartToTSEvent, ColumnType } from '@thoughtspot/ts-chart-sdk';

export const renderChart = async (ctx: CustomChartContext) => {
    const performanceMonitor = new PerformanceMonitor();
    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    try {
        const chartModel = ctx.getChartModel();
        const chartElement = document.getElementById('chart') as HTMLElement | null;
        
        if (!chartElement) {
            logger.error('Elemento chart não encontrado');
            return;
        }

        // Validar dados
        const data = chartModel.data?.[0]?.data;
        if (!data || !data.dataValue || data.dataValue.length === 0) {
            chartElement.innerHTML = '<div style="padding: 20px; color: #ef4444;">Nenhum dado disponível para o Boxplot</div>';
            ctx.emitEvent(ChartToTSEvent.RenderComplete);
            return;
        }

        // Obter colunas
        const measureColumns = chartModel.columns.filter(col => col.type === ColumnType.MEASURE);
        const dimensionColumns = chartModel.columns.filter(col => col.type === ColumnType.ATTRIBUTE);

        if (measureColumns.length === 0 || dimensionColumns.length === 0) {
            chartElement.innerHTML = '<div style="padding: 20px; color: #ef4444;">Boxplot requer pelo menos 1 medida e 1 dimensão</div>';
            ctx.emitEvent(ChartToTSEvent.RenderComplete);
            return;
        }

        // Usar primeira medida
        const measureColumn = measureColumns[0];
        
        // Calcular dimensões do container
        const containerWidth = chartElement.clientWidth || 800;
        const containerHeight = chartElement.clientHeight || 600;
        const dataSize = PerformanceMonitor.calculateDataSize(chartModel);
        
        // Iniciar monitoramento de performance
        performanceMonitor.startRender(
            sessionId,
            dataSize,
            measureColumns.length,
            dimensionColumns.length,
            containerWidth,
            containerHeight
        );

        // Rastrear uso
        analytics.trackUsage('boxplot', {
            numMeasures: measureColumns.length,
            numDimensions: dimensionColumns.length,
        });

        // Calcular dados do boxplot
        const boxplotData = calculateBoxplotData(chartModel, measureColumn, dimensionColumns);
        if (!boxplotData || boxplotData.groups.length === 0) {
            chartElement.innerHTML = '<div style="padding: 20px; color: #ef4444;">Não foi possível calcular os dados do Boxplot</div>';
            ctx.emitEvent(ChartToTSEvent.RenderComplete);
            return;
        }

        // Ler opções
        const allVisualProps = chartModel.visualProps as Record<string, unknown>;
        const options = readBoxplotOptions(allVisualProps, measureColumn);

        const dimensions = calculateBoxplotDimensions(containerWidth, containerHeight, {
            showYAxis: options.showYAxis,
            labelFontSize: options.labelFontSize,
            valueLabelFontSize: options.valueLabelFontSize,
            numGroups: boxplotData.groups.length,
            boxWidth: options.boxWidth,
        });

        // Renderizar boxplot
        const boxplotHtml = renderBoxplot(boxplotData, dimensions, options);
        const yAxisHtml = renderYAxis(
            boxplotData.globalStats.whiskerLower,
            boxplotData.globalStats.whiskerUpper,
            dimensions,
            options
        );

        // Criar estrutura HTML completa
        const html = createChartHtmlStructure(
            false, // fitWidth
            false, // fitHeight
            dimensions.chartWidth,
            dimensions.chartHeight,
            '', // secondaryXAxisHtml
            '', // secondaryXAxisLabelsHtml
            yAxisHtml,
            '', // dividerLinesBetweenMeasuresHtml
            '', // dividerLinesBetweenBarsHtml
            '', // referenceLinesHtml
            boxplotHtml,
            '', // xAxis
            '', // xAxisLabels
            options.backgroundColor
        );

        chartElement.innerHTML = html;
        
        // Finalizar monitoramento e rastrear performance
        const perfEvent = performanceMonitor.endRender(sessionId);
        if (perfEvent) {
            perfEvent.chartType = 'boxplot';
            analytics.trackPerformance(perfEvent);
        }
        
        ctx.emitEvent(ChartToTSEvent.RenderComplete);
    } catch (error) {
        // Rastrear erros
        analytics.trackError('boxplot', error instanceof Error ? error : String(error), {
            sessionId,
        });
        logger.error('Erro ao renderizar Boxplot:', error);
        const chartElement = document.getElementById('chart') as HTMLElement | null;
        if (chartElement) {
            chartElement.innerHTML = `<div style="padding: 20px; color: #ef4444;">Erro ao renderizar Boxplot: ${error}</div>`;
        }
        ctx.emitEvent(ChartToTSEvent.RenderComplete);
    }
};

// Inicializar Chart SDK
initializeChartSDK(
    renderChart,
    {
        getDefaultChartConfig,
        getQueriesFromChartConfig,
    },
    {
        visualPropEditorDefinition: createVisualPropEditorDefinition,
        chartConfigEditorDefinition: createChartConfigEditorDefinition,
    }
).catch((error) => {
    logger.error('Erro na inicialização do Chart SDK:', error);
});

