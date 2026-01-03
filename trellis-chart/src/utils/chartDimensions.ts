/**
 * Utilitários para cálculo de dimensões e configurações do gráfico
 */

import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import type { ChartDataPoint, MeasureConfig } from '../types/chartTypes';
import type { ChartOptions } from './options';

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
        const barSpacing = showYAxis ? 20 : 15;
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
        
        const measureConfig = {
            ...configNew,
            ...configOld,
            ...configFromColumnVisualProps,
        };
        
        return {
            measure,
            color: (measureConfig?.color as string) || defaultColors[measureIdx % defaultColors.length],
            format: (measureConfig?.format as string) || 'decimal',
            decimals: (measureConfig?.decimals as number) ?? 2,
            chartType: (measureConfig?.chartType as string) || 'bar',
            useThousandsSeparator: (measureConfig?.useThousandsSeparator as boolean) ?? true,
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

