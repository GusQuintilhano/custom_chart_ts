/**
 * Módulo para extração e setup de opções do gráfico
 */

import type { ChartOptions as ChartOptionsType } from './options';
import { readChartOptions } from './options';
import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import { readDimensionFormats, readMeasureConfigs } from './chartDimensions';
import type { MeasureConfig } from '../types/chartTypes';

export interface ChartOptionsSetup {
    chartOptions: ChartOptionsType;
    showYAxis: boolean;
    measureNameRotation: number;
    fitWidth: boolean;
    fitHeight: boolean;
    showGridLines: boolean;
    dividerLinesBetweenMeasures: boolean;
    dividerLinesBetweenGroups: boolean;
    dividerLinesBetweenBars: boolean;
    dividerLinesColor: string;
    dividerLinesBetweenMeasuresColor: string;
    dividerLinesBetweenMeasuresWidth: number;
    dividerLinesBetweenGroupsColor: string;
    dividerLinesBetweenGroupsWidth: number;
    dividerLinesBetweenBarsColor: string;
    dividerLinesBetweenBarsWidth: number;
    forceLabels: boolean;
    labelFontSize: number;
    measureTitleFontSize: number;
    valueLabelFontSize: number;
    primaryDateFormat: string;
    secondaryDateFormat: string;
    measureConfigs: MeasureConfig[];
    yAxisColor: string;
    xAxisColor: string;
    axisStrokeWidth: number;
    backgroundColor: string;
    tooltipEnabled: boolean;
    tooltipFormat: 'simple' | 'detailed';
    tooltipShowAllMeasures: boolean;
    tooltipBackgroundColor: string;
    tooltipCustomTemplate: string;
}

/**
 * Configura todas as opções do gráfico
 */
export function setupChartOptions(
    visualProps: Record<string, unknown>,
    primaryDimension: ChartColumn,
    secondaryDimensions: ChartColumn[],
    measureCols: ChartColumn[]
): ChartOptionsSetup {
    const chartOptions = readChartOptions(visualProps);
    const textSizes = (visualProps?.text_sizes || {}) as Record<string, unknown>;
    
    const showYAxis = chartOptions.showYAxis !== false;
    const measureNameRotation = Number(chartOptions.measureNameRotation || '-90');
    const fitWidth = chartOptions.fitWidth || false;
    const fitHeight = chartOptions.fitHeight || false;
    const showGridLines = chartOptions.showGridLines !== false;
    const dividerLinesBetweenMeasures = chartOptions.dividerLinesBetweenMeasures !== false;
    const dividerLinesBetweenGroups = chartOptions.dividerLinesBetweenGroups !== false;
    const dividerLinesBetweenBars = chartOptions.dividerLinesBetweenBars || false;
    const dividerLinesColor = chartOptions.dividerLinesColor || '#d1d5db';
    const dividerLinesBetweenMeasuresColor = chartOptions.dividerLinesBetweenMeasuresColor || dividerLinesColor;
    const dividerLinesBetweenMeasuresWidth = chartOptions.dividerLinesBetweenMeasuresWidth ?? 1;
    const dividerLinesBetweenGroupsColor = chartOptions.dividerLinesBetweenGroupsColor || dividerLinesColor;
    const dividerLinesBetweenGroupsWidth = chartOptions.dividerLinesBetweenGroupsWidth ?? 1;
    const dividerLinesBetweenBarsColor = chartOptions.dividerLinesBetweenBarsColor || dividerLinesColor;
    const dividerLinesBetweenBarsWidth = chartOptions.dividerLinesBetweenBarsWidth ?? 1;
    const forceLabels = chartOptions.forceLabels || false;
    const labelFontSize = (textSizes?.labelFontSize as number) ?? 10;
    const measureTitleFontSize = (textSizes?.measureTitleFontSize as number) ?? 10;
    const valueLabelFontSize = (textSizes?.valueLabelFontSize as number) ?? 9;
    
    // Ler configurações de formatação
    const { primaryDateFormat, secondaryDateFormat } = readDimensionFormats(
        primaryDimension,
        secondaryDimensions,
        visualProps
    );
    
    // Ler configurações de medidas
    const measureConfigs = readMeasureConfigs(measureCols, visualProps);
    
    // Ler cores e estilo dos eixos
    const yAxisColor = chartOptions.yAxisColor || '#374151';
    const xAxisColor = chartOptions.xAxisColor || '#374151';
    const axisStrokeWidth = chartOptions.axisStrokeWidth ?? 1.5;
    
    // Ler opções de tooltip
    const tooltipEnabled = (chartOptions as any).tooltipEnabled || false;
    const tooltipFormat = ((chartOptions as any).tooltipFormat || 'simple') as 'simple' | 'detailed';
    const tooltipShowAllMeasures = (chartOptions as any).tooltipShowAllMeasures || false;
    const tooltipBackgroundColor = (chartOptions as any).tooltipBackgroundColor || '#ffffff';
    const tooltipCustomTemplate = (chartOptions as any).tooltipCustomTemplate || '';
    
    return {
        chartOptions,
        showYAxis,
        measureNameRotation,
        fitWidth,
        fitHeight,
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
        yAxisColor,
        xAxisColor,
        axisStrokeWidth,
        tooltipEnabled,
        tooltipFormat,
        tooltipShowAllMeasures,
        tooltipBackgroundColor,
        tooltipCustomTemplate,
    };
}

