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
    const boxStyle = (savedConfig.boxStyle || {}) as Record<string, unknown>;
    const medianStyle = (savedConfig.medianStyle || {}) as Record<string, unknown>;
    const whiskerStyle = (savedConfig.whiskerStyle || {}) as Record<string, unknown>;
    const outlierStyle = (savedConfig.outlierStyle || {}) as Record<string, unknown>;
    const dataConfig = (savedConfig.dataConfig || {}) as Record<string, unknown>;

    const measureElements: any[] = [];

    // Seção 1: Configurações de Dados
    measureElements.push({
        type: 'section',
        key: 'dataConfig',
        label: 'Configurações de Dados',
        isAccordianExpanded: false,
        children: [
            {
                type: 'dropdown',
                key: 'calculationMethod',
                label: 'Método de Cálculo dos Quartis',
                defaultValue: String(dataConfig.calculationMethod || 'Automático'),
                values: ['Automático', 'Tukey (Recomendado)', 'Inclusivo', 'Exclusivo'],
            },
            {
                type: 'dropdown',
                key: 'whiskerType',
                label: 'Tipo de Bigode (Whisker)',
                defaultValue: String(dataConfig.whiskerType || 'IQR 1.5x (Padrão)'),
                values: ['IQR 1.5x (Padrão)', 'IQR 3x (Conservador)', 'Extremos dos Dados', 'Percentis 5-95', 'Mínimo-Máximo'],
            },
        ],
    });

    // Seção 2: Estilo do Box
    const boxFill = typeof boxStyle.fill === 'string' ? boxStyle.fill : (visualization.color || defaultColors[0]);
    const boxStroke = typeof boxStyle.stroke === 'string' ? boxStyle.stroke : '#374151';
    const boxStrokeWidth = typeof boxStyle.strokeWidth === 'number' ? boxStyle.strokeWidth : 1;
    const boxOpacity = typeof savedConfig.opacity === 'number' ? savedConfig.opacity : 0.8;
    const boxBorderRadius = typeof boxStyle.borderRadius === 'number' ? boxStyle.borderRadius : 0;

    measureElements.push({
        type: 'section',
        key: 'boxStyle',
        label: 'Estilo da Caixa',
        isAccordianExpanded: true,
        children: [
            {
                type: 'colorpicker',
                key: 'fill',
                label: 'Cor de Preenchimento',
                selectorType: 'COLOR',
                defaultValue: String(boxFill),
            },
            {
                type: 'colorpicker',
                key: 'stroke',
                label: 'Cor da Borda',
                selectorType: 'COLOR',
                defaultValue: String(boxStroke),
            },
            {
                type: 'number',
                key: 'strokeWidth',
                label: 'Espessura da Borda (px)',
                defaultValue: Number(boxStrokeWidth) || 1,
            },
            {
                type: 'number',
                key: 'opacity',
                label: 'Opacidade (0-1)',
                defaultValue: Number(boxOpacity) || 0.8,
            },
            {
                type: 'number',
                key: 'boxWidth',
                label: 'Largura da Caixa (px)',
                defaultValue: typeof savedConfig.boxWidth === 'number' ? savedConfig.boxWidth : 60,
            },
            {
                type: 'number',
                key: 'borderRadius',
                label: 'Raio da Borda (px)',
                defaultValue: Number(boxBorderRadius) || 0,
            },
        ],
    });

    // Seção 3: Elementos Internos e Whiskers
    const medianColor = typeof medianStyle.color === 'string' ? medianStyle.color : '#000000';
    const medianStrokeWidth = typeof medianStyle.strokeWidth === 'number' ? medianStyle.strokeWidth : 2;
    const whiskerColor = typeof whiskerStyle.color === 'string' ? whiskerStyle.color : (visualization.color || defaultColors[0]);
    const whiskerStrokeWidth = typeof whiskerStyle.strokeWidth === 'number' ? whiskerStyle.strokeWidth : 1;
    const whiskerCapWidth = typeof whiskerStyle.capWidth === 'number' ? whiskerStyle.capWidth : (typeof savedConfig.whiskerWidth === 'number' ? savedConfig.whiskerWidth : 40);

    measureElements.push({
        type: 'section',
        key: 'medianWhiskers',
        label: 'Mediana e Bigodes',
        isAccordianExpanded: false,
        children: [
            {
                type: 'colorpicker',
                key: 'medianColor',
                label: 'Cor da Mediana',
                selectorType: 'COLOR',
                defaultValue: String(medianColor),
            },
            {
                type: 'number',
                key: 'medianStrokeWidth',
                label: 'Espessura da Mediana (px)',
                defaultValue: Number(medianStrokeWidth) || 2,
            },
            {
                type: 'dropdown',
                key: 'medianStrokeDash',
                label: 'Estilo da Mediana',
                defaultValue: String(medianStyle.strokeDasharray || 'none'),
                values: ['none', '5,5', '10,5', '3,3'],
            },
            {
                type: 'toggle',
                key: 'showMean',
                label: 'Mostrar Média',
                defaultValue: savedConfig.showMean === true,
            },
            {
                type: 'toggle',
                key: 'showNotch',
                label: 'Notch Mode (Intervalo de Confiança)',
                defaultValue: savedConfig.showNotch === true,
            },
            {
                type: 'colorpicker',
                key: 'whiskerColor',
                label: 'Cor dos Bigodes',
                selectorType: 'COLOR',
                defaultValue: String(whiskerColor),
            },
            {
                type: 'number',
                key: 'whiskerStrokeWidth',
                label: 'Espessura dos Bigodes (px)',
                defaultValue: Number(whiskerStrokeWidth) || 1,
            },
            {
                type: 'number',
                key: 'whiskerCapWidth',
                label: 'Largura do Cap do Bigode (px)',
                defaultValue: Number(whiskerCapWidth) || 40,
            },
        ],
    });

    // Seção 4: Outliers
    const outlierShow = outlierStyle.show !== undefined ? outlierStyle.show : (savedConfig.showOutliers !== false);
    const outlierShape = typeof outlierStyle.shape === 'string' ? outlierStyle.shape : 'circle';
    const outlierSize = typeof outlierStyle.size === 'number' ? outlierStyle.size : 4;
    const outlierFill = typeof outlierStyle.fill === 'string' ? outlierStyle.fill : '#ef4444';
    const outlierStroke = typeof outlierStyle.stroke === 'string' ? outlierStyle.stroke : '#000000';
    const outlierStrokeWidth = typeof outlierStyle.strokeWidth === 'number' ? outlierStyle.strokeWidth : 1;

    measureElements.push({
        type: 'section',
        key: 'outlierStyle',
        label: 'Outliers (Valores Atípicos)',
        isAccordianExpanded: false,
        children: [
            {
                type: 'toggle',
                key: 'show',
                label: 'Mostrar Outliers',
                defaultValue: Boolean(outlierShow),
            },
            {
                type: 'dropdown',
                key: 'shape',
                label: 'Formato do Outlier',
                defaultValue: String(outlierShape),
                values: ['circle', 'cross', 'diamond', 'square', 'triangle'],
            },
            {
                type: 'number',
                key: 'size',
                label: 'Tamanho do Outlier (px)',
                defaultValue: Number(outlierSize) || 4,
            },
            {
                type: 'colorpicker',
                key: 'fill',
                label: 'Cor de Preenchimento',
                selectorType: 'COLOR',
                defaultValue: String(outlierFill),
            },
            {
                type: 'colorpicker',
                key: 'stroke',
                label: 'Cor da Borda',
                selectorType: 'COLOR',
                defaultValue: String(outlierStroke),
            },
            {
                type: 'number',
                key: 'strokeWidth',
                label: 'Espessura da Borda (px)',
                defaultValue: Number(outlierStrokeWidth) || 1,
            },
        ],
    });

    // Seção 5: Visualização Geral (mantida para compatibilidade)
    measureElements.push({
        type: 'section',
        key: 'visualization',
        label: 'Visualização',
        isAccordianExpanded: false,
        children: [
            {
                type: 'dropdown',
                key: 'orientation',
                label: 'Orientação',
                defaultValue: String(visualization.orientation || 'Vertical'),
                values: ['Vertical', 'Horizontal'],
            },
            {
                type: 'colorpicker',
                key: 'color',
                label: 'Cor Padrão',
                selectorType: 'COLOR',
                defaultValue: String(visualization.color || defaultColors[0]),
            },
        ],
    });

    return {
        [measureColumn.id]: {
            elements: measureElements,
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
    savedChartColorsStyle: any,
    currentVisualProps?: Record<string, unknown>
): any[] {
    const elements: any[] = [];
    const allVisualProps = currentVisualProps || {};
    const gridLines = (allVisualProps.gridLines || {}) as Record<string, unknown>;
    const tooltipConfig = (allVisualProps.tooltip || {}) as Record<string, unknown>;
    const layoutConfig = (allVisualProps.layout || {}) as Record<string, unknown>;

    // Seção 1: Layout e Espaçamento
    const paddingValue = typeof layoutConfig.padding === 'number' ? layoutConfig.padding : 10;
    const fitWidthValue = typeof layoutConfig.fitWidth === 'boolean' ? layoutConfig.fitWidth : false;
    const marginTopValue = typeof layoutConfig.marginTop === 'number' ? layoutConfig.marginTop : undefined;
    const marginBottomValue = typeof layoutConfig.marginBottom === 'number' ? layoutConfig.marginBottom : undefined;
    const marginLeftValue = typeof layoutConfig.marginLeft === 'number' ? layoutConfig.marginLeft : undefined;
    const marginRightValue = typeof layoutConfig.marginRight === 'number' ? layoutConfig.marginRight : undefined;
    const groupSpacingValue = typeof layoutConfig.groupSpacing === 'number' ? layoutConfig.groupSpacing : undefined;
    const layoutStyleValue = typeof layoutConfig.layoutStyle === 'string' ? layoutConfig.layoutStyle : 'normal';
    const dividerLines = (allVisualProps.dividerLines || {}) as Record<string, unknown>;
    const dividerLinesShow = typeof dividerLines.show === 'boolean' ? dividerLines.show : false;
    const dividerLinesColor = typeof dividerLines.color === 'string' ? dividerLines.color : '#e5e7eb';
    const dividerLinesStrokeWidth = typeof dividerLines.strokeWidth === 'number' ? dividerLines.strokeWidth : 1;

    elements.push({
        type: 'section',
        key: 'layout',
        label: 'Layout e Espaçamento',
        isAccordianExpanded: false,
        children: [
            {
                type: 'dropdown',
                key: 'layoutStyle',
                label: 'Estilo de Layout',
                defaultValue: String(layoutStyleValue || 'normal'),
                values: ['Compacto', 'Normal', 'Espaçado', 'Personalizado'],
            },
            {
                type: 'toggle',
                key: 'fitWidth',
                label: 'Largura 100%',
                defaultValue: Boolean(fitWidthValue),
            },
            {
                type: 'number',
                key: 'marginTop',
                label: 'Margem Superior (px)',
                defaultValue: marginTopValue !== undefined ? Number(marginTopValue) : undefined,
            },
            {
                type: 'number',
                key: 'marginBottom',
                label: 'Margem Inferior (px)',
                defaultValue: marginBottomValue !== undefined ? Number(marginBottomValue) : undefined,
            },
            {
                type: 'number',
                key: 'marginLeft',
                label: 'Margem Esquerda (px)',
                defaultValue: marginLeftValue !== undefined ? Number(marginLeftValue) : undefined,
            },
            {
                type: 'number',
                key: 'marginRight',
                label: 'Margem Direita (px)',
                defaultValue: marginRightValue !== undefined ? Number(marginRightValue) : undefined,
            },
            {
                type: 'number',
                key: 'groupSpacing',
                label: 'Espaçamento entre Grupos (px)',
                defaultValue: groupSpacingValue !== undefined ? Number(groupSpacingValue) : undefined,
            },
            {
                type: 'number',
                key: 'padding',
                label: 'Espaçamento entre Grupos (px) - Legado',
                defaultValue: Number(paddingValue) || 10,
            },
        ],
    });

    elements.push({
        type: 'section',
        key: 'dividerLines',
        label: 'Linhas Divisórias entre Grupos',
        isAccordianExpanded: false,
        children: [
            {
                type: 'toggle',
                key: 'show',
                label: 'Mostrar Linhas Divisórias',
                defaultValue: Boolean(dividerLinesShow),
            },
            {
                type: 'colorpicker',
                key: 'color',
                label: 'Cor das Linhas',
                selectorType: 'COLOR',
                defaultValue: String(dividerLinesColor),
            },
            {
                type: 'number',
                key: 'strokeWidth',
                label: 'Espessura (px)',
                defaultValue: Number(dividerLinesStrokeWidth) || 1,
            },
        ],
    });

    // Seção 2: Eixos
    const sortTypeValue = typeof savedChartOptions?.sortType === 'string' ? savedChartOptions.sortType : 'Alfabética';
    
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
            {
                type: 'dropdown',
                key: 'sortType',
                label: 'Ordenação dos Grupos',
                defaultValue: String(sortTypeValue),
                values: ['Alfabética', 'Média (Crescente)', 'Média (Decrescente)', 'Mediana (Crescente)', 'Mediana (Decrescente)', 'Variabilidade (Crescente)', 'Variabilidade (Decrescente)'],
            },
            {
                type: 'dropdown',
                key: 'yScale',
                label: 'Escala do Eixo Y',
                defaultValue: String(savedChartOptions?.yScale || 'Linear'),
                values: ['Linear', 'Logarítmica'],
            },
        ],
    });

    // Seção 3: Linhas de Referência
    const referenceLines = (allVisualProps.referenceLines || {}) as Record<string, unknown>;
    const refLinesShow = typeof referenceLines.show === 'boolean' ? referenceLines.show : false;
    const refLinesType = typeof referenceLines.type === 'string' ? referenceLines.type : 'none';
    const refLinesValue = typeof referenceLines.value === 'number' ? referenceLines.value : undefined;
    const refLinesColor = typeof referenceLines.color === 'string' ? referenceLines.color : '#ef4444';
    const refLinesStrokeWidth = typeof referenceLines.strokeWidth === 'number' ? referenceLines.strokeWidth : 2;
    
    elements.push({
        type: 'section',
        key: 'referenceLines',
        label: 'Linhas de Referência',
        isAccordianExpanded: false,
        children: [
            {
                type: 'toggle',
                key: 'show',
                label: 'Mostrar Linhas de Referência',
                defaultValue: Boolean(refLinesShow),
            },
            {
                type: 'dropdown',
                key: 'type',
                label: 'Tipo de Linha',
                defaultValue: String(refLinesType || 'Nenhuma'),
                values: ['Nenhuma', 'Valor Fixo', 'Média Global', 'Mediana Global'],
            },
            {
                type: 'number',
                key: 'value',
                label: 'Valor Fixo (quando tipo = Valor Fixo)',
                defaultValue: refLinesValue !== undefined ? Number(refLinesValue) : undefined,
            },
            {
                type: 'colorpicker',
                key: 'color',
                label: 'Cor da Linha',
                selectorType: 'COLOR',
                defaultValue: String(refLinesColor),
            },
            {
                type: 'number',
                key: 'strokeWidth',
                label: 'Espessura da Linha (px)',
                defaultValue: Number(refLinesStrokeWidth) || 2,
            },
        ],
    });

    // Seção: Jitter Plot (Dispersão Total)
    const jitterShow = savedChartOptions?.showJitter === true;
    const jitterOpacity = typeof savedChartOptions?.jitterOpacity === 'number' ? savedChartOptions.jitterOpacity : 0.5;
    
    elements.push({
        type: 'section',
        key: 'jitterPlot',
        label: 'Jitter Plot (Dispersão Total)',
        isAccordianExpanded: false,
        children: [
            {
                type: 'toggle',
                key: 'showJitter',
                label: 'Mostrar Jitter Plot',
                defaultValue: Boolean(jitterShow),
            },
            {
                type: 'number',
                key: 'jitterOpacity',
                label: 'Opacidade dos Pontos (0-1)',
                defaultValue: Number(jitterOpacity) || 0.5,
            },
        ],
    });

    // Seção 4: Linhas de Grade
    const gridShow = typeof gridLines.show === 'boolean' ? gridLines.show : false;
    const gridColor = typeof gridLines.color === 'string' ? gridLines.color : '#e5e7eb';
    const gridStrokeWidth = typeof gridLines.strokeWidth === 'number' ? gridLines.strokeWidth : 1;

    elements.push({
        type: 'section',
        key: 'gridLines',
        label: 'Linhas de Grade',
        isAccordianExpanded: false,
        children: [
            {
                type: 'toggle',
                key: 'show',
                label: 'Mostrar Linhas de Grade',
                defaultValue: Boolean(gridShow),
            },
            {
                type: 'colorpicker',
                key: 'color',
                label: 'Cor das Linhas de Grade',
                selectorType: 'COLOR',
                defaultValue: String(gridColor),
            },
            {
                type: 'number',
                key: 'strokeWidth',
                label: 'Espessura das Linhas (px)',
                defaultValue: Number(gridStrokeWidth) || 1,
            },
            {
                type: 'dropdown',
                key: 'strokeDash',
                label: 'Estilo das Linhas',
                defaultValue: String(gridLines.strokeDasharray || 'none'),
                values: ['none', '5,5', '10,5', '3,3'],
            },
        ],
    });

    // Seção 4: Tooltip (Dica de Contexto)
    const tooltipEnabled = typeof tooltipConfig.enabled === 'boolean' ? tooltipConfig.enabled : true;
    const tooltipFormat = typeof tooltipConfig.format === 'string' ? tooltipConfig.format : 'simple';

    elements.push({
        type: 'section',
        key: 'tooltip',
        label: 'Dica de Contexto (Tooltip)',
        isAccordianExpanded: false,
        children: [
            {
                type: 'toggle',
                key: 'enabled',
                label: 'Habilitar Tooltip',
                defaultValue: Boolean(tooltipEnabled),
            },
            {
                type: 'dropdown',
                key: 'format',
                label: 'Formato do Tooltip',
                defaultValue: String(tooltipFormat),
                values: ['simple', 'detailed', 'custom'],
            },
        ],
    });

    // Seção: Tipografia
    // Garantir valores numéricos válidos (não undefined/null)
    const labelFontSizeValue = typeof savedTextSizes?.labelFontSize === 'number' ? savedTextSizes.labelFontSize : 12;
    const valueLabelFontSizeValue = typeof savedTextSizes?.valueLabelFontSize === 'number' ? savedTextSizes.valueLabelFontSize : 10;
    
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
                defaultValue: Number(labelFontSizeValue) || 12,
            },
            {
                type: 'number',
                key: 'valueLabelFontSize',
                label: 'Tamanho dos Valores (px)',
                defaultValue: Number(valueLabelFontSizeValue) || 10,
            },
        ],
    });

    // Seção: Cores e Estilo
    // Garantir valores válidos (não undefined/null)
    const yAxisColorValue = typeof savedChartColorsStyle?.yAxisColor === 'string' ? savedChartColorsStyle.yAxisColor : '#374151';
    const xAxisColorValue = typeof savedChartColorsStyle?.xAxisColor === 'string' ? savedChartColorsStyle.xAxisColor : '#374151';
    const backgroundColorValue = typeof savedChartColorsStyle?.backgroundColor === 'string' ? savedChartColorsStyle.backgroundColor : '#ffffff';
    const axisStrokeWidthValue = typeof savedChartColorsStyle?.axisStrokeWidth === 'number' ? savedChartColorsStyle.axisStrokeWidth : 1.5;
    
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
                defaultValue: String(yAxisColorValue),
            },
            {
                type: 'colorpicker',
                key: 'xAxisColor',
                label: 'Cor do Eixo X',
                selectorType: 'COLOR',
                defaultValue: String(xAxisColorValue),
            },
            {
                type: 'colorpicker',
                key: 'backgroundColor',
                label: 'Cor de Fundo',
                selectorType: 'COLOR',
                defaultValue: String(backgroundColorValue),
            },
            {
                type: 'number',
                key: 'axisStrokeWidth',
                label: 'Espessura dos Eixos (px)',
                defaultValue: Number(axisStrokeWidthValue) || 1.5,
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
    
    const dimensionColumns = chartModel.columns.filter(
        (col) => col.type === ColumnType.ATTRIBUTE
    );

    const allSavedProps = (chartModel.visualProps as Record<string, unknown>) || {};

    const editorSections = createEditorSections(
        savedChartVisual,
        savedChartDimensions,
        savedChartOptions,
        savedTextSizes,
        savedChartColorsStyle,
        allSavedProps
    );

    // Criar configurações por coluna para aparecer na aba "Configure"
    const columnsVizPropDefinition: any[] = [];
    
    if (measureColumns.length > 0) {
        const measureColumnSettings = createMeasureColumnSettings(measureColumns[0], chartModel);
        if (Object.keys(measureColumnSettings).length > 0) {
            columnsVizPropDefinition.push({
                type: ColumnType.MEASURE,
                columnSettingsDefinition: measureColumnSettings,
            });
        }
    }
    

    const result: VisualPropEditorDefinition = {
        elements: editorSections,
        ...(columnsVizPropDefinition.length > 0 && { columnsVizPropDefinition }),
    };

    return result;
}

/**
 * Cria a definição do Chart Config Editor
 */
export function createChartConfigEditorDefinition(): ChartConfigEditorDefinition[] {
    return [
        {
            key: 'column',
            label: 'Atributos e Medidas',
            descriptionText: 'Boxplot requer 1 medida, pelo menos 1 dimensão para categoria (Eixo X), e opcionalmente 1 dimensão para detalhe/granularidade (pontos do gráfico).',
            columnSections: [
                {
                    key: 'x',
                    label: 'Categoria/Atributo (Eixo X)',
                    allowAttributeColumns: true,
                    allowMeasureColumns: false,
                    allowTimeSeriesColumns: true,
                },
                {
                    key: 'detail',
                    label: 'Detalhe/Granularidade (Pontos do Gráfico)',
                    allowAttributeColumns: true,
                    allowMeasureColumns: false,
                    allowTimeSeriesColumns: true,
                },
                {
                    key: 'y',
                    label: 'Medida/Métrica',
                    allowAttributeColumns: false,
                    allowMeasureColumns: true,
                    allowTimeSeriesColumns: false,
                },
            ],
        },
    ];
}

