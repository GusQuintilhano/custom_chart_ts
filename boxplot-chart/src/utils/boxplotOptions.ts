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
    ReferenceLinesConfig,
    ReferenceLineType,
    TooltipConfig,
    LayoutConfig
} from '../types/boxplotTypes';

export interface BoxplotOptions {
    // Configurações básicas
    showYAxis: boolean;
    showOutliers: boolean;
    orientation: BoxplotOrientation;
    boxWidth: number;
    variableWidth: boolean; // Largura variável proporcional ao count
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
    yScale: 'linear' | 'log'; // Escala do eixo Y (linear ou logarítmica)
    medianStyle: MedianStyle;
    whiskerStyle: WhiskerStyle;
    boxStyle: BoxStyle;
    outlierStyle: OutlierStyle;
    gridLines: GridLinesConfig;
    dividerLines: DividerLinesConfig;
    referenceLines: ReferenceLinesConfig;
    showJitter: boolean; // Jitter Plot
    jitterOpacity: number; // Opacidade dos pontos do jitter
    tooltip: TooltipConfig;
    padding: number; // Deprecated: usar layout.groupSpacing
    fitWidth: boolean; // Largura 100% do container
    layout: LayoutConfig; // Configurações de layout sofisticadas
    axisLabels: {
        x?: string;
        y?: string;
    };
}

/**
 * Mapeia valores de orientação em português para valores técnicos
 */
function mapOrientation(value: string | undefined): BoxplotOrientation | undefined {
    if (!value) return undefined;
    const normalized = value.toLowerCase();
    if (normalized === 'vertical' || normalized.includes('vertical')) return 'vertical';
    if (normalized === 'horizontal' || normalized.includes('horizontal')) return 'horizontal';
    return undefined;
}

/**
 * Mapeia valores de método de cálculo em português para valores técnicos
 */
function mapCalculationMethod(value: string | undefined): CalculationMethod | undefined {
    if (!value) return undefined;
    const normalized = value.toLowerCase();
    if (normalized.includes('automático') || normalized === 'auto') return 'auto';
    if (normalized.includes('tukey')) return 'tukey';
    if (normalized.includes('inclusivo')) return 'inclusive';
    if (normalized.includes('exclusivo')) return 'exclusive';
    return undefined;
}

/**
 * Mapeia valores de tipo de bigode em português para valores técnicos
 */
function mapWhiskerType(value: string | undefined): WhiskerType | undefined {
    if (!value) return undefined;
    const normalized = value.toLowerCase();
    if (normalized.includes('iqr 1.5') || normalized.includes('1.5') || normalized.includes('padrão')) return 'iqr_1_5';
    if (normalized.includes('iqr 3') || normalized.includes('3x') || normalized.includes('conservador')) return 'iqr_3';
    if (normalized.includes('extremos') || normalized.includes('data_extremes')) return 'data_extremes';
    if (normalized.includes('percentil') || normalized.includes('5-95')) return 'percentile_5_95';
    if (normalized.includes('mínimo') || normalized.includes('min_max')) return 'min_max';
    return undefined;
}

/**
 * Mapeia valores de escala Y em português para valores técnicos
 */
function mapYScale(value: string | undefined): 'linear' | 'log' | undefined {
    if (!value) return undefined;
    const normalized = value.toLowerCase();
    if (normalized.includes('linear') || normalized === 'linear') return 'linear';
    if (normalized.includes('log') || normalized.includes('logarítmica')) return 'log';
    return undefined;
}

/**
 * Mapeia valores de tipo de linha de referência em português para valores técnicos
 */
function mapReferenceLineType(value: string | undefined): ReferenceLineType | undefined {
    if (!value) return undefined;
    const normalized = value.toLowerCase();
    if (normalized.includes('nenhuma') || normalized === 'none') return 'none';
    if (normalized.includes('fixo') || normalized === 'fixed') return 'fixed';
    if (normalized.includes('média') || normalized.includes('mean')) return 'global_mean';
    if (normalized.includes('mediana') || normalized.includes('median')) return 'global_median';
    return undefined;
}

/**
 * Mapeia valores de estilo de layout em português para valores técnicos
 */
function mapLayoutStyle(value: string | undefined): 'compact' | 'normal' | 'spacious' | 'custom' | undefined {
    if (!value) return undefined;
    const normalized = value.toLowerCase();
    if (normalized.includes('compacto')) return 'compact';
    if (normalized.includes('normal')) return 'normal';
    if (normalized.includes('espaçado')) return 'spacious';
    if (normalized.includes('personalizado')) return 'custom';
    return undefined;
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
    const dividerLines = (allVisualProps?.dividerLines || {}) as Record<string, unknown>;
    const tooltipConfig = (allVisualProps?.tooltip || {}) as Record<string, unknown>;
    const layoutConfig = (allVisualProps?.layout || {}) as Record<string, unknown>;
    const referenceLines = (allVisualProps?.referenceLines || {}) as Record<string, unknown>;
    const jitterPlot = (allVisualProps?.jitterPlot || {}) as Record<string, unknown>;

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

    // Reference Lines
    const referenceLinesConfig: ReferenceLinesConfig = {
        show: typeof referenceLines.show === 'boolean' ? referenceLines.show : false,
        type: mapReferenceLineType(referenceLines.type as string) || 'none',
        value: typeof referenceLines.value === 'number' ? referenceLines.value : undefined,
        color: (referenceLines.color as string) || '#ef4444',
        strokeWidth: typeof referenceLines.strokeWidth === 'number' ? referenceLines.strokeWidth : 2,
        strokeDasharray: (referenceLines.strokeDasharray as string) || '5,5',
    };

    // Tooltip
    const tooltip: TooltipConfig = {
        enabled: typeof tooltipConfig.enabled === 'boolean' ? tooltipConfig.enabled : true,
        format: (tooltipConfig.format as 'simple' | 'detailed' | 'custom') || 'simple',
        customTemplate: (tooltipConfig.customTemplate as string) || undefined,
    };

    // Layout
    const padding = typeof layoutConfig.padding === 'number' ? layoutConfig.padding : 10;
    const layout: LayoutConfig = {
        marginTop: typeof layoutConfig.marginTop === 'number' ? layoutConfig.marginTop : undefined,
        marginBottom: typeof layoutConfig.marginBottom === 'number' ? layoutConfig.marginBottom : undefined,
        marginLeft: typeof layoutConfig.marginLeft === 'number' ? layoutConfig.marginLeft : undefined,
        marginRight: typeof layoutConfig.marginRight === 'number' ? layoutConfig.marginRight : undefined,
        groupSpacing: typeof layoutConfig.groupSpacing === 'number' ? layoutConfig.groupSpacing : undefined,
        layoutStyle: (layoutConfig.layoutStyle as 'compact' | 'normal' | 'spacious' | 'custom') || 'normal',
    };
    const axisLabels = {
        x: (layoutConfig.axisLabelX as string) || undefined,
        y: (layoutConfig.axisLabelY as string) || undefined,
    };

    return {
        showYAxis: (axes.showYAxis !== undefined ? axes.showYAxis : chartOptions.showYAxis !== false) as boolean,
        showOutliers: outlierStyle.show,
        orientation: mapOrientation(visualization.orientation as string) || 'vertical',
        boxWidth: typeof boxStyleSection.boxWidth === 'number' ? boxStyleSection.boxWidth : (typeof measureConfig.boxWidth === 'number' ? measureConfig.boxWidth : 60),
        variableWidth: boxStyleSection.variableWidth === true,
        whiskerWidth: whiskerStyle.capWidth, // Usar capWidth como whiskerWidth para compatibilidade
        color: defaultColor,
        opacity: boxStyle.opacity,
        labelFontSize: typeof textSizes.labelFontSize === 'number' ? textSizes.labelFontSize : 12,
        valueLabelFontSize: typeof textSizes.valueLabelFontSize === 'number' ? textSizes.valueLabelFontSize : 10,
        yAxisColor: (colorsStyle.yAxisColor as string) || '#374151',
        xAxisColor: (colorsStyle.xAxisColor as string) || '#374151',
        backgroundColor: (colorsStyle.backgroundColor as string) || 'transparent',
        axisStrokeWidth: typeof colorsStyle.axisStrokeWidth === 'number' ? colorsStyle.axisStrokeWidth : 1.5,
        
        // Novas configurações - mapear valores em português para valores técnicos
        calculationMethod: mapCalculationMethod(dataConfig.calculationMethod as string) || 'auto',
        whiskerType: mapWhiskerType(dataConfig.whiskerType as string) || 'iqr_1_5',
        showMean: medianStyleSection.showMean === true,
        showNotch: medianStyleSection.showNotch === true,
        sortType: (axes.sortType as SortType) || 'Alfabética',
        yScale: mapYScale(chartOptions.yScale as string) || 'linear',
        medianStyle,
        whiskerStyle,
        boxStyle,
        outlierStyle,
        showJitter: jitterPlot.showJitter === true,
        jitterOpacity: typeof jitterPlot.jitterOpacity === 'number' ? jitterPlot.jitterOpacity : 0.5,
        gridLines: gridLinesConfig,
        dividerLines: dividerLinesConfig,
        referenceLines: referenceLinesConfig,
        tooltip,
        padding,
        fitWidth: typeof layoutConfig.fitWidth === 'boolean' ? layoutConfig.fitWidth : false,
        axisLabels,
    };
}

