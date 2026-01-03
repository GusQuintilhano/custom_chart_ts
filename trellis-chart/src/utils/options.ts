/**
 * Módulo para gerenciar opções de configuração do gráfico
 * Centraliza leitura, hierarquia e defaults das opções
 */

/**
 * Hierarquia de leitura de opções:
 * 1. Seção individual (chart_visual, chart_dimensions, chart_divider_lines)
 * 2. chart_options consolidado
 * 3. Valores default
 */

/**
 * Função auxiliar para ler valor com hierarquia correta
 * @param sectionValue Valor da seção individual
 * @param consolidatedValue Valor do chart_options consolidado
 * @param defaultValue Valor padrão
 * @param useHasOwnProperty Se true, ignora valores null/undefined. Se false, aceita valores falsy (como false ou 0)
 * @returns Valor final a ser usado
 */
export function getValue(
    sectionValue: unknown,
    consolidatedValue: unknown,
    defaultValue: unknown,
    useHasOwnProperty = true
): unknown {
    if (useHasOwnProperty) {
        if (sectionValue !== undefined && sectionValue !== null) {
            return sectionValue;
        }
        if (consolidatedValue !== undefined && consolidatedValue !== null) {
            return consolidatedValue;
        }
    } else {
        // Para valores que podem ser falsy (como false ou 0)
        if (sectionValue !== undefined) {
            return sectionValue;
        }
        if (consolidatedValue !== undefined) {
            return consolidatedValue;
        }
    }
    return defaultValue;
}

/**
 * Interface para opções de chart_visual
 */
export interface ChartVisualOptions {
    showYAxis?: boolean;
    showGridLines?: boolean;
    measureNameRotation?: string;
    forceLabels?: boolean;
}

/**
 * Interface para opções de chart_divider_lines
 */
export interface ChartDividerLinesOptions {
    dividerLinesBetweenMeasures?: boolean;
    dividerLinesBetweenGroups?: boolean;
    dividerLinesBetweenBars?: boolean;
    dividerLinesColor?: string;
}

/**
 * Interface para opções de chart_dimensions
 */
export interface ChartDimensionsOptions {
    fitWidth?: boolean;
    fitHeight?: boolean;
    measureLabelSpace?: number;
    measureRowHeight?: number;
    barWidth?: number;
}

/**
 * Interface para opções de text_sizes
 */
export interface ChartTextSizesOptions {
    labelFontSize?: number;
    measureTitleFontSize?: number;
    valueLabelFontSize?: number;
}

/**
 * Interface para opções consolidadas (chart_options)
 */
export interface ChartOptionsConsolidated extends ChartVisualOptions, ChartDividerLinesOptions, ChartDimensionsOptions {}

/**
 * Interface para todas as opções do gráfico após consolidação
 */
export interface ChartOptions {
    // chart_visual
    showYAxis: boolean;
    showGridLines: boolean;
    measureNameRotation: string;
    forceLabels: boolean;
    
    // chart_divider_lines
    dividerLinesBetweenMeasures: boolean;
    dividerLinesBetweenGroups: boolean;
    dividerLinesBetweenBars: boolean;
    dividerLinesColor: string;
    
    // chart_dimensions
    fitWidth: boolean;
    fitHeight: boolean;
    measureLabelSpace: number | null; // null = usar default baseado em showYAxis
    measureRowHeight: number;
    barWidth: number;
}

/**
 * Lê e consolida todas as opções do gráfico seguindo a hierarquia correta
 * @param allVisualProps Props visuais completos do ThoughtSpot
 * @returns Objeto ChartOptions com todas as opções consolidadas
 */
export function readChartOptions(allVisualProps: Record<string, unknown>): ChartOptions {
    // Extrair seções individuais
    const chartVisual = (allVisualProps?.chart_visual || {}) as ChartVisualOptions;
    const chartDimensions = (allVisualProps?.chart_dimensions || {}) as ChartDimensionsOptions;
    const chartDividerLines = (allVisualProps?.chart_divider_lines || {}) as ChartDividerLinesOptions;
    const chartOptionsConsolidated = (allVisualProps?.chart_options || allVisualProps?.chartOptions || {}) as ChartOptionsConsolidated;
    
    // Construir chartOptions seguindo hierarquia: seção individual > consolidado > default
    const chartOptions: ChartOptions = {
        // Valores de chart_visual (prioridade máxima)
        showYAxis: getValue(chartVisual.showYAxis, chartOptionsConsolidated.showYAxis, true, true) !== false,
        showGridLines: getValue(chartVisual.showGridLines, chartOptionsConsolidated.showGridLines, true, true) !== false,
        measureNameRotation: getValue(chartVisual.measureNameRotation, chartOptionsConsolidated.measureNameRotation, '-90', false) as string,
        forceLabels: getValue(chartVisual.forceLabels, chartOptionsConsolidated.forceLabels, false, true) === true,
        
        // Valores de chart_divider_lines (prioridade máxima)
        dividerLinesBetweenMeasures: getValue(chartDividerLines.dividerLinesBetweenMeasures, chartOptionsConsolidated.dividerLinesBetweenMeasures, true, true) !== false,
        dividerLinesBetweenGroups: getValue(chartDividerLines.dividerLinesBetweenGroups, chartOptionsConsolidated.dividerLinesBetweenGroups, true, true) !== false,
        dividerLinesBetweenBars: getValue(chartDividerLines.dividerLinesBetweenBars, chartOptionsConsolidated.dividerLinesBetweenBars, false, true) === true,
        dividerLinesColor: getValue(chartDividerLines.dividerLinesColor, chartOptionsConsolidated.dividerLinesColor, '#d1d5db', false) as string,
        
        // Valores de chart_dimensions (prioridade máxima)
        fitWidth: getValue(chartDimensions.fitWidth, chartOptionsConsolidated.fitWidth, false, true) === true,
        fitHeight: getValue(chartDimensions.fitHeight, chartOptionsConsolidated.fitHeight, false, true) === true,
        measureLabelSpace: getValue(chartDimensions.measureLabelSpace, chartOptionsConsolidated.measureLabelSpace, null, false) as number | null,
        measureRowHeight: getValue(chartDimensions.measureRowHeight, chartOptionsConsolidated.measureRowHeight, 50, false) as number,
        barWidth: getValue(chartDimensions.barWidth, chartOptionsConsolidated.barWidth, 40, false) as number,
    };
    
    return chartOptions;
}

/**
 * Lê valores salvos para uso no visualPropEditorDefinition
 * Usa a mesma hierarquia: seção individual > consolidado > default
 * @param allSavedProps Props salvos completos
 * @returns Objeto com valores salvos por seção
 */
export function readSavedValues(allSavedProps: Record<string, unknown>): {
    chartVisual: ChartVisualOptions;
    chartDimensions: ChartDimensionsOptions;
    chartDividerLines: ChartDividerLinesOptions;
    chartOptions: ChartOptionsConsolidated;
    textSizes: ChartTextSizesOptions;
} {
    const savedChartVisual = (allSavedProps?.chart_visual || {}) as ChartVisualOptions;
    const savedChartDimensions = (allSavedProps?.chart_dimensions || {}) as ChartDimensionsOptions;
    const savedChartDividerLines = (allSavedProps?.chart_divider_lines || {}) as ChartDividerLinesOptions;
    const savedChartOptions = (allSavedProps?.chart_options || {}) as ChartOptionsConsolidated;
    const savedTextSizes = (allSavedProps?.text_sizes || {}) as ChartTextSizesOptions;
    
    return {
        chartVisual: savedChartVisual,
        chartDimensions: savedChartDimensions,
        chartDividerLines: savedChartDividerLines,
        chartOptions: savedChartOptions,
        textSizes: savedTextSizes,
    };
}

/**
 * Função auxiliar simplificada para ler valor salvo (usada no editor)
 * @param sectionValue Valor da seção individual
 * @param consolidatedValue Valor do chart_options consolidado
 * @param defaultValue Valor padrão
 * @returns Valor final a ser usado
 */
export function getSavedValue(
    sectionValue: unknown,
    consolidatedValue: unknown,
    defaultValue: unknown
): unknown {
    if (sectionValue !== undefined) {
        return sectionValue;
    }
    if (consolidatedValue !== undefined) {
        return consolidatedValue;
    }
    return defaultValue;
}

