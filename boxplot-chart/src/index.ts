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
import { ChartToTSEvent, ColumnType, ChartColumn } from '@thoughtspot/ts-chart-sdk';

function setupInteractionTracking(chartElement: HTMLElement, userId?: string): void {
    // Rastrear hover em caixas do boxplot
    const boxes = chartElement.querySelectorAll('rect[class*="box"], path[class*="box"]');
    boxes.forEach((box, index) => {
        box.addEventListener('mouseenter', () => {
            analytics.trackInteraction('boxplot', 'hover', `box-${index}`, {
                elementType: 'box',
            });
        });
        
        box.addEventListener('click', () => {
            analytics.trackInteraction('boxplot', 'click', `box-${index}`, {
                elementType: 'box',
            });
        });
    });
    
    // Rastrear hover em outliers
    const outliers = chartElement.querySelectorAll('circle[class*="outlier"], path[class*="outlier"]');
    outliers.forEach((outlier, index) => {
        outlier.addEventListener('mouseenter', () => {
            analytics.trackInteraction('boxplot', 'hover', `outlier-${index}`, {
                elementType: 'outlier',
            });
        });
    });
    
    // Rastrear hover em pontos de jitter
    const jitterPoints = chartElement.querySelectorAll('circle[class*="jitter-point"]');
    jitterPoints.forEach((point, index) => {
        point.addEventListener('mouseenter', () => {
            analytics.trackInteraction('boxplot', 'hover', `jitter-point-${index}`, {
                elementType: 'jitter-point',
            });
        });
    });
    
    // Rastrear hover em pontos de dot plot (amostra insuficiente)
    const dotPlotPoints = chartElement.querySelectorAll('circle[class*="dot-plot-point"]');
    dotPlotPoints.forEach((point, index) => {
        point.addEventListener('mouseenter', () => {
            analytics.trackInteraction('boxplot', 'hover', `dot-plot-point-${index}`, {
                elementType: 'dot-plot-point',
            });
        });
    });
    
    // Rastrear tooltips
    const elementsWithTooltips = chartElement.querySelectorAll('title');
    elementsWithTooltips.forEach((title, index) => {
        const parent = title.parentElement;
        if (parent) {
            parent.addEventListener('mouseenter', () => {
                analytics.trackInteraction('boxplot', 'tooltip_open', `tooltip-${index}`, {
                    elementType: 'tooltip',
                });
            });
        }
    });
    
    // Rastrear hover em linhas de referência
    const referenceLines = chartElement.querySelectorAll('line[class*="reference-line"], .reference-line');
    referenceLines.forEach((line, index) => {
        line.addEventListener('mouseenter', () => {
            analytics.trackInteraction('boxplot', 'hover', `reference-line-${index}`, {
                elementType: 'reference-line',
            });
        });
    });
    
    // Rastrear hover em linhas de mediana
    const medianLines = chartElement.querySelectorAll('line[class*="median"]');
    medianLines.forEach((line, index) => {
        line.addEventListener('mouseenter', () => {
            analytics.trackInteraction('boxplot', 'hover', `median-line-${index}`, {
                elementType: 'median-line',
            });
        });
    });
    
    // Rastrear hover em whiskers (bigodes)
    const whiskers = chartElement.querySelectorAll('line[class*="whisker"]');
    whiskers.forEach((whisker, index) => {
        whisker.addEventListener('mouseenter', () => {
            analytics.trackInteraction('boxplot', 'hover', `whisker-${index}`, {
                elementType: 'whisker',
            });
        });
    });
    
    // Rastrear hover em labels/eixos
    const labels = chartElement.querySelectorAll('text[class*="label"], text[class*="axis"]');
    labels.forEach((label, index) => {
        label.addEventListener('mouseenter', () => {
            analytics.trackInteraction('boxplot', 'hover', `label-${index}`, {
                elementType: 'label',
            });
        });
    });
}

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
        // O Chart Config Editor já filtra quais colunas são usadas nas queries
        // As colunas em chartModel.columns já são apenas as que o usuário arrastou para as seções
        const measureColumns = chartModel.columns.filter(col => col.type === ColumnType.MEASURE);
        const allDimensionColumns = chartModel.columns.filter(col => col.type === ColumnType.ATTRIBUTE);

        if (measureColumns.length === 0 || allDimensionColumns.length === 0) {
            chartElement.innerHTML = '<div style="padding: 20px; color: #ef4444;">Boxplot requer pelo menos 1 medida e 1 dimensão</div>';
            ctx.emitEvent(ChartToTSEvent.RenderComplete);
            return;
        }

        // Usar primeira medida
        const measureColumn = measureColumns[0];
        
        // Identificar quais dimensões estão na seção 'x' (Categoria/Atributo) vs 'detail' (Granularidade)
        // Tentar múltiplas abordagens para identificar as colunas da seção 'x'
        let dimensionColumnsForGrouping: ChartColumn[] = [];
        
        // Abordagem 1: Verificar se ChartColumn tem propriedade columnSectionName
        const xColumnsBySectionName = allDimensionColumns.filter((col: any) => 
            col.columnSectionName === 'x' || col.sectionName === 'x' || col.section === 'x'
        );
        
        if (xColumnsBySectionName.length > 0) {
            dimensionColumnsForGrouping = xColumnsBySectionName;
        } else {
            // Abordagem 2: Tentar acessar chartConfig através do contexto
            try {
                const ctxAny = ctx as any;
                const chartConfig = ctxAny.getChartConfig?.() || ctxAny.chartConfig || (chartModel as any).chartConfig;
                
                if (chartConfig && Array.isArray(chartConfig) && chartConfig.length > 0) {
                    const firstConfig = chartConfig[0];
                    if (firstConfig && firstConfig.dimensions && Array.isArray(firstConfig.dimensions)) {
                        const xDimension = firstConfig.dimensions.find((dim: any) => dim.key === 'x');
                        if (xDimension && xDimension.columns && Array.isArray(xDimension.columns)) {
                            // Filtrar apenas as colunas que estão na seção 'x'
                            const xColumnIds = new Set(xDimension.columns.map((col: any) => col.id || col.name || col.columnId));
                            dimensionColumnsForGrouping = allDimensionColumns.filter(col => 
                                xColumnIds.has(col.id) || xColumnIds.has((col as any).name) || xColumnIds.has((col as any).columnId)
                            );
                        }
                    }
                }
            } catch (e) {
                // Ignora erros
            }
        }
        
        // Abordagem 3: Usar a ordem das colunas nos dados retornados para identificar qual está na seção 'x'
        // As colunas na seção 'x' geralmente aparecem primeiro nos dados
        if (dimensionColumnsForGrouping.length === 0) {
            try {
                const data = chartModel.data?.[0]?.data;
                if (data && data.columns && data.columns.length > 0) {
                    // Encontrar o índice da primeira dimensão nos dados
                    const firstDimensionColumnId = data.columns.find((colId: string) => 
                        allDimensionColumns.some(dim => dim.id === colId)
                    );
                    
                    if (firstDimensionColumnId) {
                        const firstDimension = allDimensionColumns.find(dim => dim.id === firstDimensionColumnId);
                        if (firstDimension) {
                            dimensionColumnsForGrouping = [firstDimension];
                        }
                    }
                }
            } catch (e) {
                // Ignora erros
            }
        }
        
        // Fallback final: usar todas as dimensões (comportamento antigo)
        if (dimensionColumnsForGrouping.length === 0) {
            dimensionColumnsForGrouping = allDimensionColumns;
        }
        
        // Log para debug (remover em produção se necessário)
        logger.debug('Dimensões para agrupamento identificadas:', dimensionColumnsForGrouping.map(d => d.name || d.id).join(', '));
        
        // Calcular dimensões do container
        const containerWidth = chartElement.clientWidth || 800;
        const containerHeight = chartElement.clientHeight || 600;
        const dataSize = PerformanceMonitor.calculateDataSize(chartModel);
        
        // Iniciar monitoramento de performance
        performanceMonitor.startRender(
            sessionId,
            dataSize,
            measureColumns.length,
            dimensionColumnsForGrouping.length,
            containerWidth,
            containerHeight
        );

        // Tentar obter userId do contexto (se disponível)
        // ThoughtSpot SDK pode não expor diretamente, mas tentamos diferentes formas
        let userId: string | undefined;
        try {
            // Tentar acessar propriedades do contexto (se disponíveis)
            const ctxAny = ctx as any;
            userId = ctxAny.userId || ctxAny.user?.id || ctxAny.user?.username || ctxAny.userInfo?.userId;
            
            // Se não encontrado no contexto, pode estar no chartModel
            if (!userId) {
                const chartModelAny = chartModel as any;
                userId = chartModelAny.userId || chartModelAny.user?.id || chartModelAny.user?.username;
            }
        } catch (e) {
            // Ignora erros ao tentar acessar propriedades que podem não existir
        }

        // Ler opções primeiro (necessárias para cálculos)
        const allVisualProps = chartModel.visualProps as Record<string, unknown>;
        const options = readBoxplotOptions(allVisualProps, measureColumn);
        
        // Debug: verificar yScale (usar console.log para garantir que apareça)
        console.log('[BOXPLOT DEBUG] yScale lido:', options.yScale, 'axes.yScale:', (allVisualProps.axes as any)?.yScale, 'chartOptions.yScale:', (allVisualProps.chart_options as any)?.yScale);

        // Rastrear uso com configurações utilizadas
        analytics.trackUsage('boxplot', {
            numMeasures: measureColumns.length,
            numDimensions: dimensionColumnsForGrouping.length,
            // Configurações principais
            orientation: options.orientation,
            yScale: options.yScale,
            showNotch: options.showNotch,
            sortType: options.sortType,
            showJitter: options.showJitter,
            variableWidth: options.variableWidth,
            showMean: options.showMean,
            showOutliers: options.showOutliers,
            calculationMethod: options.calculationMethod,
            whiskerType: options.whiskerType,
            // Configurações de referência
            referenceLines: {
                show: options.referenceLines.show,
                type: options.referenceLines.type,
            },
            // Configurações de grade
            gridLines: {
                show: options.gridLines.show,
            },
            // Configurações de tooltip
            tooltip: {
                enabled: options.tooltip.enabled,
                format: options.tooltip.format,
            },
        }, userId);

        // Calcular dados do boxplot com as opções configuradas
        // Usar apenas as dimensões da seção 'x' (Categoria/Atributo) para agrupamento
        const boxplotData = calculateBoxplotData(chartModel, measureColumn, dimensionColumnsForGrouping, options);
        if (!boxplotData || boxplotData.groups.length === 0) {
            chartElement.innerHTML = '<div style="padding: 20px; color: #ef4444;">Não foi possível calcular os dados do Boxplot</div>';
            ctx.emitEvent(ChartToTSEvent.RenderComplete);
            return;
        }

        const dimensions = calculateBoxplotDimensions(containerWidth, containerHeight, {
            showYAxis: options.showYAxis,
            labelFontSize: options.labelFontSize,
            valueLabelFontSize: options.valueLabelFontSize,
            numGroups: boxplotData.groups.length,
            boxWidth: options.boxWidth,
            groupSpacing: options.layout.groupSpacing || options.padding,
            layout: options.layout,
            fitWidth: options.fitWidth, // Passar fitWidth para cálculo de dimensões
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
        // fitWidth: controlado pela opção do usuário
        // fitHeight: sempre true (altura sempre 100%)
        const html = createChartHtmlStructure(
            options.fitWidth, // fitWidth (controlado pelo usuário)
            true, // fitHeight (sempre 100%)
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
        
        // Adicionar event listeners para rastrear interações do usuário
        setupInteractionTracking(chartElement, userId);
        
        // Finalizar monitoramento e rastrear performance
        const perfEvent = performanceMonitor.endRender(sessionId);
        if (perfEvent) {
            perfEvent.chartType = 'boxplot';
            // Passar userId para evento de performance (herda de BaseAnalyticsEvent)
            if (userId) {
                perfEvent.userId = userId;
            }
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

