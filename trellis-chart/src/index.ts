/**
 * Custom Chart: Chart SDK - Multi-Measures
 * 
 * Usando apenas Chart SDK, sem bibliotecas externas (Muze, Highcharts, etc.)
 * Renderização simples com HTML/CSS
 */

import {
    ChartConfig,
    ChartModel,
    ColumnType,
    Query,
    getChartContext,
    CustomChartContext,
    ChartColumn,
    VisualPropEditorDefinition,
    ColumnProp,
    ChartToTSEvent,
    ColorPickerFormDetail,
    DropDownFormDetail,
    Section,
    ChartConfigEditorDefinition,
} from '@thoughtspot/ts-chart-sdk';
import _ from 'lodash';
import { logger } from './utils/logger';
import { 
    extractDataPointsArray, 
    createColumnIndexMap, 
    filterAndSortColumns,
    separateDimensionsAndMeasures,
    processChartData,
    findMissingMeasures
} from './utils/dataProcessing';
import type { TypedDataPointsArray, ChartElement, ChartDataPoint } from './types/chartTypes';

const renderChart = async (ctx: CustomChartContext) => {
    const chartModel = ctx.getChartModel();
    logger.debug('renderChart - chartModel completo:', chartModel);
    logger.debug('renderChart - Timestamp:', new Date().toISOString());
        
    const chartElement = document.getElementById('chart') as ChartElement | null;
    if (!chartElement) {
        logger.error('Elemento #chart não encontrado');
        return Promise.resolve();
    }

    const { columns, data, visualProps } = chartModel;
    logger.debug('renderChart - data:', data);
    logger.debug('renderChart - data.length:', data?.length);
    logger.debug('renderChart - data[0]:', data?.[0]);
    logger.debug('renderChart - data[0]?.data:', data?.[0]?.data);
    logger.debug('renderChart - visualProps:', visualProps);
    
    // Validação básica
        if (!data || data.length === 0) {
          chartElement.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #6b7280;">
              <p>Nenhum dado disponível para renderizar.</p>
            </div>
          `;
        return Promise.resolve();
        }
        
    // Extrair dados primeiro para usar a ordem do chartConfig
    logger.debug('renderChart - Verificando estrutura de dados...');
    
    // Extrair DataPointsArray usando função tipada
    const dataArr = extractDataPointsArray(data);
    
    logger.debug('renderChart - dataArr:', dataArr);
    logger.debug('renderChart - dataArr?.columns:', dataArr?.columns);
    logger.debug('renderChart - dataArr?.dataValue:', dataArr?.dataValue);
    logger.debug('renderChart - dataArr?.dataValue?.length:', dataArr?.dataValue?.length);
    
    if (!dataArr) {
        chartElement.innerHTML = `
            <div style="padding: 20px; color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">
                <h4 style="margin: 0 0 10px 0;">❌ Estrutura de dados inválida</h4>
                <p style="margin: 0;">Dados não estão no formato esperado.</p>
                <details style="margin-top: 10px;">
                    <summary style="cursor: pointer;">Ver estrutura recebida</summary>
                    <pre style="font-size: 11px;">${JSON.stringify(data, null, 2)}</pre>
                </details>
            </div>
        `;
        return Promise.resolve();
    }
    
    // A ordem das colunas em dataArr.columns reflete a ordem definida no Configure (chartConfig)
    // Primeiro vêm as dimensões (x-axis), depois as medidas (y-axis)
    const columnOrder = dataArr.columns;
    const columnOrderMap = createColumnIndexMap(columnOrder);
    const columnIndexMap = createColumnIndexMap(columnOrder);
    
    // Separar dimensões e medidas da lista completa de colunas
    const { dimensions: allDimensions, measures: allMeasures } = separateDimensionsAndMeasures(columns);
    
    // Filtrar e ordenar dimensões pela ordem do chartConfig (dataArr.columns)
    const availableColumnIds = new Set(columnOrder);
    const dimensions = filterAndSortColumns(allDimensions, availableColumnIds, columnOrderMap);
    
    // Filtrar e ordenar medidas pela ordem do chartConfig (dataArr.columns)
    // Medidas "Not visualized" não aparecem nos dados, então não serão incluídas
    const notVisualizedMeasures = allMeasures.filter(m => !availableColumnIds.has(m.id));
    if (notVisualizedMeasures.length > 0) {
        logger.debug('Medidas "Not visualized" (serão ignoradas):', 
            notVisualizedMeasures.map(m => ({ id: m.id, name: m.name })));
    }
    
    const measureCols = filterAndSortColumns(allMeasures, availableColumnIds, columnOrderMap);
    
    logger.debug('Medidas visualizadas (ordenadas pela ordem do Configure):', 
        measureCols.map(m => ({ id: m.id, name: m.name })));
    
    if (dimensions.length === 0 || measureCols.length === 0) {
          chartElement.innerHTML = `
            <div style="padding: 20px; color: #f59e0b; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px;">
              <h4 style="margin: 0 0 10px 0;">⚠️ Dados insuficientes</h4>
              <p style="margin: 0;">É necessário pelo menos 1 dimensão e 1 medida.</p>
            </div>
          `;
        return Promise.resolve();
    }

    // Suportar múltiplas dimensões - primeira dimensão agrupa, demais subdividem
    // Agora a ordem já está correta (definida no Configure)
    const primaryDimension = dimensions[0];
    const secondaryDimensions = dimensions.slice(1);
    const hasSecondaryDimension = secondaryDimensions.length >= 1;
    
    logger.debug('Dimensões (ordenadas pela ordem do Configure):', {
        primary: primaryDimension?.name,
        secondary: secondaryDimensions.map(d => d.name),
        total: dimensions.length
    });
    
    logger.debug('renderChart - Column map:', columnIndexMap);
    logger.debug('renderChart - primaryDimension.id:', primaryDimension.id);
    logger.debug('renderChart - secondaryDimensions IDs:', secondaryDimensions.map(d => d.id));
    logger.debug('renderChart - measureCols IDs:', measureCols.map(m => m.id));
    logger.debug('renderChart - Colunas disponíveis nos dados:', dataArr.columns);
    
    // Verificar se todas as medidas estão nos dados (apenas para medidas visualizadas)
    // Nota: medidas "Not visualized" são intencionalmente excluídas e não são consideradas "missing"
    const missingMeasures = findMissingMeasures(measureCols, columnIndexMap);
    if (missingMeasures.length > 0) {
        logger.warn('Medidas não encontradas nos dados (pode ser que os dados ainda estejam carregando):', 
            missingMeasures.map(m => ({ id: m.id, name: m.name })));
        logger.warn('Essas medidas aparecerão com valor 0 até que os dados sejam carregados');
        logger.warn('Colunas disponíveis nos dados:', dataArr.columns);
        logger.warn('IDs das medidas esperadas:', measureCols.map(m => ({ id: m.id, name: m.name })));
        
        // Limpar qualquer retry anterior para evitar múltiplos intervalos
        if (chartElement.__retryTimeout) {
            clearTimeout(chartElement.__retryTimeout);
            chartElement.__retryTimeout = null;
        }
        if (chartElement.__retryInterval) {
            clearInterval(chartElement.__retryInterval);
            chartElement.__retryInterval = null;
        }
        
        // Criar uma cópia dos IDs das medidas faltantes para evitar problemas de referência
        const missingMeasureIds = missingMeasures.map(m => m.id);
        
        // TENTATIVA DE FORÇAR ATUALIZAÇÃO: Quando detectamos medidas faltando, vamos tentar
        // emitir um evento UpdateVisualProps para forçar o ThoughtSpot a re-executar getDefaultChartConfig.
        // Isso pode fazer o ThoughtSpot detectar uma mudança e re-executar o fluxo completo.
        const tryForceRefresh = async () => {
            try {
                // Sempre obter o chartModel mais recente
                const currentChartModel = ctx.getChartModel();
                const currentVisualProps = currentChartModel.visualProps || {};
                const columnDependency = (currentVisualProps as any)?._column_dependency || {};
                
                // Incrementar um contador de "refresh trigger" para forçar o ThoughtSpot a detectar uma mudança
                const currentRefreshTrigger = (columnDependency as any)?._refresh_trigger || 0;
                const newRefreshTrigger = currentRefreshTrigger + 1;
                
                logger.debug(`🔄 [DEBUG] Tentando forçar atualização emitindo UpdateVisualProps...`);
                logger.debug(`🔄 [DEBUG] Refresh trigger atual: ${currentRefreshTrigger} -> novo: ${newRefreshTrigger}`);
                logger.debug(`🔄 [DEBUG] Medidas faltando:`, missingMeasures.map(m => m.name));
                
                await ctx.emitEvent(ChartToTSEvent.UpdateVisualProps, {
                    visualProps: {
                        ...(currentVisualProps as Record<string, unknown>),
                        _column_dependency: {
                            ...(columnDependency as Record<string, unknown>),
                            _refresh_trigger: newRefreshTrigger,
                            _missing_measures_count: missingMeasures.length,
                        },
                    },
                });
                
                logger.debug('✅ [DEBUG] UpdateVisualProps emitido com sucesso - isso pode forçar o ThoughtSpot a re-executar getDefaultChartConfig');
            } catch (error) {
                logger.warn('Erro ao tentar emitir UpdateVisualProps para forçar atualização:', error);
            }
        };
        
        // Tentar forçar atualização imediatamente quando detectamos medidas faltando
        await tryForceRefresh();
        
        // Função para verificar e re-renderizar se necessário
        const checkAndRetry = async (attemptNumber: number): Promise<boolean> => {
            logger.debug(`🔄 [DEBUG] Tentativa ${attemptNumber}: Verificando se dados das medidas faltantes foram carregados...`);
            
            try {
                const updatedChartModel = ctx.getChartModel();
                const updatedData = updatedChartModel.data;
                
                if (!updatedData || updatedData.length === 0) {
                    logger.debug(`🔄 [DEBUG] Tentativa ${attemptNumber}: Ainda não há dados disponíveis`);
                    return false;
                }
                
                const updatedDataArr = extractDataPointsArray(updatedData);
                if (!updatedDataArr) {
                    logger.debug(`Tentativa ${attemptNumber}: Estrutura de dados ainda não está pronta`);
                    return false;
                }
                
                const updatedColumnMap = createColumnIndexMap(updatedDataArr.columns);
                
                // Verificar se as medidas que estavam faltando agora estão presentes
                const nowAvailable = missingMeasureIds.filter(id => updatedColumnMap.has(id));
                const stillMissing = missingMeasureIds.filter(id => !updatedColumnMap.has(id));
                
                logger.debug(`Tentativa ${attemptNumber}: Colunas disponíveis:`, updatedDataArr.columns);
                logger.debug(`Tentativa ${attemptNumber}: ${nowAvailable.length} medida(s) agora disponível(is), ${stillMissing.length} ainda faltando`);
                logger.debug(`Tentativa ${attemptNumber}: IDs encontrados:`, nowAvailable);
                logger.debug(`Tentativa ${attemptNumber}: IDs ainda faltando:`, stillMissing);
                
                if (nowAvailable.length > 0) {
                    const availableMeasures = missingMeasures.filter(m => nowAvailable.includes(m.id));
                    logger.debug(`Dados atualizados após ${attemptNumber} tentativa(s)! Medidas encontradas:`, 
                        availableMeasures.map(m => m.name));
                    logger.debug('Re-renderizando gráfico com dados atualizados...');
                    
                    // Limpar intervalos antes de re-renderizar
                    if (chartElement.__retryTimeout) {
                        clearTimeout(chartElement.__retryTimeout);
                        chartElement.__retryTimeout = null;
                    }
                    if (chartElement.__retryInterval) {
                        clearInterval(chartElement.__retryInterval);
                        chartElement.__retryInterval = null;
                    }
                    
                    // Aguardar um pouco mais antes de re-renderizar para garantir que os dados estão completos
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Re-renderizar o gráfico
                    await renderChart(ctx);
                    return true; // Indica que o retry foi bem-sucedido
                }
            } catch (error) {
                logger.error(`Erro na tentativa ${attemptNumber}:`, error);
            }
            
            return false; // Indica que ainda não há dados
        };
        
        // IMPORTANTE: Quando uma nova medida é adicionada, o ThoughtSpot pode não re-executar a query imediatamente.
        // O ChartConfig pode estar desatualizado e não incluir a nova medida na query.
        // A nova medida só aparecerá quando o ThoughtSpot re-executar a query (geralmente após mudar uma configuração).
        // Por isso, continuamos tentando por um tempo maior para detectar quando os dados finalmente chegam.
        
        // Primeira tentativa após 1 segundo
        chartElement.__retryTimeout = setTimeout(async () => {
            const success = await checkAndRetry(1);
            if (!success) {
                // Se ainda não funcionou, iniciar intervalos
                // Aumentar significativamente o número de tentativas e o intervalo
                const maxRetries = 30; // 30 tentativas = ~30 segundos
                let retryCount = 1; // Já fizemos a primeira tentativa
                
                chartElement.__retryInterval = setInterval(async () => {
                    retryCount++;
                    if (retryCount > maxRetries) {
                        logger.warn(`Número máximo de tentativas (${maxRetries}) atingido. Parando retry.`);
                        logger.debug('Medidas que nunca apareceram nos dados:', 
                            missingMeasures.map(m => ({ id: m.id, name: m.name })));
                        logger.debug('POSSÍVEL CAUSA: Quando uma nova medida é adicionada, o ThoughtSpot pode não incluí-la na query imediatamente.');
                        logger.debug('SOLUÇÃO: Tente mudar alguma configuração do gráfico (ex: Mostrar Eixo Y) para forçar o ThoughtSpot a re-executar a query.');
                        if (chartElement.__retryInterval) {
                            clearInterval(chartElement.__retryInterval);
                            chartElement.__retryInterval = null;
                        }
                        return;
                    }
                    
                    // Tentar forçar atualização a cada 5 tentativas para tentar desbloquear o cache do ThoughtSpot
                    if (retryCount % 5 === 0) {
                        logger.debug(`🔄 [DEBUG] Tentativa ${retryCount}: Tentando forçar atualização novamente...`);
                        await tryForceRefresh();
                    }
                    
                    const success = await checkAndRetry(retryCount);
                    if (success) {
                        if (chartElement.__retryInterval) {
                            clearInterval(chartElement.__retryInterval);
                            chartElement.__retryInterval = null;
                        }
                    }
                }, 1000); // Verificar a cada 1 segundo
            }
        }, 1000);
    }

    // Processar dados usando função tipada
    logger.debug('renderChart - Processando', dataArr.dataValue.length, 'linhas...');
    
    let chartData = processChartData(
        dataArr,
        columnIndexMap,
        primaryDimension,
        secondaryDimensions,
        measureCols
    );
    
    // Ordenar dados para garantir agrupamento correto:
    // Primeiro pela segunda dimensão (horário da refeição - Almoço/Jantar)
    // Depois pela primeira dimensão (dia da semana - Segunda/Terça/etc)
    // Isso garante que os dados venham agrupados: Almoço-Segunda, Almoço-Terça, ... Jantar-Segunda, Jantar-Terça...
    if (hasSecondaryDimension && secondaryDimensions.length > 0) {
        chartData = [...chartData].sort((a, b) => {
            // Comparar segunda dimensão primeiro (horário da refeição)
            const secondaryA = a.secondaryLabels[0] || '';
            const secondaryB = b.secondaryLabels[0] || '';
            const secondaryCompare = secondaryA.localeCompare(secondaryB);
            
            if (secondaryCompare !== 0) {
                return secondaryCompare;
            }
            
            // Se segunda dimensão é igual, comparar primeira dimensão (dia da semana)
            return a.primaryLabel.localeCompare(b.primaryLabel);
        });
    }
    
    logger.debug('renderChart - chartData final:', chartData);
    logger.debug('renderChart - chartData.length:', chartData.length);

    if (chartData.length === 0) {
          chartElement.innerHTML = `
            <div style="padding: 20px; color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">
              <h4 style="margin: 0 0 10px 0;">❌ Erro ao processar dados</h4>
                <p style="margin: 0;">Nenhum dado válido foi encontrado.</p>
            </div>
          `;
        return Promise.resolve();
    }

    // hasSecondaryDimension já foi definido anteriormente, reutilizar
    
    logger.debug('🎨 [DEBUG] Total de pontos no eixo X:', chartData.length);
    logger.debug('🎨 [DEBUG] Primeiro ponto:', chartData[0]);

    // Obter configuração do eixo Y antes de calcular margens
    // IMPORTANTE: visualProps pode vir de diferentes estruturas:
    // - Primeira renderização: configurações em seções separadas (chart_visual, chart_dimensions, etc.)
    // - Renderizações seguintes: configurações consolidadas em chart_options
    const allVisualProps = visualProps as any;
    logger.debug('🔍 [DEBUG] visualProps completo na leitura:', JSON.stringify(allVisualProps, null, 2));
    
    // IMPORTANTE: SEMPRE priorizar seções individuais sobre chart_options consolidado
    // Isso garante que mudanças recentes sejam aplicadas imediatamente
    const chartVisual = allVisualProps?.chart_visual || {};
    const chartDimensions = allVisualProps?.chart_dimensions || {};
    const chartOptionsConsolidated = allVisualProps?.chart_options || allVisualProps?.chartOptions || {};
    
    // Construir chartOptions SEMPRE mesclando: seções individuais têm prioridade máxima
    const chartOptions: any = {
        // Valores de chart_visual (prioridade máxima)
        showYAxis: chartVisual.hasOwnProperty('showYAxis') 
            ? chartVisual.showYAxis !== false 
            : (chartOptionsConsolidated.hasOwnProperty('showYAxis') ? chartOptionsConsolidated.showYAxis !== false : true),
        showGridLines: chartVisual.hasOwnProperty('showGridLines')
            ? chartVisual.showGridLines !== false
            : (chartOptionsConsolidated.hasOwnProperty('showGridLines') ? chartOptionsConsolidated.showGridLines !== false : true),
        dividerLinesBetweenMeasures: chartVisual.hasOwnProperty('dividerLinesBetweenMeasures')
            ? chartVisual.dividerLinesBetweenMeasures !== false
            : (chartOptionsConsolidated.hasOwnProperty('dividerLinesBetweenMeasures') ? chartOptionsConsolidated.dividerLinesBetweenMeasures !== false : true),
        dividerLinesBetweenGroups: chartVisual.hasOwnProperty('dividerLinesBetweenGroups')
            ? chartVisual.dividerLinesBetweenGroups !== false
            : (chartOptionsConsolidated.hasOwnProperty('dividerLinesBetweenGroups') ? chartOptionsConsolidated.dividerLinesBetweenGroups !== false : true),
        dividerLinesBetweenBars: chartVisual.hasOwnProperty('dividerLinesBetweenBars')
            ? chartVisual.dividerLinesBetweenBars !== false
            : (chartOptionsConsolidated.hasOwnProperty('dividerLinesBetweenBars') ? chartOptionsConsolidated.dividerLinesBetweenBars !== false : false),
        dividerLinesColor: chartVisual.dividerLinesColor || chartOptionsConsolidated.dividerLinesColor || '#d1d5db',
        measureNameRotation: chartVisual.measureNameRotation || chartOptionsConsolidated.measureNameRotation || '0',
        forceLabels: chartVisual.hasOwnProperty('forceLabels')
            ? chartVisual.forceLabels
            : (chartOptionsConsolidated.hasOwnProperty('forceLabels') ? chartOptionsConsolidated.forceLabels : false),
        // Valores de chart_dimensions (prioridade máxima)
        fitWidth: chartDimensions.hasOwnProperty('fitWidth')
            ? chartDimensions.fitWidth
            : (chartOptionsConsolidated.hasOwnProperty('fitWidth') ? chartOptionsConsolidated.fitWidth : false),
        fitHeight: chartDimensions.hasOwnProperty('fitHeight')
            ? chartDimensions.fitHeight
            : (chartOptionsConsolidated.hasOwnProperty('fitHeight') ? chartOptionsConsolidated.fitHeight : false),
        measureLabelSpace: chartDimensions.hasOwnProperty('measureLabelSpace')
            ? chartDimensions.measureLabelSpace
            : (chartOptionsConsolidated.hasOwnProperty('measureLabelSpace') ? chartOptionsConsolidated.measureLabelSpace : 150),
        measureRowHeight: chartDimensions.hasOwnProperty('measureRowHeight')
            ? chartDimensions.measureRowHeight
            : (chartOptionsConsolidated.hasOwnProperty('measureRowHeight') ? chartOptionsConsolidated.measureRowHeight : 100),
        barWidth: chartDimensions.hasOwnProperty('barWidth')
            ? chartDimensions.barWidth
            : (chartOptionsConsolidated.hasOwnProperty('barWidth') ? chartOptionsConsolidated.barWidth : 50),
    };
    
    logger.debug('🔍 [DEBUG] chartOptions lido (após consolidação):', JSON.stringify(chartOptions, null, 2));
    
    // Para showYAxis, verificar se está undefined (não configurado) ou false (desabilitado)
    // Se for undefined, usar true como padrão. Se for false explicitamente, usar false.
    const showYAxis = chartOptions.hasOwnProperty('showYAxis') 
        ? chartOptions.showYAxis !== false 
        : true; // Default: true se não foi configurado
    const measureNameRotation = Number(chartOptions?.measureNameRotation || '-90'); // Default: -90 graus (vertical)
    const fitWidth = chartOptions?.fitWidth || false; // Default: false
    const fitHeight = chartOptions?.fitHeight || false; // Default: false
    const showGridLines = chartOptions?.showGridLines !== false; // Default: true (controla linhas divisórias)
    const dividerLinesBetweenMeasures = chartOptions?.dividerLinesBetweenMeasures !== false; // Default: true
    const dividerLinesBetweenGroups = chartOptions?.dividerLinesBetweenGroups !== false; // Default: true
    const dividerLinesBetweenBars = chartOptions?.dividerLinesBetweenBars !== false; // Default: false
    const dividerLinesColor = chartOptions?.dividerLinesColor || '#d1d5db'; // Default: cinza claro
    // Espaço das labels das medidas configurável pelo usuário (default baseado no showYAxis)
    const measureLabelSpace = chartOptions?.measureLabelSpace ?? (showYAxis ? 120 : 60);
    // Altura da linha configurável (default: 50px)
    const fixedMeasureRowHeight = chartOptions?.measureRowHeight ?? 50;
    // Largura da barra configurável (default: 40px)
    const fixedBarWidth = chartOptions?.barWidth ?? 40;
    // Forçar labels (default: false)
    const forceLabels = chartOptions?.forceLabels || false;
    // Tamanhos de fonte configuráveis - ler da seção text_sizes (pode vir de text_sizes direto ou chart_options)
    const textSizes = allVisualProps?.text_sizes || {};
    const labelFontSize = textSizes?.labelFontSize ?? 10; // Rótulos do eixo X e Header (usam o mesmo tamanho)
    const measureTitleFontSize = textSizes?.measureTitleFontSize ?? 10; // Títulos das medidas
    const valueLabelFontSize = textSizes?.valueLabelFontSize ?? 9; // Valores nas barras/pontos
    
    // Usar o espaço configurável para as labels das medidas
    const leftMargin = measureLabelSpace;
    // hasSecondaryDimension já foi definido anteriormente
    const secondaryAxisHeight = hasSecondaryDimension ? 40 : 0; // Altura reservada para o segundo eixo X
    const topMargin = hasSecondaryDimension ? 50 : 20; // Espaço para segundo eixo X acima + margem
    const bottomMargin = 60; // Apenas primeira dimensão embaixo
    const rightMargin = 40;
    const spacingBetweenMeasures = 15; // Espaço entre linhas de medidas
    
    // Calcular altura da linha e altura total do gráfico
    let measureRowHeight: number;
    let chartHeight: number;
    
    if (fitHeight) {
        // Quando altura está em 100%, a altura da linha será calculada dinamicamente
        // Usar um valor base para o cálculo inicial (será ajustado depois)
        chartHeight = 500;
        measureRowHeight = (chartHeight - topMargin - bottomMargin - (spacingBetweenMeasures * (measureCols.length - 1))) / measureCols.length;
    } else {
        // Quando altura não está em 100%, usar altura fixa configurável
        measureRowHeight = fixedMeasureRowHeight;
        // Calcular altura total do gráfico baseado na altura fixa das linhas
        chartHeight = topMargin + (measureRowHeight * measureCols.length) + (spacingBetweenMeasures * (measureCols.length - 1)) + bottomMargin;
    }
    
    // Ajustar largura e espaçamento das barras
    const numBars = chartData.length;
    
    let barWidth: number;
    let barSpacing: number;
    let chartWidth: number;
    
    if (fitWidth) {
        // Quando largura está em 100%, será calculado dinamicamente depois
        // Usar um valor base temporário
        const tempChartWidth = chartData.length * 60 + leftMargin + rightMargin;
        const tempPlotAreaWidth = tempChartWidth - leftMargin - rightMargin;
        barSpacing = showYAxis ? 20 : Math.max(15, tempPlotAreaWidth / (numBars * 3));
        const totalSpacing = barSpacing * (numBars - 1);
        barWidth = showYAxis ? 40 : Math.max(30, (tempPlotAreaWidth - totalSpacing) / numBars);
        chartWidth = tempChartWidth;
    } else {
        // Quando largura NÃO está em 100%, usar largura fixa configurável (independente de fitHeight)
        // Isso permite criar scroll quando necessário
        barWidth = fixedBarWidth;
        barSpacing = showYAxis ? 20 : 15; // Espaçamento fixo
        // Calcular largura total do gráfico baseado na largura fixa das barras
        const totalBarWidth = barWidth * numBars;
        const totalBarSpacing = barSpacing * (numBars - 1);
        const plotAreaWidth = totalBarWidth + totalBarSpacing;
        chartWidth = plotAreaWidth + leftMargin + rightMargin;
        
        logger.debug('📏 [DEBUG] Largura da barra configurada:', fixedBarWidth);
        logger.debug('📏 [DEBUG] Número de barras:', numBars);
        logger.debug('📏 [DEBUG] Largura total calculada:', chartWidth);
    }
    
    const plotAreaWidth = chartWidth - leftMargin - rightMargin;

    // Cores padrão para as medidas
    const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];
    
    // Função para formatar valores baseado na configuração do usuário
    const formatValue = (value: number, formatType: string, decimals: number = 2): string => {
        switch (formatType) {
            case 'percentage':
            case 'porcentagem':
                return `${(value * 100).toFixed(decimals)}%`;
            case 'currency':
            case 'moeda':
                return `R$ ${value.toFixed(decimals)}`;
            case 'scientific':
            case 'científico':
                return value.toExponential(decimals);
            case 'integer':
            case 'inteiro':
                return Math.round(value).toString();
            case 'decimal':
            default:
                return value.toFixed(decimals);
        }
    };
    
    // Função para formatar dimensões (datas/horas)
    const formatDimension = (value: any, formatType: string = 'auto'): string => {
        if (value === null || value === undefined) return '';
        
        const effectiveFormatType = formatType || 'auto';
        
        // Se for objeto com propriedade v (valor do ThoughtSpot)
        let rawValue = value;
        if (value && typeof value === 'object' && 'v' in value) {
            rawValue = value.v?.s || value.v?.n || value.v || value;
        }
        
        // Se for string, retorna como está (a menos que seja número como string)
        if (typeof rawValue === 'string') {
            // Tenta parsear se parecer um timestamp
            const numValue = Number(rawValue);
            if (!isNaN(numValue) && rawValue.length > 8 && effectiveFormatType !== 'auto') {
                rawValue = numValue;
            } else if (effectiveFormatType === 'auto') {
                return rawValue;
            }
        }
        
        // Se for timestamp (número)
        if (typeof rawValue === 'number') {
            // Timestamps do ThoughtSpot podem vir em segundos ou milissegundos
            // Se for muito grande (> 10^12), provavelmente está em milissegundos
            const timestamp = rawValue > 1000000000000 ? rawValue : rawValue * 1000;
            const date = new Date(timestamp);
            
            // Verifica se a data é válida
            if (isNaN(date.getTime())) {
                return String(rawValue);
            }
            
            switch (effectiveFormatType) {
                case 'dd/MM/yyyy':
                    return date.toLocaleDateString('pt-BR');
                case 'dd-MM-yyyy':
                    return date.toLocaleDateString('pt-BR').replace(/\//g, '-');
                case 'yyyy-MM-dd':
                    return date.toISOString().split('T')[0];
                case 'dd/MM/yyyy HH:mm':
                    return date.toLocaleString('pt-BR', { 
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    });
                case 'dd/MM/yyyy HH:mm:ss':
                    return date.toLocaleString('pt-BR', { 
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                    });
                case 'dia':
                    return date.toLocaleDateString('pt-BR', { weekday: 'long' });
                case 'mês':
                    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                case 'ano':
                    return date.toLocaleDateString('pt-BR', { year: 'numeric' });
                case 'hora':
                    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                case 'auto':
                default:
                    // Tenta detectar automaticamente
                    return date.toLocaleString('pt-BR');
            }
        }
        
        // Se já for string, retorna como está
        return String(rawValue);
    };
    
    // Obter configuração de formatação de dimensões
    // IMPORTANTE: Quando columnsVizPropDefinition é usado, a configuração pode estar em columnVisualProps
    // Formato columnsVizPropDefinition: visualProps.columnVisualProps[dimension.id].dateFormat
    // Formato antigo (elements): visualProps.dimension_formatting.dateFormat
    const columnVisualProps = (visualProps as any)?.columnVisualProps || {};
    const dimensionConfigOld = (visualProps as any)?.dimension_formatting || {};
    
    // Tentar ler da dimensão primária primeiro (configuração específica da coluna na aba Configure)
    const primaryDimensionConfig = columnVisualProps[primaryDimension.id] || {};
    // Depois tentar formato antigo (global)
    const primaryDateFormat = primaryDimensionConfig.dateFormat || dimensionConfigOld?.dateFormat || 'auto';
    
    // Formatação para a dimensão secundária (se existir)
    let secondaryDateFormat = 'auto';
    if (hasSecondaryDimension && secondaryDimensions.length > 0) {
        const secondaryDimensionConfig = columnVisualProps[secondaryDimensions[0].id] || {};
        secondaryDateFormat = secondaryDimensionConfig.dateFormat || dimensionConfigOld?.dateFormat || 'auto';
    }
    
    logger.debug('🔍 [DEBUG] Formatação de dimensão:', {
        primaryDimensionId: primaryDimension.id,
        primaryDateFormat: primaryDateFormat,
        secondaryDimensionId: hasSecondaryDimension && secondaryDimensions.length > 0 ? secondaryDimensions[0].id : null,
        secondaryDateFormat: secondaryDateFormat
    });
    
    // Obter cor, formato e casas decimais para cada medida
    // IMPORTANTE: Quando columnsVizPropDefinition é usado, as configurações podem estar em columnVisualProps
    // Formato columnsVizPropDefinition: visualProps.columnVisualProps[measure.id]
    // Formato antigo (elements): visualProps[`measure_${measure.id}`]
    // Formato direto: visualProps[measure.id]
    const measureConfigs = measureCols.map((measure, measureIdx) => {
        const measureKeyOld = `measure_${measure.id}`; // Formato antigo (elements)
        
        // Ler de todas as fontes possíveis, com prioridade
        const columnVisualProps = (visualProps as any)?.columnVisualProps || {};
        const configFromColumnVisualProps = columnVisualProps[measure.id] || {};
        const configOld = (visualProps as any)?.[measureKeyOld] || {};
        const configNew = (visualProps as any)?.[measure.id] || {};
        
        // Combinar todas as configurações (prioridade: columnVisualProps > measure_${id} > measure.id direto)
        const measureConfig = {
            ...configNew,
            ...configOld,
            ...configFromColumnVisualProps // Último = maior prioridade
        };
        
        const color = measureConfig?.color || defaultColors[measureIdx % defaultColors.length];
        const format = measureConfig?.format || 'decimal';
        const decimals = measureConfig?.decimals ?? 2;
        const chartType = measureConfig?.chartType || 'bar'; // 'bar' ou 'line'
        
        // Log apenas para primeira medida na primeira renderização
        if (measureIdx === 0 && !chartElement.__configLogged) {
            logger.debug('🔍 [DEBUG] === LEITURA DE CONFIGURAÇÕES ===');
            logger.debug('🔍 [DEBUG] columnVisualProps:', columnVisualProps);
            logger.debug(`🔍 [DEBUG] Config para "${measure.name}":`, {
                fromColumnVisualProps: configFromColumnVisualProps,
                fromMeasureKeyOld: configOld,
                fromMeasureId: configNew,
                finalConfig: measureConfig
            });
            chartElement.__configLogged = true;
        }
        
        return { color, format, decimals, chartType };
    });
    
    logger.debug('🎨 [DEBUG] Configurações finais das medidas:', measureConfigs.map((c, i) => ({
        measure: measureCols[i].name,
        color: c.color,
        format: c.format,
        decimals: c.decimals,
        chartType: c.chartType
    })));

    // Calcular min/max para cada medida individualmente
    const measureRanges = measureCols.map((measure, measureIdx) => {
        const values = chartData.map(d => d.values[measureIdx] || 0);
        const allValues = values.filter(v => v !== null && v !== undefined);
        const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
        const maxValue = allValues.length > 0 ? Math.max(...allValues) : 1;
        // Adicionar pequena margem para melhor visualização (10% ou valor mínimo)
        const range = maxValue - minValue;
        const margin = range > 0 ? range * 0.1 : (maxValue > 0 ? maxValue * 0.1 : 0.1);
          return {
            min: Math.max(0, minValue - margin), // Não permitir valores negativos se todos forem positivos
            max: maxValue + margin, 
            measure,
            originalMin: minValue,
            originalMax: maxValue
          };
        });
    
    logger.debug('🎨 [DEBUG] measureRanges individuais:', measureRanges.map(r => ({
        measure: r.measure.name,
        min: r.min,
        max: r.max,
        originalMin: r.originalMin,
        originalMax: r.originalMax
    })));
    
    // Validar que cada medida tem sua própria escala
    measureRanges.forEach((range, idx) => {
        logger.debug(`🎨 [DEBUG] Medida ${idx} (${range.measure.name}): min=${range.min}, max=${range.max}, range=${range.max - range.min}`);
    });

    // Função para converter valor de uma medida em coordenada Y dentro de sua linha
    // SVG: Y aumenta para baixo, então valor máximo fica no topo da linha (menor Y)
    const valueToY = (value: number, minValue: number, maxValue: number, measureRowTop: number, measureRowHeight: number) => {
        if (maxValue === minValue) return measureRowTop + measureRowHeight / 2;
        const ratio = (value - minValue) / (maxValue - minValue);
        // Valores maiores no topo da linha (menor coordenada Y), menores no fundo (maior coordenada Y)
        return measureRowTop + (1 - ratio) * measureRowHeight;
    };

    // Renderizar barras ou linhas - cada medida em sua própria linha horizontal
    const allChartElementsHtml = measureCols.map((measure, measureIdx) => {
        const measureRowTop = topMargin + measureIdx * (measureRowHeight + spacingBetweenMeasures);
        const { min: minValue, max: maxValue } = measureRanges[measureIdx];
        const measureConfig = measureConfigs[measureIdx];
        const chartType = measureConfig.chartType || 'bar';
        
        if (chartType === 'line') {
            // Renderizar linha conectando os pontos
            const points = chartData.map((item, itemIdx) => {
                const value = item.values[measureIdx] || 0;
                const x = leftMargin + itemIdx * (barWidth + barSpacing) + barWidth / 2;
                const y = valueToY(value, minValue, maxValue, measureRowTop, measureRowHeight);
                return { x, y, value, itemIdx };
            });
            
            // Criar path para a linha
            const pathData = points.map((point, idx) => 
                `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
            ).join(' ');
            
            // Renderizar círculos nos pontos
            const circles = points.map((point) => `
                <circle 
                    cx="${point.x}" 
                    cy="${point.y}" 
                    r="4"
                    fill="${measureConfig.color}"
                    stroke="white"
                    stroke-width="2"
                />
                <text 
                    x="${point.x}" 
                    y="${point.y - 8}" 
                    text-anchor="middle"
                    font-size="${valueLabelFontSize}"
                    fill="#374151"
                    font-weight="500"
                >${formatValue(point.value, measureConfig.format, measureConfig.decimals)}</text>
            `).join('');
            
            return `
                <g>
                    <path 
                        d="${pathData}"
                        stroke="${measureConfig.color}"
                        stroke-width="2"
                        fill="none"
                        opacity="0.8"
                    />
                    ${circles}
                </g>
            `;
        } else {
            // Renderizar barras (comportamento padrão)
            const barsForMeasure = chartData.map((item, itemIdx) => {
                const value = item.values[measureIdx] || 0;
                const barX = leftMargin + itemIdx * (barWidth + barSpacing);
                
                // Posição Y do valor (topo da barra se positivo, fundo se negativo)
                const valueY = valueToY(value, minValue, maxValue, measureRowTop, measureRowHeight);
                // Posição Y do zero ou mínimo (base da barra)
                const baseY = valueToY(Math.max(0, minValue), minValue, maxValue, measureRowTop, measureRowHeight);
                
                // Altura da barra (sempre positiva)
                const barHeight = Math.abs(valueY - baseY);
                // Posição Y da barra (sempre do menor Y para maior Y)
                const barY = Math.min(valueY, baseY);
                
                return `
                    <g>
                        <rect 
                            x="${barX}" 
                            y="${barY}" 
                            width="${barWidth}" 
                            height="${barHeight}"
                            fill="${measureConfig.color}"
                            opacity="0.9"
                        />
                        ${(barHeight > 15 || forceLabels) ? `
                        <text 
                            x="${barX + barWidth / 2}" 
                            y="${barY - 5}" 
                            text-anchor="middle"
                            font-size="${valueLabelFontSize}"
                            fill="#374151"
                            font-weight="500"
                        >${formatValue(value, measureConfig.format, measureConfig.decimals)}</text>
                        ` : ''}
                    </g>
                `;
            }).join('');
            
            return barsForMeasure;
        }
    }).join('');

    // Renderizar eixos Y individuais para cada medida (cada uma em sua própria linha)
    const yAxesHtml = measureRanges.map((range, measureIdx) => {
        const measureRowTop = topMargin + measureIdx * (measureRowHeight + spacingBetweenMeasures);
        const axisX = leftMargin - 10;

        // Linha do eixo Y para esta medida
        const yAxisLine = `
            <line 
                x1="${axisX}" 
                y1="${measureRowTop}" 
                x2="${axisX}" 
                y2="${measureRowTop + measureRowHeight}" 
                stroke="#374151" 
                stroke-width="1.5"
            />
        `;

        // Título da medida (sempre mostrar) - com rotação configurável
        // Centralizar o título no espaço configurável para as labels
        const titleX = measureLabelSpace / 2;
        const titleY = measureRowTop + measureRowHeight / 2;
        const measureTitle = `
            <text 
                x="${titleX}" 
                y="${titleY}" 
                text-anchor="middle"
                font-size="${measureTitleFontSize}"
                fill="#374151"
                font-weight="500"
                transform="rotate(${measureNameRotation} ${titleX} ${titleY})"
            >${range.measure.name}</text>
        `;

        // Se o eixo Y estiver oculto, mostrar apenas o título da medida
        if (!showYAxis) {
            return measureTitle;
        }

        return yAxisLine + measureTitle;
    }).join('');

    // Linhas divisórias horizontais entre medidas (se habilitado)
    let dividerLinesBetweenMeasuresHtml = '';
    if (showGridLines && dividerLinesBetweenMeasures && measureCols.length > 1) {
        for (let measureIdx = 0; measureIdx < measureCols.length - 1; measureIdx++) {
            const measureRowTop = topMargin + measureIdx * (measureRowHeight + spacingBetweenMeasures);
            const dividerY = measureRowTop + measureRowHeight + spacingBetweenMeasures / 2;
            dividerLinesBetweenMeasuresHtml += `
                <line 
                    x1="${leftMargin}" 
                    y1="${dividerY}" 
                    x2="${leftMargin + plotAreaWidth}" 
                    y2="${dividerY}" 
                    stroke="${dividerLinesColor}" 
                    stroke-width="1"
                />
            `;
        }
    }
    
    // Linhas divisórias verticais entre barras (se habilitado)
    let dividerLinesBetweenBarsHtml = '';
    if (showGridLines && dividerLinesBetweenBars && chartData.length > 1) {
        for (let barIdx = 0; barIdx < chartData.length - 1; barIdx++) {
            const barX = leftMargin + (barIdx + 1) * (barWidth + barSpacing) - barSpacing / 2;
            const dividerStartY = topMargin;
            const lastMeasureRowTop = topMargin + (measureCols.length - 1) * (measureRowHeight + spacingBetweenMeasures);
            const dividerEndY = lastMeasureRowTop + measureRowHeight;
            dividerLinesBetweenBarsHtml += `
                <line 
                    x1="${barX}" 
                    y1="${dividerStartY}" 
                    x2="${barX}" 
                    y2="${dividerEndY}" 
                    stroke="${dividerLinesColor}" 
                    stroke-width="1"
                />
            `;
        }
    }

    // Segundo eixo X (eixo X secundário) - segunda dimensão na parte superior
    // Agrupa categorias secundárias (como no Trellis Chart) - uma label por grupo
    let secondaryXAxisHtml = '';
    let secondaryXAxisLabelsHtml = '';
    
    if (hasSecondaryDimension) {
        // Agrupar dados por dimensão secundária para criar grupos
        const groups: { [key: string]: { startIdx: number; endIdx: number; label: string } } = {};
        let currentGroupKey: string | null = null;
        
        chartData.forEach((item, idx) => {
            const secondaryLabelRaw = item.secondaryLabels[0] || '';
            const secondaryLabel = formatDimension(secondaryLabelRaw, secondaryDateFormat);
            
            if (currentGroupKey !== secondaryLabel) {
                // Finalizar grupo anterior
                if (currentGroupKey !== null && groups[currentGroupKey]) {
                    groups[currentGroupKey].endIdx = idx - 1;
                }
                // Iniciar novo grupo
                currentGroupKey = secondaryLabel;
                groups[secondaryLabel] = {
                    startIdx: idx,
                    endIdx: idx,
                    label: secondaryLabel
                };
            } else {
                // Continuar grupo atual
                groups[secondaryLabel].endIdx = idx;
            }
        });
        
        // Garantir que o último grupo tenha seu endIdx configurado
        if (currentGroupKey !== null && groups[currentGroupKey]) {
            groups[currentGroupKey].endIdx = chartData.length - 1;
        }
        
        // Posição do eixo X secundário (na parte superior) - labels agrupados como cabeçalhos
        // Similar ao exemplo: labels acima da área de plotagem, centralizados nos grupos
        // Usar uma posição fixa acima da primeira linha de medida para garantir alinhamento
        const labelY = 15; // Posição fixa no topo do SVG (dentro do topMargin)
        const firstMeasureRowTop = topMargin;
        const lastMeasureRowTop = topMargin + (measureCols.length - 1) * (measureRowHeight + spacingBetweenMeasures);
        const dividerLineTop = labelY + 20; // Começar abaixo dos labels (aumentado para não sobrepor)
        const dividerLineBottom = lastMeasureRowTop + measureRowHeight; // Até o fim do gráfico
        
        // Não renderizar linha de eixo superior (apenas labels agrupados)
        secondaryXAxisHtml = '';
        
        // Renderizar labels agrupadas (uma por grupo, centralizada no grupo)
        const groupEntries = Object.values(groups).sort((a, b) => a.startIdx - b.startIdx);
        groupEntries.forEach((group, groupIdx) => {
            // Calcular posições baseadas nas bordas do grupo (não centro das barras)
            // startX = borda esquerda da primeira barra do grupo
            const startX = leftMargin + group.startIdx * (barWidth + barSpacing);
            // endX = borda direita da última barra do grupo
            const endX = leftMargin + group.endIdx * (barWidth + barSpacing) + barWidth;
            // centerX = centro do grupo (entre as bordas)
            const centerX = (startX + endX) / 2;
            
            // Label centralizada no grupo (estilo cabeçalho de coluna)
            secondaryXAxisLabelsHtml += `
                <text 
                    x="${centerX}" 
                    y="${labelY}" 
                    text-anchor="middle"
                    font-size="${labelFontSize}"
                    fill="#374151"
                    font-weight="600"
                >${group.label}</text>
            `;
            
            // Adicionar linha divisória após cada grupo (exceto o último, se habilitado)
            if (groupIdx < groupEntries.length - 1 && showGridLines && dividerLinesBetweenGroups) {
                const dividerX = endX + barSpacing / 2; // Posição entre o último item deste grupo e o primeiro do próximo
                secondaryXAxisHtml += `
                    <line 
                        x1="${dividerX}" 
                        y1="${dividerLineTop}" 
                        x2="${dividerX}" 
                        y2="${dividerLineBottom}" 
                        stroke="${dividerLinesColor}" 
                        stroke-width="1"
                    />
                `;
            }
        });
    }
    
    // Labels do eixo X - apenas primeira dimensão (embaixo)
    const lastMeasureRowTop = topMargin + (measureCols.length - 1) * (measureRowHeight + spacingBetweenMeasures);
    
    const xAxisLabels = chartData.map((item, idx) => {
        const labelX = leftMargin + idx * (barWidth + barSpacing) + barWidth / 2;
        const primaryLabel = formatDimension(item.primaryLabel, primaryDateFormat);
        
        return `
            <text 
                x="${labelX}" 
                y="${lastMeasureRowTop + measureRowHeight + 30}" 
                text-anchor="middle"
                font-size="${labelFontSize}"
                fill="#374151"
                transform="rotate(-45 ${labelX} ${lastMeasureRowTop + measureRowHeight + 30})"
            >${primaryLabel}</text>
        `;
    }).join('');

    // Eixo X - apenas na última linha
    const xAxis = `
        <line 
            x1="${leftMargin}" 
            y1="${lastMeasureRowTop + measureRowHeight}" 
            x2="${leftMargin + plotAreaWidth}" 
            y2="${lastMeasureRowTop + measureRowHeight}" 
            stroke="#374151" 
            stroke-width="1.5"
        />
    `;

      // Ajustar estilo baseado nas configurações fitWidth e fitHeight
      // - Apenas fitWidth ativado: scroll vertical permitido, sem scroll horizontal
      // - Apenas fitHeight ativado: scroll horizontal permitido, sem scroll vertical
      // - Ambos ativados: sem scroll (overflow: hidden)
      // - Nenhum ativado: scroll em ambas direções (overflow: auto)
      let containerOverflow: string;
      if (fitWidth && fitHeight) {
          // Ambos ativados: sem scroll
          containerOverflow = 'overflow: hidden;';
      } else if (fitWidth) {
          // Apenas largura: scroll vertical permitido, horizontal bloqueado
          containerOverflow = 'overflow-x: hidden; overflow-y: auto;';
      } else if (fitHeight) {
          // Apenas altura: scroll horizontal permitido, vertical bloqueado
          containerOverflow = 'overflow-x: auto; overflow-y: hidden;';
      } else {
          // Nenhum ativado: scroll em ambas direções quando necessário
          containerOverflow = 'overflow: auto;';
      }
      
      // Quando não está em 100% da largura, garantir que o gráfico possa ser rolado
      // O wrapper interno deve ter largura fixa quando !fitWidth para permitir scroll horizontal
      // Quando fitHeight está ativo, a altura do wrapper deve ser 100% para preencher o container
      const wrapperStyle = !fitWidth
          ? `width: ${chartWidth}px; height: ${fitHeight ? '100%' : `${chartHeight}px`}; flex-shrink: 0;` 
          : 'width: 100%; height: 100%;';
      const containerStyle = `padding: 0; margin: 0; width: 100%; height: 100%; ${containerOverflow} display: flex; align-items: flex-start; justify-content: flex-start;`;
      
      const svgStyle = 'overflow: visible;';
      
      // Determinar dimensões do SVG - quando não está em fitWidth, usar tamanho fixo em pixels
      let svgWidth: string;
      let svgHeight: string;
      
      if (fitWidth && fitHeight) {
          svgWidth = '100%';
          svgHeight = '100%';
      } else if (fitWidth) {
          svgWidth = '100%';
          svgHeight = `${chartHeight}`;
      } else if (fitHeight) {
          // Quando altura está em 100%, largura mantém tamanho fixo (pode gerar scroll)
          svgWidth = `${chartWidth}px`;
          svgHeight = '100%';
      } else {
          // Quando nenhum está em 100%, usar tamanho fixo em pixels para forçar scroll
          svgWidth = `${chartWidth}px`;
          svgHeight = `${chartHeight}px`;
      }
      
      // Manter proporções para não esticar
      let preserveAspectRatio: string;
      if (fitWidth && !fitHeight) {
          preserveAspectRatio = 'none';
      } else if (fitHeight && !fitWidth) {
          preserveAspectRatio = 'none';
      } else if (!fitWidth && !fitHeight) {
          preserveAspectRatio = 'none';
      } else {
          preserveAspectRatio = 'xMidYMid meet';
      }
      
      const svgViewBox = `0 0 ${chartWidth} ${chartHeight}`;
      
          chartElement.innerHTML = `
        <div style="${containerStyle}">
            <div style="${wrapperStyle}">
                <svg width="${svgWidth}" height="${svgHeight}" viewBox="${svgViewBox}" style="${svgStyle}" preserveAspectRatio="${preserveAspectRatio}">
                    ${secondaryXAxisHtml}
                    ${secondaryXAxisLabelsHtml}
                    ${yAxesHtml}
                    ${dividerLinesBetweenMeasuresHtml}
                    ${allChartElementsHtml}
                    ${xAxis}
                    ${xAxisLabels}
                </svg>
            </div>
            </div>
          `;

      // Quando fitWidth ou fitHeight está ativo, ajustar dinamicamente após renderizar
      if (fitWidth || fitHeight) {
          // Limpar observer anterior se existir
          if (chartElement.__resizeObserver) {
              chartElement.__resizeObserver.disconnect();
          }
          
          const containerDiv = chartElement.querySelector('div') as HTMLElement;
          const wrapperDiv = containerDiv?.querySelector('div') as HTMLElement;
          
          if (containerDiv && wrapperDiv) {
              // Função para recalcular e re-renderizar com dimensões ajustadas
              const adjustDimensions = () => {
                  const containerWidth = containerDiv.clientWidth;
                  const containerHeight = containerDiv.clientHeight;
                  
                  // Quando apenas fitHeight está ativo, manter largura fixa baseada na configuração (pode mudar se barWidth mudar)
                  // Quando fitWidth está ativo, recalcular largura para preencher container
                  let newChartWidth = chartWidth; // Iniciar com largura atual
                  let newChartHeight = chartHeight;
                  let newMeasureRowHeight = measureRowHeight;
                  let shouldUpdate = false;
                  
                  // Ajustar largura apenas se fitWidth está ativo
                  if (fitWidth && containerWidth > 0 && containerWidth !== chartWidth) {
                      newChartWidth = containerWidth;
                      shouldUpdate = true;
                  } else if (!fitWidth) {
                      // Quando fitWidth não está ativo, recalcular largura baseada na largura fixa das barras
                      // Isso garante que se o usuário mudar a largura da barra, o chartWidth seja atualizado
                      const numBars = chartData.length;
                      const totalBarWidth = fixedBarWidth * numBars;
                      const totalBarSpacing = (showYAxis ? 20 : 15) * (numBars - 1);
                      const plotAreaWidth = totalBarWidth + totalBarSpacing;
                      newChartWidth = plotAreaWidth + leftMargin + rightMargin;
                      
                      // Se a largura mudou, precisamos atualizar
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
                  // Quando apenas fitHeight está ativo, usar valores originais (não recalcular)
                  // Quando fitWidth está ativo, recalcular para preencher o espaço
                  let newBarWidth: number = barWidth; // Inicializar com valores originais
                  let newBarSpacing: number = barSpacing; // Inicializar com valores originais
                  
                  if (fitWidth && (shouldUpdate || containerWidth > 0)) {
                      // Quando fitWidth está ativo, recalcular largura para preencher todo o espaço
                      const newPlotAreaWidth = newChartWidth - leftMargin - rightMargin;
                      newBarSpacing = showYAxis ? 20 : Math.max(15, newPlotAreaWidth / (numBars * 3));
                      const newTotalSpacing = newBarSpacing * (numBars - 1);
                      newBarWidth = showYAxis ? 40 : Math.max(30, (newPlotAreaWidth - newTotalSpacing) / numBars);
                  }
                  
                  // Se há mudanças para aplicar (altura ou largura), recalcular posições
                  if (shouldUpdate || (fitWidth && containerWidth > 0)) {
                      // Quando apenas fitHeight está ativo, usar plotAreaWidth original; quando fitWidth está ativo, recalcular
                      const newPlotAreaWidth = (!fitWidth) ? plotAreaWidth : (newChartWidth - leftMargin - rightMargin);
                      
                      // Recalcular posições de todos os elementos com nova altura da linha
                      const newYAxesHtml = measureRanges.map((range, measureIdx) => {
                          const measureRowTop = topMargin + measureIdx * (newMeasureRowHeight + spacingBetweenMeasures);
                          const axisX = leftMargin - 10;

                          const yAxisLine = `
                              <line 
                                  x1="${axisX}" 
                                  y1="${measureRowTop}" 
                                  x2="${axisX}" 
                                  y2="${measureRowTop + newMeasureRowHeight}" 
                                  stroke="#374151" 
                                  stroke-width="1.5"
                              />
                          `;
                          
                          // Centralizar o título no espaço configurável para as labels
                          const titleX = measureLabelSpace / 2;
                          const titleY = measureRowTop + newMeasureRowHeight / 2;
                          const measureTitle = `
                              <text 
                                  x="${titleX}" 
                                  y="${titleY}" 
                                  text-anchor="middle"
                                  font-size="${measureTitleFontSize}"
                                  fill="#374151"
                                  font-weight="500"
                                  transform="rotate(${measureNameRotation} ${titleX} ${titleY})"
                              >${range.measure.name}</text>
                          `;
                          
                          if (!showYAxis) {
                              return measureTitle;
                          }
                          
                          return yAxisLine + measureTitle;
                      }).join('');

                      // Linhas divisórias horizontais entre medidas (se habilitado)
                      let newDividerLinesBetweenMeasuresHtml = '';
                      if (showGridLines && dividerLinesBetweenMeasures && measureCols.length > 1) {
                          for (let measureIdx = 0; measureIdx < measureCols.length - 1; measureIdx++) {
                              const measureRowTop = topMargin + measureIdx * (newMeasureRowHeight + spacingBetweenMeasures);
                              const dividerY = measureRowTop + newMeasureRowHeight + spacingBetweenMeasures / 2;
                              newDividerLinesBetweenMeasuresHtml += `
                                  <line 
                                      x1="${leftMargin}" 
                                      y1="${dividerY}" 
                                      x2="${leftMargin + newPlotAreaWidth}" 
                                      y2="${dividerY}" 
                                      stroke="${dividerLinesColor}" 
                                      stroke-width="1"
                                  />
                              `;
                          }
                      }
                      
                      // Linhas divisórias verticais entre barras (se habilitado)
                      let newDividerLinesBetweenBarsHtml = '';
                      if (showGridLines && dividerLinesBetweenBars && chartData.length > 1) {
                          for (let barIdx = 0; barIdx < chartData.length - 1; barIdx++) {
                              const barX = leftMargin + (barIdx + 1) * (newBarWidth + newBarSpacing) - newBarSpacing / 2;
                              const dividerStartY = topMargin;
                              const lastMeasureRowTop = topMargin + (measureCols.length - 1) * (newMeasureRowHeight + spacingBetweenMeasures);
                              const dividerEndY = lastMeasureRowTop + newMeasureRowHeight;
                              newDividerLinesBetweenBarsHtml += `
                                  <line 
                                      x1="${barX}" 
                                      y1="${dividerStartY}" 
                                      x2="${barX}" 
                                      y2="${dividerEndY}" 
                                      stroke="${dividerLinesColor}" 
                                      stroke-width="1"
                                  />
                              `;
                          }
                      }
                      
                      // Recalcular barras/linhas com novo espaçamento e altura
                      const newAllChartElementsHtml = measureCols.map((measure, measureIdx) => {
                          const measureRowTop = topMargin + measureIdx * (newMeasureRowHeight + spacingBetweenMeasures);
                          const { min: minValue, max: maxValue } = measureRanges[measureIdx];
                          const measureConfig = measureConfigs[measureIdx];
                          const chartType = measureConfig.chartType || 'bar';
                          
                          if (chartType === 'line') {
                              const points = chartData.map((item, itemIdx) => {
                                  const value = item.values[measureIdx] || 0;
                                  const x = leftMargin + itemIdx * (newBarWidth + newBarSpacing) + newBarWidth / 2;
                                  const y = valueToY(value, minValue, maxValue, measureRowTop, newMeasureRowHeight);
                                  return { x, y, value };
                              });
                              
                              const pathData = points.map((point, idx) => 
                                  `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                              ).join(' ');
                              
                              const circles = points.map(point => `
                                  <circle 
                                      cx="${point.x}" 
                                      cy="${point.y}" 
                                      r="4" 
                                      fill="${measureConfig.color}" 
                                      stroke="white" 
                                      stroke-width="2"
                                  />
                                  <text 
                                      x="${point.x}" 
                                      y="${point.y - 8}" 
                                      text-anchor="middle"
                                      font-size="9"
                                      fill="#374151"
                                      font-weight="500"
                                  >${formatValue(point.value, measureConfig.format, measureConfig.decimals)}</text>
                              `).join('');
                              
                              return `
                                  <g>
                                      <path 
                                          d="${pathData}"
                                          stroke="${measureConfig.color}"
                                          stroke-width="2"
                                          fill="none"
                                          opacity="0.8"
                                      />
                                      ${circles}
                                  </g>
                              `;
                          } else {
                              const barsForMeasure = chartData.map((item, itemIdx) => {
                                  const value = item.values[measureIdx] || 0;
                                  const barX = leftMargin + itemIdx * (newBarWidth + newBarSpacing);
                                  
                                  const valueY = valueToY(value, minValue, maxValue, measureRowTop, newMeasureRowHeight);
                                  const baseY = valueToY(Math.max(0, minValue), minValue, maxValue, measureRowTop, newMeasureRowHeight);
                                  
                                  const barHeight = Math.abs(valueY - baseY);
                                  const barY = Math.min(valueY, baseY);
                                  
                                  return `
                                      <g>
                                          <rect 
                                              x="${barX}" 
                                              y="${barY}" 
                                              width="${newBarWidth}" 
                                              height="${barHeight}"
                                              fill="${measureConfig.color}"
                                              opacity="0.9"
                                          />
                                          ${(barHeight > 15 || forceLabels) ? `
                                          <text 
                                              x="${barX + newBarWidth / 2}" 
                                              y="${barY - 5}" 
                                              text-anchor="middle"
                                              font-size="9"
                                              fill="#374151"
                                              font-weight="500"
                                          >${formatValue(value, measureConfig.format, measureConfig.decimals)}</text>
                                          ` : ''}
                                      </g>
                                  `;
                              }).join('');
                              
                              return barsForMeasure;
                          }
                      }).join('');
                      
                      // Recalcular labels do eixo X - suporta múltiplas dimensões em formato hierárquico
                      const lastMeasureRowTop = topMargin + (measureCols.length - 1) * (newMeasureRowHeight + spacingBetweenMeasures);
                      
                      let newXAxisLabels = '';
                      let newSecondaryXAxisHtml = '';
                      let newSecondaryXAxisLabelsHtml = '';
                      
                      // Se houver duas dimensões, renderizar segundo eixo X na parte superior
                      if (secondaryDimensions.length >= 1) {
                          // Agrupar dados por dimensão secundária para criar grupos
                          const groups: { [key: string]: { startIdx: number; endIdx: number; label: string } } = {};
                          let currentGroupKey: string | null = null;
                          
                          chartData.forEach((item, idx) => {
                              const secondaryLabelRaw = item.secondaryLabels[0] || '';
                              const secondaryLabel = formatDimension(secondaryLabelRaw, secondaryDateFormat);
                              
                              if (currentGroupKey !== secondaryLabel) {
                                  if (currentGroupKey !== null && groups[currentGroupKey]) {
                                      groups[currentGroupKey].endIdx = idx - 1;
                                  }
                                  currentGroupKey = secondaryLabel;
                                  groups[secondaryLabel] = {
                                      startIdx: idx,
                                      endIdx: idx,
                                      label: secondaryLabel
                                  };
                              } else {
                                  groups[secondaryLabel].endIdx = idx;
                              }
                          });
                          
                          if (currentGroupKey !== null && groups[currentGroupKey]) {
                              groups[currentGroupKey].endIdx = chartData.length - 1;
                          }
                          
                          // Posição do eixo X secundário (na parte superior) - labels agrupados como cabeçalhos
                          // Similar ao exemplo: labels acima da área de plotagem, centralizados nos grupos
                          // Posição fixa no topo do SVG (dentro do topMargin)
                          const secondaryLabelY = 15;
                          const dividerLineTop = secondaryLabelY + 20; // Começar abaixo dos labels (aumentado para não sobrepor)
                          const dividerLineBottom = lastMeasureRowTop + newMeasureRowHeight; // Até o fim do gráfico
                          
                          // Não renderizar linha de eixo superior (apenas labels agrupados)
                          newSecondaryXAxisHtml = '';
                          
                          // Renderizar labels agrupadas (uma por grupo, centralizada no grupo)
                          const groupEntries = Object.values(groups).sort((a, b) => a.startIdx - b.startIdx);
                          newSecondaryXAxisLabelsHtml = groupEntries.map((group, groupIdx) => {
                              // Calcular posições baseadas nas bordas do grupo (não centro das barras)
                              // startX = borda esquerda da primeira barra do grupo
                              const startX = leftMargin + group.startIdx * (newBarWidth + newBarSpacing);
                              // endX = borda direita da última barra do grupo
                              const endX = leftMargin + group.endIdx * (newBarWidth + newBarSpacing) + newBarWidth;
                              // centerX = centro do grupo (entre as bordas)
                              const centerX = (startX + endX) / 2;
                              
                              let html = `
                                  <text 
                                      x="${centerX}" 
                                      y="${secondaryLabelY}" 
                                      text-anchor="middle"
                                      font-size="${labelFontSize}"
                                      fill="#374151"
                                      font-weight="600"
                                  >${group.label}</text>
                              `;
                              
                              // Adicionar linha divisória após cada grupo (exceto o último)
                              if (groupIdx < groupEntries.length - 1) {
                                  const dividerX = endX + newBarSpacing / 2; // Posição entre o último item deste grupo e o primeiro do próximo
                                  html += `
                                      <line 
                                          x1="${dividerX}" 
                                          y1="${dividerLineTop}" 
                                          x2="${dividerX}" 
                                          y2="${dividerLineBottom}" 
                                          stroke="#d1d5db" 
                                          stroke-width="1"
                                      />
                                  `;
                              }
                              
                              return html;
                          }).join('');
                          
                          // Renderizar apenas Dimensão 1 embaixo (segundo eixo X já está acima)
                          const primaryLabelsHtml = chartData.map((item, idx) => {
                              const labelX = leftMargin + idx * (newBarWidth + newBarSpacing) + newBarWidth / 2;
                              const primaryLabel = formatDimension(item.primaryLabel, primaryDateFormat);
                              
                              return `
                                  <text 
                                      x="${labelX}" 
                                      y="${lastMeasureRowTop + newMeasureRowHeight + 30}" 
                                      text-anchor="middle"
                                      font-size="${labelFontSize}"
                                      fill="#374151"
                                      transform="rotate(-45 ${labelX} ${lastMeasureRowTop + newMeasureRowHeight + 30})"
                                  >${primaryLabel}</text>
                              `;
                          }).join('');
                          
                          newXAxisLabels = primaryLabelsHtml;
                      } else {
                          // Apenas uma dimensão - renderizar normalmente
                          newSecondaryXAxisHtml = '';
                          newSecondaryXAxisLabelsHtml = '';
                          newXAxisLabels = chartData.map((item, idx) => {
                              const labelX = leftMargin + idx * (newBarWidth + newBarSpacing) + newBarWidth / 2;
                              const primaryLabel = formatDimension(item.primaryLabel, primaryDateFormat);
                              
                              return `
                                  <text 
                                      x="${labelX}" 
                                      y="${lastMeasureRowTop + newMeasureRowHeight + 30}" 
                                      text-anchor="middle"
                                      font-size="${labelFontSize}"
                                      fill="#374151"
                                      transform="rotate(-45 ${labelX} ${lastMeasureRowTop + newMeasureRowHeight + 30})"
                                  >${primaryLabel}</text>
                              `;
                          }).join('');
                      }
                      
                      // Recalcular eixo X
                      const newXAxis = `
                          <line 
                              x1="${leftMargin}" 
                              y1="${lastMeasureRowTop + newMeasureRowHeight}" 
                              x2="${leftMargin + newPlotAreaWidth}" 
                              y2="${lastMeasureRowTop + newMeasureRowHeight}"
                              stroke="#374151" 
                              stroke-width="1.5"
                          />
                      `;
                      
                      // Atualizar wrapper e SVG com novos valores
                      if (wrapperDiv && !fitWidth) {
                          // Quando não está em 100% da largura, manter largura fixa para permitir scroll horizontal
                          // Sempre atualizar a largura do wrapper para refletir mudanças na largura das barras
                          wrapperDiv.style.width = `${newChartWidth}px`;
                          // Quando fitHeight está ativo, usar 100% de altura, senão usar altura fixa
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
      }

    logger.debug('✅ Gráfico renderizado com sucesso');
    
    // Emitir evento RenderComplete para o ThoughtSpot saber que terminou
    // RenderComplete não precisa de payload (array vazio no tipo)
    try {
        ctx.emitEvent(ChartToTSEvent.RenderComplete);
        logger.debug('✅ [DEBUG] Evento RenderComplete emitido');
        } catch (error) {
        logger.warn('Erro ao emitir RenderComplete:', error);
    }
    
    return Promise.resolve();
};

// Inicialização seguindo EXATAMENTE o exemplo do Bar Chart oficial do repositório
const init = async () => {
    logger.debug('🚀 [DEBUG] Iniciando getChartContext...');
    
    try {
        const ctx = await getChartContext({
            getDefaultChartConfig: (chartModel: ChartModel): ChartConfig[] => {
                logger.debug('📊 [DEBUG] ===== getDefaultChartConfig CHAMADO =====');
                logger.debug('📊 [DEBUG] chartModel.columns.length:', chartModel.columns?.length);
                
                const cols = chartModel.columns;

                const measureColumns = cols.filter(
                    (col) => col.type === ColumnType.MEASURE,
                );

                const attributeColumns = cols.filter(
                    (col) => col.type === ColumnType.ATTRIBUTE,
                );

                logger.debug('📊 [DEBUG] Medidas encontradas no chartModel:', measureColumns.length);
                logger.debug('📊 [DEBUG] Nomes das medidas:', measureColumns.map(m => ({ id: m.id, name: m.name })));
                logger.debug('📊 [DEBUG] Dimensões encontradas:', attributeColumns.length);
                logger.debug('📊 [DEBUG] Nomes das dimensões:', attributeColumns.map(d => ({ id: d.id, name: d.name })));

                if (attributeColumns.length === 0 || measureColumns.length === 0) {
                    logger.debug('Sem colunas válidas, retornando []');
                    return [];
                }

                // Incluir TODAS as dimensões para suportar múltiplas dimensões (ex: Data e Turno)
                // IMPORTANTE: Incluir TODAS as medidas para que a query busque dados de todas elas
                const axisConfig: ChartConfig = {
                    key: 'column',
                    dimensions: [
                        {
                            key: 'x',
                            columns: attributeColumns, // Incluir todas as dimensões
                        },
                        {
                            key: 'y',
                            columns: measureColumns, // Incluir TODAS as medidas - isso é crítico!
                        },
                    ],
                };
                
                logger.debug('📊 [DEBUG] ChartConfig gerado com', measureColumns.length, 'medidas e', attributeColumns.length, 'dimensões');
                logger.debug('📊 [DEBUG] ===== FIM getDefaultChartConfig =====');
                return [axisConfig];
            },
        getQueriesFromChartConfig: (
            chartConfig: ChartConfig[],
        ): Array<Query> => {
            logger.debug('📤 [DEBUG] getQueriesFromChartConfig chamado');
            logger.debug('📤 [DEBUG] chartConfig recebido:', JSON.stringify(chartConfig, null, 2));
            
            // Contar medidas no chartConfig para detectar possíveis problemas
            const measuresInConfig = chartConfig.flatMap(config => 
                config.dimensions.find(d => d.key === 'y')?.columns || []
            );
            logger.debug(`📤 [DEBUG] Medidas no chartConfig: ${measuresInConfig.length}`, 
                measuresInConfig.map(m => ({ id: m.id, name: m.name })));
            
            // ⚠️ AVISO CRÍTICO: Se getQueriesFromChartConfig está sendo chamado mas getDefaultChartConfig
            // não foi chamado recentemente quando uma nova medida foi adicionada, o chartConfig estará
            // desatualizado (em cache) e a nova medida não será incluída na query.
            // Isso é uma limitação do ThoughtSpot que usa cache do ChartConfig.
            // SOLUÇÃO: O usuário deve mudar qualquer configuração do gráfico (ex: toggles) para forçar
            // o ThoughtSpot a re-executar getDefaultChartConfig.
            
            // map all the columns in the config to the query array
            const queries = chartConfig.map(
                (config: ChartConfig): Query =>
                    _.reduce(
                        config.dimensions,
                        (acc: Query, dimension) => ({
                            queryColumns: [
                                ...acc.queryColumns,
                                ...dimension.columns,
                            ],
                        }),
                        {
                            queryColumns: [],
                        } as Query,
                    ),
            );
            
            logger.debug('📤 [DEBUG] Queries geradas:', JSON.stringify(queries, null, 2));
            logger.debug('📤 [DEBUG] Total de queries:', queries.length);
            queries.forEach((q, idx) => {
                logger.debug(`📤 [DEBUG] Query ${idx} tem ${q.queryColumns?.length || 0} colunas`);
                const measureCols = q.queryColumns.filter(col => col.type === ColumnType.MEASURE);
                logger.debug(`📤 [DEBUG] Query ${idx} - Medidas incluídas: ${measureCols.length}`, 
                    measureCols.map(m => ({ id: m.id, name: m.name })));
            });
            
            return queries;
        },
        visualPropEditorDefinition: (
            currentVisualProps: ChartModel,
            ctx: CustomChartContext,
        ): VisualPropEditorDefinition => {
            logger.debug('🎨 [DEBUG] visualPropEditorDefinition chamado');
            logger.debug('🎨 [DEBUG] currentVisualProps:', currentVisualProps);
            
            const columns = currentVisualProps.columns || [];
            const measureColumns = columns.filter((col: ChartColumn) => col.type === ColumnType.MEASURE);
            const dimensionColumns = columns.filter((col: ChartColumn) => col.type === ColumnType.ATTRIBUTE);
            
            logger.debug('🎨 [DEBUG] Medidas encontradas para configuração:', measureColumns.map((m: ChartColumn) => m.name));
            logger.debug('🎨 [DEBUG] Dimensões encontradas para configuração:', dimensionColumns.map((d: ChartColumn) => d.name));
            
            // Criar configurações por coluna (medida)
            // Colocar diretamente em elements para aparecer no painel principal
            const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];
            const elements: any[] = [];
            
            // Seção para opções globais do gráfico
            const savedChartOptions = (currentVisualProps.visualProps as any)?.chart_options || {};
            
            // Seção 1: Layout e Visualização
            const chartVisualChildren: any[] = [
                {
                    type: 'toggle',
                    key: 'showYAxis',
                    label: 'Mostrar Eixo Y',
                    defaultValue: savedChartOptions?.showYAxis !== false, // Default: true
                },
                {
                    type: 'toggle',
                    key: 'showGridLines',
                    label: 'Mostrar Linhas Divisórias',
                    defaultValue: savedChartOptions?.showGridLines !== false, // Default: true
                },
            ];
            
            // Adicionar campos adicionais
            chartVisualChildren.push(
                {
                    type: 'dropdown',
                    key: 'measureNameRotation',
                    label: 'Rotação do Nome da Medida',
                    defaultValue: savedChartOptions?.measureNameRotation || '-90',
                    values: [
                        '-90',
                        '0',
                        '45',
                        '-45',
                        '90',
                    ],
                },
                {
                    type: 'toggle',
                    key: 'forceLabels',
                    label: 'Forçar Labels',
                    defaultValue: savedChartOptions?.forceLabels || false, // Default: false
                }
            );
            
            elements.push({
                type: 'section',
                key: 'chart_visual',
                label: 'Layout e Visualização',
                isAccordianExpanded: true,
                children: chartVisualChildren,
            });
            
            // Seção de Linhas Divisórias (subgrupo condicional)
            if (savedChartOptions?.showGridLines !== false) {
                elements.push({
                    type: 'section',
                    key: 'chart_divider_lines',
                    label: 'Configurações de Linhas Divisórias',
                    isAccordianExpanded: false,
                    children: [
                        {
                            type: 'toggle',
                            key: 'dividerLinesBetweenMeasures',
                            label: 'Linhas entre Medidas',
                            defaultValue: savedChartOptions?.dividerLinesBetweenMeasures !== false, // Default: true
                        },
                        {
                            type: 'toggle',
                            key: 'dividerLinesBetweenGroups',
                            label: 'Linhas entre Grupos',
                            defaultValue: savedChartOptions?.dividerLinesBetweenGroups !== false, // Default: true
                        },
                        {
                            type: 'toggle',
                            key: 'dividerLinesBetweenBars',
                            label: 'Linhas entre Barras',
                            defaultValue: savedChartOptions?.dividerLinesBetweenBars || false, // Default: false
                        },
                        {
                            type: 'text',
                            key: 'dividerLinesColor',
                            label: 'Cor das Linhas Divisórias',
                            defaultValue: savedChartOptions?.dividerLinesColor || '#d1d5db',
                        },
                    ],
                });
            }
            
            // Seção 2: Dimensões e Tamanhos
            elements.push({
                type: 'section',
                key: 'chart_dimensions',
                label: 'Dimensões e Tamanhos',
                isAccordianExpanded: false,
                children: [
                    {
                        type: 'toggle',
                        key: 'fitWidth',
                        label: 'Ajustar a 100% da Largura',
                        defaultValue: savedChartOptions?.fitWidth || false, // Default: false
                    },
                    {
                        type: 'toggle',
                        key: 'fitHeight',
                        label: 'Ajustar a 100% da Altura',
                        defaultValue: savedChartOptions?.fitHeight || false, // Default: false
                    },
                    {
                        type: 'number',
                        key: 'measureLabelSpace',
                        label: 'Espaço das Labels das Medidas (px)',
                        defaultValue: savedChartOptions?.measureLabelSpace ?? (savedChartOptions?.showYAxis !== false ? 120 : 60),
                    },
                    // Campo de largura da barra - só aparece se fitWidth não está ativo
                    ...(savedChartOptions?.fitWidth ? [] : [{
                        type: 'number',
                        key: 'barWidth',
                        label: 'Largura da Barra (px)',
                        defaultValue: savedChartOptions?.barWidth ?? 40,
                    }]),
                    // Campo de altura da linha - só aparece se fitHeight não está ativo
                    ...(savedChartOptions?.fitHeight ? [] : [{
                        type: 'number',
                        key: 'measureRowHeight',
                        label: 'Altura da Linha (px)',
                        defaultValue: savedChartOptions?.measureRowHeight ?? 50,
                    }]),
                ],
            });
            
            // Seção para configuração de tamanhos de texto
            const savedTextSizes = (currentVisualProps.visualProps as any)?.text_sizes || {};
            elements.push({
                type: 'section',
                key: 'text_sizes',
                label: 'Tamanhos de Texto',
                isAccordianExpanded: false,
                children: [
                    {
                        type: 'number',
                        key: 'labelFontSize',
                        label: 'Tamanho da Dimensão (px)',
                        defaultValue: savedTextSizes?.labelFontSize ?? 10,
                    },
                    {
                        type: 'number',
                        key: 'measureTitleFontSize',
                        label: 'Tamanho das Medidas (px)',
                        defaultValue: savedTextSizes?.measureTitleFontSize ?? 10,
                    },
                    {
                        type: 'number',
                        key: 'valueLabelFontSize',
                        label: 'Tamanho dos Valores (px)',
                        defaultValue: savedTextSizes?.valueLabelFontSize ?? 9,
                    },
                ],
            });
            
            // HIPÓTESE: Adicionar uma dependência explícita das colunas nos elements
            // para forçar o ThoughtSpot a detectar mudanças e re-executar getDefaultChartConfig.
            // Adicionando campos que dependem do número de medidas/dimensões faz com que
            // o resultado do visualPropEditorDefinition mude quando as colunas mudam,
            // potencialmente forçando o ThoughtSpot a re-executar getDefaultChartConfig.
            const measureCount = measureColumns.length;
            const dimensionCount = dimensionColumns.length;
            
            // Criar configurações por coluna para aparecer na aba "Configure"
            const columnsVizPropDefinition: ColumnProp[] = [];
            
            if (measureColumns.length > 0) {
                // Preparar configurações por medida para columnsVizPropDefinition
                const measureColumnSettings: { [columnId: string]: { elements: any[] } } = {};
                
                measureColumns.forEach((measure: ChartColumn, idx: number) => {
                    const defaultColor = defaultColors[idx % defaultColors.length];
                    // Ler configurações salvas - tentar ambos os formatos para compatibilidade
                    const savedConfigOld = (currentVisualProps.visualProps as any)?.[`measure_${measure.id}`];
                    const savedConfigNew = (currentVisualProps.visualProps as any)?.[measure.id];
                    const savedConfig = savedConfigNew || savedConfigOld || {};
                    
                    measureColumnSettings[measure.id] = {
                        elements: [
                            {
                                type: 'dropdown',
                                key: 'chartType',
                                label: 'Tipo de Gráfico',
                                defaultValue: savedConfig?.chartType || 'bar',
                                values: [
                                    'bar',
                                    'line',
                                ],
                            },
                            {
                                type: 'colorpicker',
                                key: 'color',
                                label: 'Cor',
                                selectorType: 'COLOR',
                                defaultValue: savedConfig?.color || defaultColor,
                            },
                            {
                                type: 'dropdown',
                                key: 'format',
                                label: 'Formato do Número',
                                defaultValue: savedConfig?.format || 'decimal',
                                values: [
                                    'decimal',
                                    'porcentagem',
                                    'moeda',
                                    'científico',
                                    'inteiro',
                                ],
                            },
                            {
                                type: 'number',
                                key: 'decimals',
                                label: 'Casas Decimais',
                                defaultValue: savedConfig?.decimals ?? 2,
                            },
                        ],
                    };
                });
                
                // Adicionar configurações de medidas ao columnsVizPropDefinition
                if (Object.keys(measureColumnSettings).length > 0) {
                    columnsVizPropDefinition.push({
                        type: ColumnType.MEASURE,
                        columnSettingsDefinition: measureColumnSettings,
                    });
                }
            }
            
            // Adicionar configurações de dimensões ao columnsVizPropDefinition (para aparecer na aba Configure)
            if (dimensionColumns.length > 0) {
                const dimensionColumnSettings: { [columnId: string]: { elements: any[] } } = {};
                
                // Função helper para verificar se uma coluna é do tipo data
                const isDateColumn = (column: ChartColumn): boolean => {
                    const colAny = column as any;
                    
                    // Verificar dataType: 7 geralmente indica DATE/TIMESTAMP
                    if (colAny.dataType === 7) {
                        return true;
                    }
                    
                    // Verificar se tem format com pattern de data
                    const format = colAny.format;
                    if (format && format.pattern) {
                        // Padrões típicos de data (dd, MM, yyyy, HH, mm, ss)
                        const datePatterns = /(dd|MM|yyyy|HH|mm|ss)/i;
                        if (datePatterns.test(format.pattern)) {
                            return true;
                        }
                    }
                    
                    // Verificar se tem timeBucket > 0 (indica série temporal/data agregada)
                    if (colAny.timeBucket && colAny.timeBucket > 0) {
                        return true;
                    }
                    
                    // Verificar se o nome da coluna sugere data (ex: "Day", "Date", "Time")
                    const nameLower = (column.name || '').toLowerCase();
                    if (nameLower.includes('date') || nameLower.includes('day') || 
                        nameLower.includes('time') || nameLower.includes('hour')) {
                        // Mas só retornar true se realmente for data (não apenas texto que contenha essas palavras)
                        // Confiar mais em dataType e format
                        return false;
                    }
                    
                    return false;
                };
                
                dimensionColumns.forEach((dimension: ChartColumn) => {
                    // Ler configurações salvas - tentar ambos os formatos para compatibilidade
                    const savedConfigOld = (currentVisualProps.visualProps as any)?.[`dimension_${dimension.id}`];
                    const savedConfigNew = (currentVisualProps.visualProps as any)?.[dimension.id];
                    const savedConfigGlobal = (currentVisualProps.visualProps as any)?.dimension_formatting || {};
                    const savedConfig = savedConfigNew || savedConfigOld || savedConfigGlobal;
                    
                    const elements: any[] = [];
                    
                    // Adicionar configuração de formatação de data APENAS se a coluna for do tipo data
                    if (isDateColumn(dimension)) {
                        elements.push({
                            type: 'dropdown',
                            key: 'dateFormat',
                            label: 'Formato de Data/Hora',
                            defaultValue: savedConfig?.dateFormat || 'auto',
                            values: [
                                'auto',
                                'dd/MM/yyyy',
                                'dd-MM-yyyy',
                                'yyyy-MM-dd',
                                'dd/MM/yyyy HH:mm',
                                'dd/MM/yyyy HH:mm:ss',
                                'dia',
                                'mês',
                                'ano',
                                'hora',
                            ],
                        });
                    }
                    
                    // Só adicionar configurações se houver elementos
                    if (elements.length > 0) {
                        dimensionColumnSettings[dimension.id] = {
                            elements,
                        };
                    }
                });
                
                // Adicionar configurações de dimensões ao columnsVizPropDefinition
                if (Object.keys(dimensionColumnSettings).length > 0) {
                    columnsVizPropDefinition.push({
                        type: ColumnType.ATTRIBUTE,
                        columnSettingsDefinition: dimensionColumnSettings,
                    });
                }
            }
            
            // IMPORTANTE: Criar uma "assinatura" baseada nas colunas para forçar o ThoughtSpot
            // a re-executar getDefaultChartConfig quando as colunas mudarem.
            const columnIds = columns.map(col => col.id).sort();
            const columnSignature = columnIds.join(',');
            const measureIds = measureColumns.map(m => m.id).sort();
            const measureSignature = measureIds.join(',');
            
            logger.debug('🎨 [DEBUG] ===== ASSINATURA DAS COLUNAS =====');
            logger.debug('🎨 [DEBUG] Total de colunas:', columns.length);
            logger.debug('🎨 [DEBUG] Total de medidas:', measureColumns.length);
            logger.debug('🎨 [DEBUG] Total de dimensões:', dimensionColumns.length);
            logger.debug('🎨 [DEBUG] IDs das medidas:', measureIds);
            logger.debug('🎨 [DEBUG] Assinatura das colunas:', columnSignature);
            logger.debug('🎨 [DEBUG] Assinatura das medidas:', measureSignature);
            
            // Retornar definição de propriedades visuais
            // elements: Configurações globais (aba Settings)
            // columnsVizPropDefinition: Configurações por coluna (aba Configure)
            // 
            // HIPÓTESE: O uso de columnsVizPropDefinition (que depende explicitamente das colunas)
            // pode ajudar o ThoughtSpot a detectar mudanças nas colunas e re-executar getDefaultChartConfig.
            // O columnsVizPropDefinition já está sendo usado e muda quando as colunas mudam,
            // mas o ThoughtSpot pode ainda não estar re-executando getDefaultChartConfig.
            const result: VisualPropEditorDefinition = {
                elements,
                ...(columnsVizPropDefinition.length > 0 && { columnsVizPropDefinition }),
            };
            
            logger.debug('🎨 [DEBUG] visualPropEditorDefinition retornando:', JSON.stringify(result, null, 2));
            logger.debug('🎨 [DEBUG] columnsVizPropDefinition:', columnsVizPropDefinition.length > 0 ? 'SIM - ' + columnsVizPropDefinition.length + ' colunas' : 'NÃO');
            logger.debug('🎨 [DEBUG] Medidas processadas:', measureColumns.map(m => m.id));
            if (columnsVizPropDefinition.length > 0) {
                const measuresInConfig = Object.keys(columnsVizPropDefinition[0].columnSettingsDefinition || {}).length || 0;
                logger.debug('🎨 [DEBUG] Medidas no columnsVizPropDefinition:', measuresInConfig);
                logger.debug('🎨 [DEBUG] Estrutura columnsVizPropDefinition completa:', JSON.stringify(columnsVizPropDefinition, null, 2));
                logger.debug('🎨 [DEBUG] IDs das colunas nas configurações:', Object.keys(columnsVizPropDefinition[0].columnSettingsDefinition || {}));
                
                // AVISO: Se o número de medidas no columnsVizPropDefinition não corresponder
                // ao número de medidas no chartModel, pode indicar que getDefaultChartConfig
                // precisa ser re-executado.
                if (measureColumns.length !== measuresInConfig) {
                    logger.debug(`DISCREPÂNCIA DETECTADA: ${measureColumns.length} medidas no chartModel, mas ${measuresInConfig} medidas no columnsVizPropDefinition`);
                    logger.debug('Isso indica que getDefaultChartConfig precisa ser re-executado!');
                    logger.debug('Medidas no chartModel:', measureColumns.map(m => ({ id: m.id, name: m.name })));
                    logger.debug('IDs no columnsVizPropDefinition:', Object.keys(columnsVizPropDefinition[0].columnSettingsDefinition || {}));
                }
            }
            logger.debug('🎨 [DEBUG] ===== FIM visualPropEditorDefinition =====');
            
            return result;
        },
        chartConfigEditorDefinition: (): ChartConfigEditorDefinition[] => {
            // Criar estrutura similar ao Vitara para permitir que o ThoughtSpot detecte mudanças nas colunas
            // Isso pode fazer com que o ThoughtSpot re-execute getDefaultChartConfig quando novas colunas são adicionadas
            return [
                {
                    key: 'column',
                    label: 'Visual Attributes/Measures',
                    descriptionText: 'X-axis can only have attributes, Y-axis can only have measures.',
                    columnSections: [
                        {
                            key: 'x',
                            label: 'X Axis (Dimensions)',
                            allowAttributeColumns: true,
                            allowMeasureColumns: false,
                            allowTimeSeriesColumns: true,
                        },
                        {
                            key: 'y',
                            label: 'Y Axis (Measures)',
                            allowAttributeColumns: false,
                            allowMeasureColumns: true,
                            allowTimeSeriesColumns: false,
                        },
                    ],
                },
            ];
        },
        renderChart: (context) => {
            logger.debug('🎨 [DEBUG] renderChart chamado dentro do getChartContext');
            return renderChart(context);
        },
    });
    
    logger.debug('✅ [DEBUG] getChartContext concluído com sucesso');
    logger.debug('✅ [DEBUG] Contexto obtido:', ctx);
    
    // For initial load we need to call renderChart explicitly
    logger.debug('🔄 [DEBUG] Chamando renderChart explicitamente...');
    await renderChart(ctx);
    logger.debug('✅ [DEBUG] renderChart concluído');
    } catch (error) {
        logger.error('Erro no init:', error);
        logger.error('Stack:', error instanceof Error ? error.stack : 'N/A');
        throw error;
    }
};

init();
