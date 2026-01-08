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
    allVisualProps: Record<string, unknown>
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
        // Quando fitWidth está ativo, usar valores padrão que serão ajustados dinamicamente
        const plotAreaWidth = 800; // Valor base, será ajustado pelo resize observer
        chartHeight = fitHeight ? 500 : chartHeight; // Usar valor base se fitHeight também estiver ativo
        measureRowHeight = fitHeight ? (chartHeight - topMargin - bottomMargin - (spacingBetweenMeasures * (measureCols.length - 1))) / measureCols.length : measureRowHeight;
        
        // Calcular espaçamento e largura das barras baseado no plotAreaWidth (será ajustado depois)
        const barSpacing = showYAxis ? 20 : Math.max(15, plotAreaWidth / (numBars * 3));
        const totalSpacing = barSpacing * (numBars - 1);
        const barWidth = showYAxis ? 40 : Math.max(30, (plotAreaWidth - totalSpacing) / numBars);
        
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
        const referenceLineEnabledFromSection = referenceLineSection.enabled ?? 
                                                referenceLineSection.referenceLine_enabled ??
                                                (configFromColumnVisualProps as any).referenceLine_enabled;
        const referenceLineValueFromSection = referenceLineSection.value ?? 
                                              referenceLineSection.referenceLine_value ??
                                              (configFromColumnVisualProps as any).referenceLine_value;
        const referenceLineColorFromSection = referenceLineSection.color ?? 
                                             referenceLineSection.referenceLine_color ??
                                             (configFromColumnVisualProps as any).referenceLine_color;
        const referenceLineStyleFromSection = referenceLineSection.style ?? 
                                             referenceLineSection.referenceLine_style ??
                                             (configFromColumnVisualProps as any).referenceLine_style;
        const referenceLineShowLabelFromSection = referenceLineSection.showLabel ?? 
                                                  referenceLineSection.referenceLine_showLabel ??
                                                  (configFromColumnVisualProps as any).referenceLine_showLabel;
        
        // Extrair configurações de tooltip de seções aninhadas
        const tooltipEnabledFromSection = tooltipSection.enabled;
        const tooltipFormatFromSection = tooltipSection.format;
        const tooltipBackgroundColorFromSection = tooltipSection.backgroundColor;
        const tooltipLayoutFromSection = tooltipSection.layout;
        
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
        
        // Debug: verificar se referenceLine_enabled está em measureConfigFlat (nível raiz)
        console.log(`[DEBUG] Measure ${measure.id} - Verificando referenceLine_enabled:`, {
            inMeasureConfigFlat: (measureConfigFlat as any).referenceLine_enabled,
            inConfigFromColumnVisualProps: (configFromColumnVisualProps as any).referenceLine_enabled,
            inReferenceLineSection: referenceLineSection.enabled ?? referenceLineSection.referenceLine_enabled,
            inReferenceLineSection_reference_line: (configFromColumnVisualProps.reference_line as any)?.referenceLine_enabled,
            referenceLineEnabledFromSection,
            finalInMeasureConfig: (measureConfig as any).referenceLine_enabled,
            allKeysInMeasureConfigFlat: Object.keys(measureConfigFlat).filter(k => k.includes('reference') || k.includes('Reference')),
            allKeysInConfigFromColumnVisualProps: Object.keys(configFromColumnVisualProps).filter(k => k.includes('reference') || k.includes('Reference')),
            fullConfigFromColumnVisualProps: configFromColumnVisualProps, // Log completo para debug
        });
        
        // Debug: verificar valores
        logger.debug(`[DEBUG] Measure ${measure.id} chartType:`, {
            configNew: (configNew as any).chartType,
            configOld: (configOld as any).chartType,
            configFromColumnVisualProps: (configFromColumnVisualProps as any).chartType,
            visualizationSection: (visualizationSection as any).chartType,
            final: (measureConfig as any).chartType
        });
        
        const chartType = (measureConfig?.chartType as string) || 'barras';
        const defaultOpacity = chartType === 'linha' ? 0.8 : 0.9;
        
        // Processar linha de referência
        // Verificar se referenceLine_enabled está definido (pode ser true, "true", ou undefined)
        const referenceLineEnabledRaw = (measureConfig as any)?.referenceLine_enabled;
        const referenceLineEnabled = referenceLineEnabledRaw === true || referenceLineEnabledRaw === 'true' || referenceLineEnabledRaw === 1;
        
        // Debug: log dos valores de linha de referência (usar console.log para garantir que apareça)
        console.log(`[DEBUG] Measure ${measure.id} referenceLine:`, {
            referenceLine_enabled: referenceLineEnabledRaw,
            referenceLine_enabled_parsed: referenceLineEnabled,
            referenceLine_value: (measureConfig as any)?.referenceLine_value,
            referenceLine_color: (measureConfig as any)?.referenceLine_color,
            referenceLine_style: (measureConfig as any)?.referenceLine_style,
            allReferenceLineKeys: Object.keys(measureConfig).filter(k => k.startsWith('referenceLine_')),
            measureConfigKeys: Object.keys(measureConfig).slice(0, 20), // Primeiras 20 chaves para debug
        });
        
        const referenceLine: MeasureConfig['referenceLine'] = referenceLineEnabled ? {
            enabled: true,
            value: ((measureConfig as any)?.referenceLine_value as number) ?? 0,
            color: ((measureConfig as any)?.referenceLine_color as string) || '#ef4444',
            style: (((measureConfig as any)?.referenceLine_style as string) || 'sólida') as 'sólida' | 'tracejada' | 'pontilhada',
            showLabel: ((measureConfig as any)?.referenceLine_showLabel as boolean) !== false,
        } : undefined;
        
        // Debug adicional: verificar se referenceLine foi criado (usar console.log para garantir que apareça)
        if (referenceLineEnabled && referenceLine) {
            console.log(`[DEBUG] Measure ${measure.id} referenceLine criado:`, referenceLine);
        } else if (referenceLineEnabled && !referenceLine) {
            console.warn(`[DEBUG] Measure ${measure.id} referenceLineEnabled=true mas referenceLine é undefined!`);
        } else if (!referenceLineEnabled) {
            console.log(`[DEBUG] Measure ${measure.id} referenceLineEnabled=false, não criando referenceLine`);
        }
        
        // Processar tooltip
        const tooltipEnabled = (measureConfig as any)?.tooltip_enabled !== false;
        // Mapear formato de português para inglês para compatibilidade
        const tooltipFormatRaw = ((measureConfig as any)?.tooltip_format as string) || 'simples';
        const tooltipFormatMapped = tooltipFormatRaw === 'detalhado' ? 'detailed' : (tooltipFormatRaw === 'simples' ? 'simple' : tooltipFormatRaw);
        const tooltip: MeasureConfig['tooltip'] = tooltipEnabled ? {
            enabled: true,
            format: tooltipFormatMapped as 'simple' | 'detailed',
            backgroundColor: ((measureConfig as any)?.tooltip_backgroundColor as string) || '#ffffff',
            layout: (((measureConfig as any)?.tooltip_layout as string) || 'vertical') as 'vertical' | 'horizontal' | 'grade',
        } : undefined;
        
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

