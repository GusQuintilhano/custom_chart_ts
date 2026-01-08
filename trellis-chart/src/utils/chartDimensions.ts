/**
 * Utilitários para cálculo de dimensões e configurações do gráfico
 */

import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import type { ChartDataPoint, MeasureConfig } from '../types/chartTypes';
import type { ChartOptions } from './options';
import { logger } from './logger';

/**
 * Interface para dimensões calculadas do gráfico
 */
export interface ChartDimensions {
    leftMargin: number;
    topMargin: number;
    bottomMargin: number;
    rightMargin: number;
    spacingBetweenMeasures: number;
    chartWidth: number;
    chartHeight: number;
    measureRowHeight: number;
    plotAreaWidth: number;
    barWidth: number;
    barSpacing: number;
    measureLabelSpace: number;
}

/**
 * Calcula todas as dimensões do gráfico baseado nas opções e dados
 */
export function calculateChartDimensions(
    chartOptions: ChartOptions,
    chartData: ChartDataPoint[],
    measureCols: ChartColumn[],
    hasSecondaryDimension: boolean,
    allVisualProps: Record<string, unknown>,
    containerDimensions?: { width: number; height: number }
): ChartDimensions {
    const showYAxis = chartOptions.showYAxis !== false;
    const fitWidth = chartOptions.fitWidth || false;
    const fitHeight = chartOptions.fitHeight || false;
    const measureLabelSpace = chartOptions.measureLabelSpace ?? (showYAxis ? 120 : 60);
    const fixedMeasureRowHeight = chartOptions.measureRowHeight ?? 50;
    const fixedBarWidth = chartOptions.barWidth ?? 40;
    
    const leftMargin = measureLabelSpace;
    const secondaryAxisHeight = hasSecondaryDimension ? 40 : 0;
    const topMargin = hasSecondaryDimension ? 50 : 20;
    const bottomMargin = 60;
    const rightMargin = 40;
    const spacingBetweenMeasures = 15;
    
    // Armazenar measureLabelSpace para uso nas linhas divisórias
    
    // Calcular altura da linha e altura total do gráfico
    let measureRowHeight: number;
    let chartHeight: number;
    
    if (fitHeight) {
        chartHeight = 500; // Valor base para cálculo inicial
        measureRowHeight = (chartHeight - topMargin - bottomMargin - (spacingBetweenMeasures * (measureCols.length - 1))) / measureCols.length;
    } else {
        measureRowHeight = fixedMeasureRowHeight;
        chartHeight = topMargin + (measureRowHeight * measureCols.length) + (spacingBetweenMeasures * (measureCols.length - 1)) + bottomMargin;
    }
    
    // Ajustar largura e espaçamento das barras
    const numBars = chartData.length;
    
    if (fitWidth) {
        // Quando fitWidth está ativo, tentar usar dimensões reais do container se disponíveis
        let containerWidth = containerDimensions?.width || 0;
        
        // Se não temos dimensões do container, tentar obter de outras formas
        if (containerWidth === 0 && typeof window !== 'undefined') {
            // Tentar obter do elemento chartElement se disponível
            // Isso será feito no index.ts antes de chamar esta função
        }
        
        // Usar dimensões do container se disponíveis, senão usar valor base
        // IMPORTANTE: Quando fitWidth está ativo, precisamos garantir que o conteúdo seja redesenhado
        // com base na largura do container. Se o containerWidth ainda não estiver disponível (0),
        // usar um valor padrão razoável, mas o dynamicResize vai re-renderizar com as dimensões corretas
        const baseWidth = containerWidth > 0 ? containerWidth : 800;
        const plotAreaWidth = baseWidth - leftMargin - rightMargin;
        
        chartHeight = fitHeight ? (containerDimensions?.height || 500) : chartHeight; // Usar altura do container se disponível
        measureRowHeight = fitHeight ? (chartHeight - topMargin - bottomMargin - (spacingBetweenMeasures * (measureCols.length - 1))) / measureCols.length : measureRowHeight;
        
        // Calcular espaçamento e largura das barras baseado no plotAreaWidth real
        // IMPORTANTE: Quando fitWidth está ativo, essas dimensões vão ser recalculadas pelo dynamicResize
        // quando o containerWidth real estiver disponível, mas precisamos ter valores iniciais corretos
        const barSpacing = showYAxis ? 20 : Math.max(15, plotAreaWidth / (numBars * 3));
        const totalSpacing = barSpacing * (numBars - 1);
        const barWidth = showYAxis ? 40 : Math.max(30, (plotAreaWidth - totalSpacing) / numBars);
        
        const chartWidth = baseWidth; // Usar largura do container diretamente
        
        // Log para debug quando fitWidth está ativo
        if (fitWidth) {
            console.log('[FitWidth] calculateChartDimensions - Renderização inicial:', {
                containerWidth,
                baseWidth,
                chartWidth,
                plotAreaWidth,
                barWidth,
                barSpacing,
                info: containerWidth > 0 
                    ? 'ContainerWidth disponível, conteúdo será redesenhado com dimensões corretas'
                    : 'ContainerWidth não disponível (0), usando valor padrão (800px). DynamicResize vai re-renderizar com dimensões corretas.',
            });
        }
        
        return {
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
        };
    } else {
        // Quando fitWidth não está ativo, calcular largura baseada nas barras
        const configuredBarSpacing = chartOptions.barSpacing ?? null;
        const barSpacing = configuredBarSpacing !== null ? configuredBarSpacing : (showYAxis ? 20 : 15);
        const totalBarWidth = fixedBarWidth * numBars;
        const totalBarSpacing = barSpacing * (numBars - 1);
        const plotAreaWidth = totalBarWidth + totalBarSpacing;
        const chartWidth = plotAreaWidth + leftMargin + rightMargin;
        
        return {
            leftMargin,
            topMargin,
            bottomMargin,
            rightMargin,
            spacingBetweenMeasures,
            chartWidth,
            chartHeight,
            measureRowHeight,
            plotAreaWidth,
            barWidth: fixedBarWidth,
            barSpacing,
            measureLabelSpace,
        };
    }
}

/**
 * Lê configurações de medidas (cores, formatos, etc.)
 */
export function readMeasureConfigs(
    measureCols: ChartColumn[],
    allVisualProps: Record<string, unknown>
): MeasureConfig[] {
    const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];
    const columnVisualProps = (allVisualProps?.columnVisualProps || {}) as Record<string, unknown>;
    
    return measureCols.map((measure, measureIdx) => {
        const measureKeyOld = `measure_${measure.id}`;
        
        const configFromColumnVisualProps = (columnVisualProps[measure.id] || {}) as Record<string, unknown>;
        const configOld = (allVisualProps[measureKeyOld] || {}) as Record<string, unknown>;
        const configNew = (allVisualProps[measure.id] || {}) as Record<string, unknown>;
        
        // O ThoughtSpot pode salvar valores em estruturas aninhadas (seções)
        // Se chartType está em uma seção 'visualization', pode estar em configFromColumnVisualProps.visualization.chartType
        const visualizationSection = (configFromColumnVisualProps.visualization || {}) as Record<string, unknown>;
        const numberFormattingSection = (configFromColumnVisualProps.number_formatting || {}) as Record<string, unknown>;
        // O ThoughtSpot pode salvar referenceLine em diferentes seções: 'referenceLine', 'reference_line', ou no nível raiz
        // IMPORTANTE: Quando temos uma seção com key 'reference_line', o ThoughtSpot pode salvar dentro dessa seção
        const referenceLineSection = (configFromColumnVisualProps.referenceLine || 
                                     configFromColumnVisualProps.reference_line || 
                                     {}) as Record<string, unknown>;
        const tooltipSection = (configFromColumnVisualProps.tooltip || {}) as Record<string, unknown>;
        
        // Ordem de merge: configNew (legado) < configOld (legado mais antigo) < configFromColumnVisualProps (mais recente, tem prioridade)
        // Também mesclar valores de seções aninhadas (ex: visualization.chartType -> chartType, number_formatting.decimals -> decimals)
        const measureConfigFlat = {
            ...configNew,
            ...configOld,
            ...configFromColumnVisualProps, // Prioridade mais alta - configurações de columnSettingsDefinition
        };
        
        // Extrair valores de seções aninhadas para o nível superior
        const chartTypeFromVisualization = visualizationSection.chartType;
        const colorFromVisualization = visualizationSection.color;
        const decimalsFromNumberFormatting = numberFormattingSection.decimals;
        const formatFromNumberFormatting = numberFormattingSection.format;
        const useThousandsSeparatorFromNumberFormatting = numberFormattingSection.useThousandsSeparator;
        
        // Extrair configurações de linha de referência de seções aninhadas
        // O ThoughtSpot pode salvar de diferentes formas:
        // 1. No nível raiz: referenceLine_enabled, referenceLine_value, etc.
        // 2. Em seção aninhada: referenceLine.enabled, referenceLine.value, etc.
        // 3. Em seção aninhada com prefixo: referenceLine.referenceLine_enabled, etc.
        // 4. Dentro da seção 'reference_line': reference_line.referenceLine_enabled, etc.
        const referenceLineSectionUnderscore = (configFromColumnVisualProps.reference_line || {}) as Record<string, unknown>;
        
        const referenceLineEnabledFromSection = referenceLineSection.enabled ?? 
                                                referenceLineSection.referenceLine_enabled ??
                                                referenceLineSectionUnderscore.referenceLine_enabled ??
                                                referenceLineSectionUnderscore.enabled ??
                                                (configFromColumnVisualProps as any).referenceLine_enabled;
        const referenceLineValueFromSection = referenceLineSection.value ?? 
                                              referenceLineSection.referenceLine_value ??
                                              referenceLineSectionUnderscore.referenceLine_value ??
                                              referenceLineSectionUnderscore.value ??
                                              (configFromColumnVisualProps as any).referenceLine_value;
        const referenceLineColorFromSection = referenceLineSection.color ?? 
                                             referenceLineSection.referenceLine_color ??
                                             referenceLineSectionUnderscore.referenceLine_color ??
                                             referenceLineSectionUnderscore.color ??
                                             (configFromColumnVisualProps as any).referenceLine_color;
        const referenceLineStyleFromSection = referenceLineSection.style ?? 
                                             referenceLineSection.referenceLine_style ??
                                             referenceLineSectionUnderscore.referenceLine_style ??
                                             referenceLineSectionUnderscore.style ??
                                             (configFromColumnVisualProps as any).referenceLine_style;
        const referenceLineShowLabelFromSection = referenceLineSection.showLabel ?? 
                                                  referenceLineSection.referenceLine_showLabel ??
                                                  referenceLineSectionUnderscore.referenceLine_showLabel ??
                                                  referenceLineSectionUnderscore.showLabel ??
                                                  (configFromColumnVisualProps as any).referenceLine_showLabel;
        
        // Extrair configurações de tooltip de seções aninhadas
        // O ThoughtSpot pode salvar de diferentes formas:
        // 1. No nível raiz: tooltip_enabled, tooltip_format, etc.
        // 2. Em seção aninhada: tooltip.enabled, tooltip.format, etc.
        // 3. Em seção aninhada com prefixo: tooltip.tooltip_enabled, etc.
        const tooltipEnabledFromSection = tooltipSection.enabled ??
                                         tooltipSection.tooltip_enabled ??
                                         (configFromColumnVisualProps as any).tooltip_enabled;
        const tooltipFormatFromSection = tooltipSection.format ??
                                        tooltipSection.tooltip_format ??
                                        (configFromColumnVisualProps as any).tooltip_format;
        const tooltipBackgroundColorFromSection = tooltipSection.backgroundColor ??
                                                 tooltipSection.tooltip_backgroundColor ??
                                                 (configFromColumnVisualProps as any).tooltip_backgroundColor;
        const tooltipLayoutFromSection = tooltipSection.layout ??
                                        tooltipSection.tooltip_layout ??
                                        (configFromColumnVisualProps as any).tooltip_layout;
        
        const measureConfig: Record<string, unknown> = {
            ...measureConfigFlat,
            ...(chartTypeFromVisualization ? { chartType: chartTypeFromVisualization } : {}), // Extrair chartType da seção visualization se existir
            ...(colorFromVisualization ? { color: colorFromVisualization } : {}), // Extrair color da seção visualization se existir
            ...(decimalsFromNumberFormatting !== undefined ? { decimals: decimalsFromNumberFormatting } : {}), // Extrair decimals da seção number_formatting se existir
            ...(formatFromNumberFormatting ? { format: formatFromNumberFormatting } : {}), // Extrair format da seção number_formatting se existir
            ...(useThousandsSeparatorFromNumberFormatting !== undefined ? { useThousandsSeparator: useThousandsSeparatorFromNumberFormatting } : {}), // Extrair useThousandsSeparator da seção number_formatting se existir
            // Extrair configurações de linha de referência de seções aninhadas
            ...(referenceLineEnabledFromSection !== undefined ? { referenceLine_enabled: referenceLineEnabledFromSection } : {}),
            ...(referenceLineValueFromSection !== undefined ? { referenceLine_value: referenceLineValueFromSection } : {}),
            ...(referenceLineColorFromSection ? { referenceLine_color: referenceLineColorFromSection } : {}),
            ...(referenceLineStyleFromSection ? { referenceLine_style: referenceLineStyleFromSection } : {}),
            ...(referenceLineShowLabelFromSection !== undefined ? { referenceLine_showLabel: referenceLineShowLabelFromSection } : {}),
            // Extrair configurações de tooltip de seções aninhadas
            ...(tooltipEnabledFromSection !== undefined ? { tooltip_enabled: tooltipEnabledFromSection } : {}),
            ...(tooltipFormatFromSection ? { tooltip_format: tooltipFormatFromSection } : {}),
            ...(tooltipBackgroundColorFromSection ? { tooltip_backgroundColor: tooltipBackgroundColorFromSection } : {}),
            ...(tooltipLayoutFromSection ? { tooltip_layout: tooltipLayoutFromSection } : {}),
        };
        
        const chartType = (measureConfig?.chartType as string) || 'barras';
        const defaultOpacity = chartType === 'linha' ? 0.8 : 0.9;
        
        // Processar linha de referência
        // Verificar se referenceLine_enabled está definido (pode ser true, "true", ou undefined)
        const referenceLineEnabledRaw = (measureConfig as any)?.referenceLine_enabled;
        const referenceLineEnabled = referenceLineEnabledRaw === true || referenceLineEnabledRaw === 'true' || referenceLineEnabledRaw === 1;
        
        const referenceLine: MeasureConfig['referenceLine'] = referenceLineEnabled ? {
            enabled: true,
            value: ((measureConfig as any)?.referenceLine_value as number) ?? 0,
            color: ((measureConfig as any)?.referenceLine_color as string) || '#ef4444',
            style: (((measureConfig as any)?.referenceLine_style as string) || 'sólida') as 'sólida' | 'tracejada' | 'pontilhada',
            showLabel: ((measureConfig as any)?.referenceLine_showLabel as boolean) !== false,
        } : undefined;
        
        // Processar tooltip
        // Verificar se tooltip_enabled está explicitamente definido como false
        // Pode ser false, "false", 0, ou undefined/null (que significa habilitado por padrão)
        const tooltipEnabledRaw = (measureConfig as any)?.tooltip_enabled;
        const tooltipEnabled = tooltipEnabledRaw !== false && 
                              tooltipEnabledRaw !== 'false' && 
                              tooltipEnabledRaw !== 0 &&
                              tooltipEnabledRaw !== '0';
        
        // Mapear formato de português para inglês para compatibilidade
        const tooltipFormatRaw = ((measureConfig as any)?.tooltip_format as string) || 'simples';
        const tooltipFormatMapped = tooltipFormatRaw === 'detalhado' ? 'detailed' : (tooltipFormatRaw === 'simples' ? 'simple' : tooltipFormatRaw);
        
        // Sempre criar o objeto tooltip, mas com enabled baseado na configuração
        // Isso permite desabilitar o tooltip para uma medida específica
        const tooltip: MeasureConfig['tooltip'] = {
            enabled: tooltipEnabled,
            format: tooltipFormatMapped as 'simple' | 'detailed',
            backgroundColor: ((measureConfig as any)?.tooltip_backgroundColor as string) || '#ffffff',
            layout: (((measureConfig as any)?.tooltip_layout as string) || 'vertical') as 'vertical' | 'horizontal' | 'grade',
        };
        
        return {
            measure,
            color: (measureConfig?.color as string) || defaultColors[measureIdx % defaultColors.length],
            format: (measureConfig?.format as string) || 'decimal',
            decimals: (measureConfig?.decimals as number) ?? 2,
            chartType,
            useThousandsSeparator: (measureConfig?.useThousandsSeparator as boolean) ?? true,
            opacity: (measureConfig?.opacity as number) ?? defaultOpacity,
            valueLabelPosition: (measureConfig?.valueLabelPosition as any) || 'automático',
            minY: (measureConfig?.minY === undefined || (measureConfig?.minY as any) === 'auto') ? 'auto' : (measureConfig?.minY as number),
            maxY: (measureConfig?.maxY === undefined || (measureConfig?.maxY as any) === 'auto') ? 'auto' : (measureConfig?.maxY as number),
            yAxisTicks: (measureConfig?.yAxisTicks === undefined || (measureConfig?.yAxisTicks as any) === 'auto' || (measureConfig?.yAxisTicks as number) === 0) ? 'auto' : (measureConfig?.yAxisTicks as number),
            showYAxisValues: (measureConfig?.showYAxisValues as boolean) ?? true,
            valuePrefix: ((measureConfig as any)?.valuePrefix as string) || '',
            valueSuffix: ((measureConfig as any)?.valueSuffix as string) || '',
            showZeroValues: (measureConfig?.showZeroValues as boolean) ?? true,
            valueFormat: ((measureConfig as any)?.valueFormat as 'normal' | 'compacto') || 'normal',
            referenceLine,
            tooltip,
        };
    });
}

/**
 * Lê configurações de formatação de dimensões
 */
export function readDimensionFormats(
    primaryDimension: ChartColumn,
    secondaryDimensions: ChartColumn[],
    allVisualProps: Record<string, unknown>
): { primaryDateFormat: string; secondaryDateFormat: string } {
    const columnVisualProps = (allVisualProps?.columnVisualProps || {}) as Record<string, unknown>;
    const dimensionConfigOld = (allVisualProps?.dimension_formatting || {}) as Record<string, unknown>;
    
    const primaryDimensionConfig = (columnVisualProps[primaryDimension.id] || {}) as Record<string, unknown>;
    const primaryDateFormat = (primaryDimensionConfig.dateFormat as string) || (dimensionConfigOld?.dateFormat as string) || 'auto';
    
    let secondaryDateFormat = 'auto';
    if (secondaryDimensions.length > 0) {
        const secondaryDimensionConfig = (columnVisualProps[secondaryDimensions[0].id] || {}) as Record<string, unknown>;
        secondaryDateFormat = (secondaryDimensionConfig.dateFormat as string) || (dimensionConfigOld?.dateFormat as string) || 'auto';
    }
    
    return { primaryDateFormat, secondaryDateFormat };
}

