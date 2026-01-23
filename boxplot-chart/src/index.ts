/**
 * Custom Chart: Boxplot Chart SDK
 * 
 * Boxplot para visualização de distribuições estatísticas
 */

import { CustomChartContext } from '@thoughtspot/ts-chart-sdk';
import { logger } from '@shared/utils/logger';
import { analytics } from '@shared/utils/analytics';
import { PerformanceMonitor } from '@shared/utils/performanceMonitor';
import { extractThoughtSpotContext } from '@shared/utils/thoughtspotContext';
import { initializeChartSDK } from '@shared/config/init';
import { getDefaultChartConfig, getQueriesFromChartConfig } from './config/chartConfig';
import { createVisualPropEditorDefinition, createChartConfigEditorDefinition } from './config/visualPropEditor';
import { calculateBoxplotData } from './utils/boxplotCalculations';
import { calculateBoxplotDimensions } from './utils/boxplotDimensions';
import { readBoxplotOptions } from './utils/boxplotOptions';
import { renderBoxplot, renderYAxis } from './rendering/boxplotRenderer';
import { createChartHtmlStructure } from '@shared/utils/htmlStructure';
import { ChartToTSEvent, ColumnType, ChartColumn, type ChartConfig } from '@thoughtspot/ts-chart-sdk';
import { setupCustomTooltips } from './utils/customTooltip';

/**
 * Interface para ChartColumn com propriedades de seção (podem não existir)
 */
interface ChartColumnWithSection extends ChartColumn {
    columnSectionName?: string;
    sectionName?: string;
    section?: string;
    name?: string;
    columnId?: string;
}

/**
 * Interface para ChartConfig dimension (podem não existir)
 */
interface ChartConfigDimension {
    key?: string;
    columns?: Array<{ id?: string; name?: string; columnId?: string }>;
}

/**
 * Interface para CustomChartContext com métodos opcionais (podem não existir)
 */
interface CustomChartContextWithConfig extends CustomChartContext {
    getChartConfig?: () => ChartConfig[] | undefined;
    chartConfig?: ChartConfig[] | undefined;
}

/**
 * Type guard para verificar se ChartColumn tem propriedades de seção
 */
function hasSection(col: ChartColumn, section: string): boolean {
    const colAny = col as ChartColumnWithSection;
    return colAny.columnSectionName === section || 
           colAny.sectionName === section || 
           colAny.section === section;
}

/**
 * Função auxiliar para extrair ID de uma coluna
 */
function getColumnId(col: ChartColumn): string | undefined {
    const colAny = col as ChartColumnWithSection;
    return col.id || colAny.name || colAny.columnId;
}

function setupInteractionTracking(
    chartElement: HTMLElement, 
    userId?: string,
    contextInfo?: import('@shared/utils/thoughtspotContext').ThoughtSpotContextInfo
): void {
    // Rastrear hover em grupos do boxplot
    const groups = chartElement.querySelectorAll('g[data-group-index]');
    groups.forEach((group) => {
        const groupIndex = group.getAttribute('data-group-index');
        
        // Rastrear hover no grupo inteiro
        group.addEventListener('mouseenter', () => {
            analytics.trackInteraction('boxplot', 'hover', `group-${groupIndex}`, {
                elementType: 'group',
                groupIndex: groupIndex,
            }, contextInfo);
        });
        
        // Rastrear elementos dentro do grupo (box, whiskers, median, mean)
        const boxElements = group.querySelectorAll('rect, path, line');
        boxElements.forEach((element, elemIndex) => {
            // Pular outliers e jitter (têm tracking próprio)
            if (element.closest('[data-outlier]') || element.hasAttribute('data-jitter')) {
                return;
            }
            
            element.addEventListener('mouseenter', () => {
                analytics.trackInteraction('boxplot', 'hover', `box-element-${groupIndex}-${elemIndex}`, {
                    elementType: 'box-element',
                    groupIndex: groupIndex,
                }, contextInfo);
            });
            
            // Rastrear cliques em elementos do boxplot
            element.addEventListener('click', () => {
                analytics.trackInteraction('boxplot', 'click', `box-element-${groupIndex}-${elemIndex}`, {
                    elementType: 'box-element',
                    groupIndex: groupIndex,
                }, contextInfo);
            });
        });
    });
    
    // Rastrear outliers usando data attributes
    const outliers = chartElement.querySelectorAll('[data-outlier="true"]');
    outliers.forEach((outlier, index) => {
        const groupIndex = outlier.getAttribute('data-group-index');
        const outlierValue = outlier.getAttribute('data-outlier-value');
        
        outlier.addEventListener('mouseenter', () => {
            analytics.trackInteraction('boxplot', 'hover', `outlier-${groupIndex}-${index}`, {
                elementType: 'outlier',
                groupIndex: groupIndex,
                outlierValue: outlierValue,
            }, contextInfo);
        });
    });
    
    // Rastrear pontos de jitter usando data attributes
    const jitterPoints = chartElement.querySelectorAll('[data-jitter="true"]');
    jitterPoints.forEach((point, index) => {
        const groupIndex = point.getAttribute('data-group-index');
        const pointValue = point.getAttribute('data-point-value');
        
        point.addEventListener('mouseenter', () => {
            analytics.trackInteraction('boxplot', 'hover', `jitter-${groupIndex}-${index}`, {
                elementType: 'jitter',
                groupIndex: groupIndex,
                pointValue: pointValue,
            }, contextInfo);
        });
    });
    
    // Rastrear pontos de dot plot (amostra insuficiente) - usar classe
    const dotPlotGroups = chartElement.querySelectorAll('g.dot-plot');
    dotPlotGroups.forEach((dotPlotGroup, index) => {
        const groupIndex = dotPlotGroup.getAttribute('data-group-index');
        
        dotPlotGroup.addEventListener('mouseenter', () => {
            analytics.trackInteraction('boxplot', 'hover', `dot-plot-${groupIndex || index}`, {
                elementType: 'dot-plot',
                groupIndex: groupIndex || String(index),
            }, contextInfo);
        });
    });
    
    // Rastrear linhas de referência usando classe
    const referenceLines = chartElement.querySelectorAll('.reference-lines line');
    referenceLines.forEach((line, index) => {
        line.addEventListener('mouseenter', () => {
            analytics.trackInteraction('boxplot', 'hover', `reference-line-${index}`, {
                elementType: 'reference-line',
            }, contextInfo);
        });
    });
    
    // Rastrear linhas de mediana - dentro dos grupos
    groups.forEach((group) => {
        const groupIndex = group.getAttribute('data-group-index');
        // Mediana geralmente é uma linha dentro do grupo
        const medianLines = group.querySelectorAll('line');
        medianLines.forEach((line, lineIndex) => {
            // Verificar se é linha de mediana (geralmente é uma linha horizontal/vertical no meio)
            // Pular se for whisker ou outra linha
            if (line.closest('[data-outlier]')) {
                return;
            }
            
            line.addEventListener('mouseenter', () => {
                analytics.trackInteraction('boxplot', 'hover', `median-line-${groupIndex}-${lineIndex}`, {
                    elementType: 'median-line',
                    groupIndex: groupIndex,
                }, contextInfo);
            });
        });
    });
    
    // Rastrear whiskers - dentro dos grupos
    groups.forEach((group) => {
        const groupIndex = group.getAttribute('data-group-index');
        // Whiskers são linhas dentro do grupo
        const whiskers = group.querySelectorAll('line');
        whiskers.forEach((whisker, whiskerIndex) => {
            // Pular se for mediana ou outra linha
            if (whisker.closest('[data-outlier]')) {
                return;
            }
            
            whisker.addEventListener('mouseenter', () => {
                analytics.trackInteraction('boxplot', 'hover', `whisker-${groupIndex}-${whiskerIndex}`, {
                    elementType: 'whisker',
                    groupIndex: groupIndex,
                }, contextInfo);
            });
        });
    });
    
    // Rastrear labels/eixos - textos dentro dos grupos
    groups.forEach((group) => {
        const groupIndex = group.getAttribute('data-group-index');
        const labels = group.querySelectorAll('text');
        labels.forEach((label, labelIndex) => {
            label.addEventListener('mouseenter', () => {
                analytics.trackInteraction('boxplot', 'hover', `label-${groupIndex}-${labelIndex}`, {
                    elementType: 'label',
                    groupIndex: groupIndex,
                }, contextInfo);
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
        // Usar type guard para acesso seguro
        const xColumnsBySectionName = allDimensionColumns.filter(col => 
            hasSection(col, 'x')
        );
        
        if (xColumnsBySectionName.length > 0) {
            dimensionColumnsForGrouping = xColumnsBySectionName;
        } else {
            // Abordagem 2: Tentar acessar chartConfig através do contexto
            // Usar interface tipada para acesso seguro
            try {
                const ctxWithConfig = ctx as CustomChartContextWithConfig;
                const chartConfig = ctxWithConfig.getChartConfig?.() || 
                                   ctxWithConfig.chartConfig || 
                                   (chartModel as { chartConfig?: ChartConfig[] }).chartConfig;
                
                if (chartConfig && Array.isArray(chartConfig) && chartConfig.length > 0) {
                    const firstConfig = chartConfig[0];
                    if (firstConfig && 'dimensions' in firstConfig && Array.isArray(firstConfig.dimensions)) {
                        const dimensions = firstConfig.dimensions as ChartConfigDimension[];
                        const xDimension = dimensions.find(dim => dim.key === 'x');
                        
                        if (xDimension && xDimension.columns && Array.isArray(xDimension.columns)) {
                            // Filtrar apenas as colunas que estão na seção 'x'
                            const xColumnIds = new Set(
                                xDimension.columns
                                    .map(col => col.id || col.name || col.columnId)
                                    .filter((id): id is string => id !== undefined)
                            );
                            
                            dimensionColumnsForGrouping = allDimensionColumns.filter(col => {
                                const colId = getColumnId(col);
                                return colId !== undefined && xColumnIds.has(colId);
                            });
                        }
                    }
                }
            } catch (e) {
                // Ignora erros ao tentar acessar propriedades que podem não existir
                // Isso é esperado - o SDK pode não expor essas informações
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

        // Extrair informações do contexto ThoughtSpot (ORG, MODEL, USUARIO)
        const contextInfo = extractThoughtSpotContext(ctx, chartModel);
        const userId = contextInfo.userId;

        // Ler opções primeiro (necessárias para cálculos)
        const allVisualProps = chartModel.visualProps as Record<string, unknown>;
        const options = readBoxplotOptions(allVisualProps, measureColumn);

        // Identificar funcionalidades usadas
        const usedFeatures: string[] = ['render'];
        const appliedConfigs: string[] = [];
        
        if (options.showMean) appliedConfigs.push('showMean');
        if (options.showOutliers) appliedConfigs.push('showOutliers');
        if (options.showNotch) appliedConfigs.push('showNotch');
        if (options.showJitter) appliedConfigs.push('showJitter');
        if (options.variableWidth) appliedConfigs.push('variableWidth');
        if (options.referenceLines.show) {
            appliedConfigs.push('referenceLines');
            usedFeatures.push('referenceLines');
        }
        if (options.gridLines.show) appliedConfigs.push('gridLines');
        if (options.sortType && options.sortType !== 'Alfabética') {
            appliedConfigs.push(`sort-${options.sortType}`);
            usedFeatures.push('sorting');
        }
        if (options.orientation === 'horizontal') appliedConfigs.push('horizontalOrientation');
        
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
            // Informações sobre funcionalidades usadas
            features: {
                usedFeatures,
                appliedConfigs,
            },
            // Configurações de tooltip
            tooltip: {
                enabled: options.tooltip.enabled,
                format: options.tooltip.format,
            },
        }, userId, contextInfo);

        // Calcular dados do boxplot com as opções configuradas
        // Usar apenas as dimensões da seção 'x' (Categoria/Atributo) para agrupamento
        const boxplotData = calculateBoxplotData(chartModel, measureColumn, dimensionColumnsForGrouping, options);
        if (!boxplotData || boxplotData.groups.length === 0) {
            chartElement.innerHTML = '<div style="padding: 20px; color: #ef4444;">Não foi possível calcular os dados do Boxplot</div>';
            ctx.emitEvent(ChartToTSEvent.RenderComplete);
            return;
        }
        
        // Calcular range para o eixo Y:
        // - Se outliers estão habilitados: usar min/max absolutos de todos os dados (incluindo outliers)
        // - Se outliers estão desabilitados: usar whiskerLower/whiskerUpper (limites dos whiskers)
        const showOutliers = options.showOutliers !== false;
        let actualYMin: number;
        let actualYMax: number;
        
        if (showOutliers) {
            // Incluir outliers: usar valores absolutos min/max de todos os dados
            const allDataValues = boxplotData.groups.flatMap(g => g.values);
            if (allDataValues.length > 0) {
                // Usar loop ao invés de spread operator para evitar "Maximum call stack size exceeded" com arrays grandes
                let min = allDataValues[0];
                let max = allDataValues[0];
                for (let i = 1; i < allDataValues.length; i++) {
                    const val = allDataValues[i];
                    if (val < min) min = val;
                    if (val > max) max = val;
                }
                actualYMin = min;
                actualYMax = max;
            } else {
                actualYMin = boxplotData.globalStats.whiskerLower;
                actualYMax = boxplotData.globalStats.whiskerUpper;
            }
        } else {
            // Sem outliers: usar limites dos whiskers
            actualYMin = boxplotData.globalStats.whiskerLower;
            actualYMax = boxplotData.globalStats.whiskerUpper;
        }

        // Avisar se há muitos grupos (pode causar sobreposição)
        if (boxplotData.groups.length > 100) {
            console.warn('[BOXPLOT] Número de grupos muito alto (' + boxplotData.groups.length + '). A visualização pode estar comprometida devido à sobreposição.');
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
            actualYMin,
            actualYMax,
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
        
        // Configurar tooltips customizados
        setupCustomTooltips(chartElement, boxplotData, options.tooltip);
        
        // Adicionar event listeners para rastrear interações do usuário
        setupInteractionTracking(chartElement, userId, contextInfo);
        
        // Finalizar monitoramento e rastrear performance
        const perfEvent = performanceMonitor.endRender(sessionId);
        if (perfEvent) {
            perfEvent.chartType = 'boxplot';
            // Passar userId para evento de performance (herda de BaseAnalyticsEvent)
            if (userId) {
                perfEvent.userId = userId;
            }
            analytics.trackPerformance(perfEvent, contextInfo);
        }
        
        ctx.emitEvent(ChartToTSEvent.RenderComplete);
    } catch (error) {
        // Extrair contexto para logs de erro (pode não ter sido extraído antes)
        const errorContextInfo = extractThoughtSpotContext(ctx, chartModel);
        // Rastrear erros
        analytics.trackError('boxplot', error instanceof Error ? error : String(error), {
            sessionId,
        }, errorContextInfo);
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

