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
import { logger } from './utils/logger';
import { 
    extractDataPointsArray, 
    createColumnIndexMap, 
    filterAndSortColumns,
    separateDimensionsAndMeasures,
    processChartData,
    findMissingMeasures
} from './utils/dataProcessing';
import {
    readChartOptions,
    readSavedValues,
    getSavedValue,
    type ChartOptions
} from './utils/options';
import { formatValue, formatDimension } from './utils/formatters';
import { valueToY, calculateMeasureRowTop, calculateLastMeasureRowTop } from './utils/calculations';
import { groupDataBySecondaryDimension, sortGroupsByStartIndex } from './utils/grouping';
import { renderLineChart, renderBars, type MeasureConfig } from './rendering/chartElements';
import { renderYAxes, renderXAxisLabels, renderXAxis } from './rendering/axes';
import { renderDividerLinesBetweenMeasures, renderDividerLinesBetweenBars } from './rendering/dividerLines';
import { renderSecondaryXAxis } from './rendering/secondaryAxis';
import { setupMissingMeasuresRetry } from './handlers/missingMeasuresHandler';

// Tornar renderChart disponível globalmente para o handler de medidas faltantes
declare global {
    interface Window {
        __renderChart?: (ctx: CustomChartContext) => Promise<void>;
    }
}
import { calculateChartDimensions, readMeasureConfigs, readDimensionFormats } from './utils/chartDimensions';
import { calculateMeasureRanges, type MeasureRange } from './utils/measureRanges';
import { getDefaultChartConfig, getQueriesFromChartConfig } from './config/chartConfig';
import type { TypedDataPointsArray, ChartElement, ChartDataPoint } from './types/chartTypes';

export const renderChart = async (ctx: CustomChartContext) => {
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
    const sortedDimensions = filterAndSortColumns(allDimensions, availableColumnIds, columnOrderMap);
    
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
    const primaryDimension = sortedDimensions[0];
    const secondaryDimensions = sortedDimensions.slice(1);
    const hasSecondaryDimension = secondaryDimensions.length >= 1;
    
    logger.debug('Dimensões (ordenadas pela ordem do Configure):', {
        primary: primaryDimension?.name,
        secondary: secondaryDimensions.map(d => d.name),
        total: sortedDimensions.length
    });
    
    logger.debug('renderChart - Column map:', columnIndexMap);
    logger.debug('renderChart - primaryDimension.id:', primaryDimension.id);
    logger.debug('renderChart - secondaryDimensions IDs:', secondaryDimensions.map(d => d.id));
    logger.debug('renderChart - measureCols IDs:', measureCols.map(m => m.id));
    logger.debug('renderChart - Colunas disponíveis nos dados:', dataArr.columns);
    logger.debug('renderChart - Dimensões (ordenadas pela ordem do Configure):', {
        primary: primaryDimension?.name,
        secondary: secondaryDimensions.map(d => d.name),
        total: sortedDimensions.length
    });
    
    // Verificar se todas as medidas estão nos dados e configurar retry se necessário
    const missingMeasures = findMissingMeasures(measureCols, columnIndexMap);
    if (missingMeasures.length > 0) {
        logger.warn('Medidas não encontradas nos dados (pode ser que os dados ainda estejam carregando):', 
            missingMeasures.map(m => ({ id: m.id, name: m.name })));
        logger.warn('Essas medidas aparecerão com valor 0 até que os dados sejam carregados');
        logger.warn('Colunas disponíveis nos dados:', dataArr.columns);
        logger.warn('IDs das medidas esperadas:', measureCols.map(m => ({ id: m.id, name: m.name })));
        
        await setupMissingMeasuresRetry(ctx, chartElement, missingMeasures);
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

    // Ler e consolidar todas as opções seguindo hierarquia correta
    const allVisualProps = visualProps as Record<string, unknown>;
    const chartOptions: ChartOptions = readChartOptions(allVisualProps);
    
    // Extrair opções do chartOptions
    const showYAxis = chartOptions.showYAxis !== false;
    const measureNameRotation = Number(chartOptions.measureNameRotation || '-90');
    const fitWidth = chartOptions.fitWidth || false;
    const fitHeight = chartOptions.fitHeight || false;
    const showGridLines = chartOptions.showGridLines !== false;
    const dividerLinesBetweenMeasures = chartOptions.dividerLinesBetweenMeasures !== false;
    const dividerLinesBetweenGroups = chartOptions.dividerLinesBetweenGroups !== false;
    const dividerLinesBetweenBars = chartOptions.dividerLinesBetweenBars !== false;
    const dividerLinesColor = chartOptions.dividerLinesColor || '#d1d5db';
    const forceLabels = chartOptions.forceLabels || false;
    
    // Tamanhos de fonte configuráveis
    const textSizes = (allVisualProps?.text_sizes || {}) as Record<string, unknown>;
    const labelFontSize = (textSizes?.labelFontSize as number) ?? 10;
    const measureTitleFontSize = (textSizes?.measureTitleFontSize as number) ?? 10;
    const valueLabelFontSize = (textSizes?.valueLabelFontSize as number) ?? 9;
    
    // Calcular dimensões do gráfico
    const chartDimensions = calculateChartDimensions(
        chartOptions,
        chartData,
        measureCols,
        hasSecondaryDimension,
        allVisualProps
    );
    
    let {
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
    } = chartDimensions;
    
    const numBars = chartData.length;

    // Ler configurações de formatação de dimensões
    const { primaryDateFormat, secondaryDateFormat } = readDimensionFormats(
        primaryDimension,
        secondaryDimensions,
        allVisualProps
    );
    
    // Ler configurações de medidas (cores, formatos, etc.)
    const measureConfigs = readMeasureConfigs(measureCols, allVisualProps);
    
    // Log apenas para primeira medida na primeira renderização
    if (!chartElement.__configLogged) {
        logger.debug('🔍 [DEBUG] === LEITURA DE CONFIGURAÇÕES ===');
        logger.debug('🔍 [DEBUG] Formatação de dimensão:', {
            primaryDimensionId: primaryDimension.id,
            primaryDateFormat: primaryDateFormat,
            secondaryDimensionId: hasSecondaryDimension && secondaryDimensions.length > 0 ? secondaryDimensions[0].id : null,
            secondaryDateFormat: secondaryDateFormat
        });
        chartElement.__configLogged = true;
    }
    
    logger.debug('🎨 [DEBUG] Configurações finais das medidas:', measureConfigs.map((c, i) => ({
        measure: measureCols[i].name,
        color: c.color,
        format: c.format,
        decimals: c.decimals,
        chartType: c.chartType
    })));

    // Calcular ranges (min/max) para cada medida
    const measureRanges = calculateMeasureRanges(chartData, measureCols);
    
    logger.debug('🎨 [DEBUG] measureRanges individuais:', measureRanges.map(r => ({
        measure: r.measure.name,
        min: r.min,
        max: r.max,
        originalMin: (r as MeasureRange & { originalMin?: number }).originalMin,
        originalMax: (r as MeasureRange & { originalMax?: number }).originalMax
    })));

    // Funções de renderização agora importadas de rendering/

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

    // Renderizar eixos Y individuais para cada medida
    const yAxesHtml = renderYAxes(
        measureRanges,
        measureCols,
        topMargin,
        measureRowHeight,
        spacingBetweenMeasures,
        leftMargin,
        measureLabelSpace,
        measureTitleFontSize,
        measureNameRotation,
        showYAxis
    );

    // Linhas divisórias horizontais entre medidas (se habilitado)
    const dividerLinesBetweenMeasuresHtml = (showGridLines && dividerLinesBetweenMeasures)
        ? renderDividerLinesBetweenMeasures(
            measureCols,
            topMargin,
            measureRowHeight,
            spacingBetweenMeasures,
            leftMargin,
            plotAreaWidth,
            dividerLinesColor
          )
        : '';
    
    // Linhas divisórias verticais entre barras (se habilitado)
    const dividerLinesBetweenBarsHtml = (showGridLines && dividerLinesBetweenBars)
        ? renderDividerLinesBetweenBars(
            chartData.length,
            leftMargin,
            barWidth,
            barSpacing,
            topMargin,
            measureCols,
            measureRowHeight,
            spacingBetweenMeasures,
            dividerLinesColor
          )
        : '';

    // Segundo eixo X (eixo X secundário) - segunda dimensão na parte superior
    let secondaryXAxisHtml = '';
    let secondaryXAxisLabelsHtml = '';
    
    if (hasSecondaryDimension) {
        const secondaryAxis = renderSecondaryXAxis(
            chartData,
            leftMargin,
            barWidth,
            barSpacing,
            measureCols,
            topMargin,
            measureRowHeight,
            spacingBetweenMeasures,
            labelFontSize,
            dividerLinesColor,
            showGridLines,
            dividerLinesBetweenGroups,
            secondaryDateFormat
        );
        secondaryXAxisHtml = secondaryAxis.axisHtml;
        secondaryXAxisLabelsHtml = secondaryAxis.labelsHtml;
    }
    
    // Labels do eixo X - apenas primeira dimensão (embaixo)
    const lastMeasureRowTop = calculateLastMeasureRowTop(
        measureCols.length,
        topMargin,
        measureRowHeight,
        spacingBetweenMeasures
    );
    
    const xAxisLabels = renderXAxisLabels(
        chartData,
        leftMargin,
        barWidth,
        barSpacing,
        lastMeasureRowTop,
        measureRowHeight,
        labelFontSize,
        primaryDateFormat
    );

    // Eixo X - apenas na última linha
    const xAxis = renderXAxis(
        leftMargin,
        plotAreaWidth,
        lastMeasureRowTop,
        measureRowHeight
    );

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
                          const titleX = leftMargin / 2;
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
            getDefaultChartConfig: getDefaultChartConfig,
        getQueriesFromChartConfig: getQueriesFromChartConfig,
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
            
            // Ler valores salvos - priorizar seções individuais sobre chart_options consolidado
            // Isso garante que os valores salvos sejam exibidos corretamente no editor
            const allSavedProps = (currentVisualProps.visualProps as Record<string, unknown>) || {};
            const { chartVisual: savedChartVisual, chartDimensions: savedChartDimensions, chartDividerLines: savedChartDividerLines, chartOptions: savedChartOptions } = readSavedValues(allSavedProps);
            
            // Seção 1: Layout e Visualização
            const chartVisualChildren: any[] = [
                {
                    type: 'toggle',
                    key: 'showYAxis',
                    label: 'Mostrar Eixo Y',
                    defaultValue: getSavedValue(savedChartVisual.showYAxis, savedChartOptions.showYAxis, true) !== false,
                },
                {
                    type: 'toggle',
                    key: 'showGridLines',
                    label: 'Mostrar Linhas Divisórias',
                    defaultValue: getSavedValue(savedChartVisual.showGridLines, savedChartOptions.showGridLines, true) !== false,
                },
            ];
            
            // Adicionar campos adicionais
            chartVisualChildren.push(
                {
                    type: 'dropdown',
                    key: 'measureNameRotation',
                    label: 'Rotação do Nome da Medida',
                    defaultValue: getSavedValue(savedChartVisual.measureNameRotation, savedChartOptions.measureNameRotation, '-90'),
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
                    defaultValue: getSavedValue(savedChartVisual.forceLabels, savedChartOptions.forceLabels, false) === true,
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
            const showGridLinesValue = getSavedValue(savedChartVisual.showGridLines, savedChartOptions.showGridLines, true) !== false;
            if (showGridLinesValue) {
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
                            defaultValue: getSavedValue(savedChartDividerLines.dividerLinesBetweenMeasures, savedChartOptions.dividerLinesBetweenMeasures, true) !== false,
                        },
                        {
                            type: 'toggle',
                            key: 'dividerLinesBetweenGroups',
                            label: 'Linhas entre Grupos',
                            defaultValue: getSavedValue(savedChartDividerLines.dividerLinesBetweenGroups, savedChartOptions.dividerLinesBetweenGroups, true) !== false,
                        },
                        {
                            type: 'toggle',
                            key: 'dividerLinesBetweenBars',
                            label: 'Linhas entre Barras',
                            defaultValue: getSavedValue(savedChartDividerLines.dividerLinesBetweenBars, savedChartOptions.dividerLinesBetweenBars, false) === true,
                        },
                        {
                            type: 'text',
                            key: 'dividerLinesColor',
                            label: 'Cor das Linhas Divisórias',
                            defaultValue: getSavedValue(savedChartDividerLines.dividerLinesColor, savedChartOptions.dividerLinesColor, '#d1d5db'),
                        },
                    ],
                });
            }
            
            // Seção 2: Dimensões e Tamanhos
            const savedFitWidth = getSavedValue(savedChartDimensions.fitWidth, savedChartOptions.fitWidth, false) === true;
            const savedShowYAxis = getSavedValue(savedChartVisual.showYAxis, savedChartOptions.showYAxis, true) !== false;
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
                        defaultValue: savedFitWidth,
                    },
                    {
                        type: 'toggle',
                        key: 'fitHeight',
                        label: 'Ajustar a 100% da Altura',
                        defaultValue: getSavedValue(savedChartDimensions.fitHeight, savedChartOptions.fitHeight, false) === true,
                    },
                    {
                        type: 'number',
                        key: 'measureLabelSpace',
                        label: 'Espaço das Labels das Medidas (px)',
                        defaultValue: getSavedValue(savedChartDimensions.measureLabelSpace, savedChartOptions.measureLabelSpace, savedShowYAxis ? 120 : 60),
                    },
                    // Campo de largura da barra - só aparece se fitWidth não está ativo
                    ...(savedFitWidth ? [] : [{
                        type: 'number',
                        key: 'barWidth',
                        label: 'Largura da Barra (px)',
                        defaultValue: getSavedValue(savedChartDimensions.barWidth, savedChartOptions.barWidth, 40),
                    }]),
                    // Campo de altura da linha - só aparece se fitHeight não está ativo
                    ...(getSavedValue(savedChartDimensions.fitHeight, savedChartOptions.fitHeight, false) === true ? [] : [{
                        type: 'number',
                        key: 'measureRowHeight',
                        label: 'Altura da Linha (px)',
                        defaultValue: getSavedValue(savedChartDimensions.measureRowHeight, savedChartOptions.measureRowHeight, 50),
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

// Tornar renderChart disponível globalmente para handlers
if (typeof window !== 'undefined') {
    (window as any).__renderChart = renderChart;
}

init();
