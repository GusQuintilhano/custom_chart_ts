/**
 * Leitura e configuração de opções do Boxplot Chart
 */

import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import type { 
    BoxplotMeasureConfig, 
    CalculationMethod, 
    WhiskerType, 
    OutlierShape,
    BoxplotOrientation,
    SortType,
    MedianStyle,
    WhiskerStyle,
    BoxStyle,
    OutlierStyle,
    GridLinesConfig,
    TooltipConfig
} from '../types/boxplotTypes';

export interface BoxplotOptions {
    // Configurações básicas
    showYAxis: boolean;
    showOutliers: boolean;
    orientation: BoxplotOrientation;
    boxWidth: number;
    whiskerWidth: number;
    color: string;
    opacity: number;
    
    // Tipografia
    labelFontSize: number;
    valueLabelFontSize: number;
    
    // Cores e estilo
    yAxisColor: string;
    xAxisColor: string;
    backgroundColor: string;
    axisStrokeWidth: number;
    
    // Novas configurações expandidas
    calculationMethod: CalculationMethod;
    whiskerType: WhiskerType;
    showMean: boolean;
    showNotch: boolean; // Notch Mode (intervalo de confiança)
    sortType: SortType; // Tipo de ordenação dos grupos
    medianStyle: MedianStyle;
    whiskerStyle: WhiskerStyle;
    boxStyle: BoxStyle;
    outlierStyle: OutlierStyle;
    gridLines: GridLinesConfig;
    tooltip: TooltipConfig;
    padding: number;
    axisLabels: {
        x?: string;
        y?: string;
    };
}

/**
 * Lê opções do visualProps e retorna configurações do boxplot
 */
export function readBoxplotOptions(
    allVisualProps: Record<string, unknown>,
    measureColumn: ChartColumn
): BoxplotOptions {
    const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    // Ler configurações da medida específica
    const measureConfig = (allVisualProps?.columnVisualProps as Record<string, unknown>)?.[measureColumn.id] as Record<string, unknown> || {};
    const visualization = (measureConfig.visualization || {}) as Record<string, unknown>;
    const boxStyleSection = (measureConfig.boxStyle || {}) as Record<string, unknown>;
    const medianStyleSection = (measureConfig.medianWhiskers || {}) as Record<string, unknown>;
    const whiskerStyleSection = (measureConfig.medianWhiskers || {}) as Record<string, unknown>;
    const outlierStyleSection = (measureConfig.outlierStyle || {}) as Record<string, unknown>;
    const dataConfig = (measureConfig.dataConfig || {}) as Record<string, unknown>;
    
    const chartOptions = (allVisualProps?.chart_options || {}) as Record<string, unknown>;
    const axes = (allVisualProps?.axes || {}) as Record<string, unknown>;
    const textSizes = (allVisualProps?.text_sizes || {}) as Record<string, unknown>;
    const colorsStyle = (allVisualProps?.chart_colors_style || {}) as Record<string, unknown>;
    const gridLines = (allVisualProps?.gridLines || {}) as Record<string, unknown>;
    const tooltipConfig = (allVisualProps?.tooltip || {}) as Record<string, unknown>;
    const layoutConfig = (allVisualProps?.layout || {}) as Record<string, unknown>;

    // Box Style
    const defaultColor = (visualization.color as string) || defaultColors[0];
    const boxStyle: BoxStyle = {
        fill: (boxStyleSection.fill as string) || defaultColor,
        stroke: (boxStyleSection.stroke as string) || '#374151',
        strokeWidth: typeof boxStyleSection.strokeWidth === 'number' ? boxStyleSection.strokeWidth : 1,
        borderRadius: typeof boxStyleSection.borderRadius === 'number' ? boxStyleSection.borderRadius : 0,
        opacity: typeof boxStyleSection.opacity === 'number' ? boxStyleSection.opacity : 0.8,
    };

    // Median Style
    const medianStyle: MedianStyle = {
        color: (medianStyleSection.medianColor as string) || '#000000',
        strokeWidth: typeof medianStyleSection.medianStrokeWidth === 'number' ? medianStyleSection.medianStrokeWidth : 2,
        strokeDasharray: (medianStyleSection.medianStrokeDash as string) || undefined,
    };

    // Whisker Style
    const whiskerStyle: WhiskerStyle = {
        color: (whiskerStyleSection.whiskerColor as string) || defaultColor,
        strokeWidth: typeof whiskerStyleSection.whiskerStrokeWidth === 'number' ? whiskerStyleSection.whiskerStrokeWidth : 1,
        capWidth: typeof whiskerStyleSection.whiskerCapWidth === 'number' ? whiskerStyleSection.whiskerCapWidth : 40,
        strokeDasharray: undefined, // Geralmente não usado em whiskers
    };

    // Outlier Style
    const outlierStyle: OutlierStyle = {
        show: outlierStyleSection.show !== undefined ? (outlierStyleSection.show as boolean) : (measureConfig.showOutliers !== false),
        shape: (outlierStyleSection.shape as OutlierShape) || 'circle',
        size: typeof outlierStyleSection.size === 'number' ? outlierStyleSection.size : 4,
        fill: (outlierStyleSection.fill as string) || '#ef4444',
        stroke: (outlierStyleSection.stroke as string) || '#000000',
        strokeWidth: typeof outlierStyleSection.strokeWidth === 'number' ? outlierStyleSection.strokeWidth : 1,
    };

    // Grid Lines
    const gridLinesConfig: GridLinesConfig = {
        show: typeof gridLines.show === 'boolean' ? gridLines.show : false,
        color: (gridLines.color as string) || '#e5e7eb',
        strokeWidth: typeof gridLines.strokeWidth === 'number' ? gridLines.strokeWidth : 1,
        strokeDasharray: (gridLines.strokeDash as string) || undefined,
    };

    // Tooltip
    const tooltip: TooltipConfig = {
        enabled: typeof tooltipConfig.enabled === 'boolean' ? tooltipConfig.enabled : true,
        format: (tooltipConfig.format as 'simple' | 'detailed' | 'custom') || 'simple',
        customTemplate: (tooltipConfig.customTemplate as string) || undefined,
    };

    // Layout
    const padding = typeof layoutConfig.padding === 'number' ? layoutConfig.padding : 10;
    const axisLabels = {
        x: (layoutConfig.axisLabelX as string) || undefined,
        y: (layoutConfig.axisLabelY as string) || undefined,
    };

    return {
        showYAxis: (axes.showYAxis !== undefined ? axes.showYAxis : chartOptions.showYAxis !== false) as boolean,
        showOutliers: outlierStyle.show,
        orientation: (measureConfig.orientation || 'vertical') as BoxplotOrientation,
        boxWidth: typeof boxStyleSection.boxWidth === 'number' ? boxStyleSection.boxWidth : (typeof measureConfig.boxWidth === 'number' ? measureConfig.boxWidth : 60),
        whiskerWidth: whiskerStyle.capWidth, // Usar capWidth como whiskerWidth para compatibilidade
        color: defaultColor,
        opacity: boxStyle.opacity,
        labelFontSize: typeof textSizes.labelFontSize === 'number' ? textSizes.labelFontSize : 12,
        valueLabelFontSize: typeof textSizes.valueLabelFontSize === 'number' ? textSizes.valueLabelFontSize : 10,
        yAxisColor: (colorsStyle.yAxisColor as string) || '#374151',
        xAxisColor: (colorsStyle.xAxisColor as string) || '#374151',
        backgroundColor: (colorsStyle.backgroundColor as string) || 'transparent',
        axisStrokeWidth: typeof colorsStyle.axisStrokeWidth === 'number' ? colorsStyle.axisStrokeWidth : 1.5,
        
        // Novas configurações
        calculationMethod: (dataConfig.calculationMethod as CalculationMethod) || 'auto',
        whiskerType: (measureConfig.whiskerType as WhiskerType) || 'iqr_1_5',
        showMean: measureConfig.showMean === true,
        showNotch: measureConfig.showNotch === true,
        sortType: (chartOptions.sortType as SortType) || 'alphabetical',
        medianStyle,
        whiskerStyle,
        boxStyle,
        outlierStyle,
        gridLines: gridLinesConfig,
        tooltip,
        padding,
        axisLabels,
    };
}

