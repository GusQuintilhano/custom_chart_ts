/**
 * Configuração do editor de propriedades visuais para Boxplot Chart
 */

import { ChartModel, ChartColumn, ColumnType, VisualPropEditorDefinition, ChartConfigEditorDefinition } from '@thoughtspot/ts-chart-sdk';
import { logger } from '@shared/utils/logger';

const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

/**
 * Cria configurações específicas para a medida
 */
function createMeasureColumnSettings(
    measureColumn: ChartColumn,
    currentVisualProps: ChartModel
): { [columnId: string]: { elements: any[] } } {
    const savedConfig = (currentVisualProps.visualProps as any)?.[measureColumn.id] || {};
    const visualization = (savedConfig.visualization || {}) as Record<string, unknown>;

    return {
        [measureColumn.id]: {
            elements: [
                {
                    type: 'section',
                    key: 'visualization',
                    label: 'Visualização',
                    isAccordianExpanded: true,
                    children: [
                        {
                            type: 'colorpicker',
                            key: 'color',
                            label: 'Cor',
                            selectorType: 'COLOR',
                            defaultValue: visualization.color || defaultColors[0],
                        },
                        {
                            type: 'number',
                            key: 'opacity',
                            label: 'Opacidade',
                            defaultValue: savedConfig.opacity ?? 0.8,
                            min: 0,
                            max: 1,
                            step: 0.1,
                        },
                        {
                            type: 'dropdown',
                            key: 'orientation',
                            label: 'Orientação',
                            defaultValue: savedConfig.orientation || 'vertical',
                            values: [
                                { label: 'Vertical', value: 'vertical' },
                                { label: 'Horizontal', value: 'horizontal' },
                            ],
                        },
                        {
                            type: 'toggle',
                            key: 'showOutliers',
                            label: 'Mostrar Outliers',
                            defaultValue: savedConfig.showOutliers !== false,
                        },
                        {
                            type: 'number',
                            key: 'boxWidth',
                            label: 'Largura da Caixa (px)',
                            defaultValue: savedConfig.boxWidth ?? 60,
                            min: 20,
                            max: 200,
                        },
                        {
                            type: 'number',
                            key: 'whiskerWidth',
                            label: 'Largura dos Bigodes (px)',
                            defaultValue: savedConfig.whiskerWidth ?? 40,
                            min: 20,
                            max: 100,
                        },
                    ],
                },
            ],
        },
    };
}

/**
 * Cria seções gerais de configuração
 */
function createEditorSections(
    savedChartVisual: any,
    savedChartDimensions: any,
    savedChartOptions: any,
    savedTextSizes: any,
    savedChartColorsStyle: any
): any[] {
    const elements: any[] = [];

    // Seção: Eixos
    elements.push({
        type: 'section',
        key: 'axes',
        label: 'Eixos',
        isAccordianExpanded: false,
        children: [
            {
                type: 'toggle',
                key: 'showYAxis',
                label: 'Exibir Eixo Y',
                defaultValue: savedChartVisual?.showYAxis !== false,
            },
        ],
    });

    // Seção: Tipografia
    elements.push({
        type: 'section',
        key: 'text_sizes',
        label: 'Tipografia e Textos',
        isAccordianExpanded: false,
        children: [
            {
                type: 'number',
                key: 'labelFontSize',
                label: 'Tamanho das Labels (px)',
                defaultValue: savedTextSizes?.labelFontSize ?? 12,
            },
            {
                type: 'number',
                key: 'valueLabelFontSize',
                label: 'Tamanho dos Valores (px)',
                defaultValue: savedTextSizes?.valueLabelFontSize ?? 10,
            },
        ],
    });

    // Seção: Cores e Estilo
    elements.push({
        type: 'section',
        key: 'chart_colors_style',
        label: 'Cores e Estilo',
        isAccordianExpanded: false,
        children: [
            {
                type: 'colorpicker',
                key: 'yAxisColor',
                label: 'Cor do Eixo Y',
                selectorType: 'COLOR',
                defaultValue: savedChartColorsStyle?.yAxisColor || '#374151',
            },
            {
                type: 'colorpicker',
                key: 'xAxisColor',
                label: 'Cor do Eixo X',
                selectorType: 'COLOR',
                defaultValue: savedChartColorsStyle?.xAxisColor || '#374151',
            },
            {
                type: 'colorpicker',
                key: 'backgroundColor',
                label: 'Cor de Fundo',
                selectorType: 'COLOR',
                defaultValue: savedChartColorsStyle?.backgroundColor || '#ffffff',
            },
            {
                type: 'number',
                key: 'axisStrokeWidth',
                label: 'Espessura dos Eixos (px)',
                defaultValue: savedChartColorsStyle?.axisStrokeWidth ?? 1.5,
                min: 0.5,
                max: 5,
                step: 0.1,
            },
        ],
    });

    return elements;
}

/**
 * Cria a definição do Visual Prop Editor
 */
export function createVisualPropEditorDefinition(
    chartModel: ChartModel,
    ctx: any
): VisualPropEditorDefinition {
    const savedChartVisual = (chartModel.visualProps as any)?.chart_visual || {};
    const savedChartDimensions = (chartModel.visualProps as any)?.chart_dimensions || {};
    const savedChartOptions = (chartModel.visualProps as any)?.chart_options || {};
    const savedTextSizes = (chartModel.visualProps as any)?.text_sizes || {};
    const savedChartColorsStyle = (chartModel.visualProps as any)?.chart_colors_style || {};

    const measureColumns = chartModel.columns.filter(
        (col) => col.type === ColumnType.MEASURE
    );

    const columnSettingsDefinition = measureColumns.length > 0
        ? createMeasureColumnSettings(measureColumns[0], chartModel)
        : {};

    const editorSections = createEditorSections(
        savedChartVisual,
        savedChartDimensions,
        savedChartOptions,
        savedTextSizes,
        savedChartColorsStyle
    );

    return {
        elements: editorSections,
    };
}

/**
 * Cria a definição do Chart Config Editor
 */
export function createChartConfigEditorDefinition(): ChartConfigEditorDefinition[] {
    return [
        {
            key: 'column',
            label: 'Atributos e Medidas',
            descriptionText: 'Boxplot requer 1 medida e múltiplas dimensões para agrupamento.',
            columnSections: [
                {
                    key: 'x',
                    label: 'Eixo X (Dimensões)',
                    allowAttributeColumns: true,
                    allowMeasureColumns: false,
                    allowTimeSeriesColumns: true,
                },
                {
                    key: 'y',
                    label: 'Eixo Y (Medida)',
                    allowAttributeColumns: false,
                    allowMeasureColumns: true,
                    allowTimeSeriesColumns: false,
                },
            ],
        },
    ];
}

