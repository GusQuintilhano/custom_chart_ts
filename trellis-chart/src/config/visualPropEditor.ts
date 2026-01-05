/**
 * Configuração do editor de propriedades visuais (Visual Prop Editor)
 */

import { ChartModel, ColumnType, CustomChartContext, VisualPropEditorDefinition, ChartConfigEditorDefinition, ChartColumn } from '@thoughtspot/ts-chart-sdk';
import { readSavedValues, getSavedValue } from '../utils/options';
import { logger } from '../utils/logger';

const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];

/**
 * Verifica se uma coluna é do tipo data
 */
function isDateColumn(column: ChartColumn): boolean {
    const colAny = column as any;
    
    // Verificar dataType: 7 geralmente indica DATE/TIMESTAMP
    if (colAny.dataType === 7) {
        return true;
    }
    
    // Verificar se tem format com pattern de data
    const format = colAny.format;
    if (format && format.pattern) {
        const datePatterns = /(dd|MM|yyyy|HH|mm|ss)/i;
        if (datePatterns.test(format.pattern)) {
            return true;
        }
    }
    
    // Verificar se tem timeBucket > 0 (indica série temporal/data agregada)
    if (colAny.timeBucket && colAny.timeBucket > 0) {
        return true;
    }
    
    return false;
}

/**
 * Cria elementos de configuração para medidas
 */
function createMeasureColumnSettings(
    measureColumns: ChartColumn[],
    currentVisualProps: ChartModel
): { [columnId: string]: { elements: any[] } } {
    const measureColumnSettings: { [columnId: string]: { elements: any[] } } = {};
    
    measureColumns.forEach((measure: ChartColumn, idx: number) => {
        const defaultColor = defaultColors[idx % defaultColors.length];
        const savedConfigOld = (currentVisualProps.visualProps as any)?.[`measure_${measure.id}`];
        const savedConfigNew = (currentVisualProps.visualProps as any)?.[measure.id];
        const savedConfig = savedConfigNew || savedConfigOld || {};
        
        const measureElements: any[] = [
            {
                type: 'dropdown',
                key: 'chartType',
                label: 'Tipo de Gráfico',
                defaultValue: savedConfig?.chartType || 'bar',
                values: ['bar', 'line'],
            },
            {
                type: 'colorpicker',
                key: 'color',
                label: 'Cor',
                selectorType: 'COLOR',
                defaultValue: savedConfig?.color || defaultColor,
            },
            {
                type: 'number',
                key: 'opacity',
                label: 'Opacidade (0-1)',
                defaultValue: savedConfig?.opacity ?? 0.9,
                min: 0,
                max: 1,
                step: 0.1,
            },
        ];
        
        measureColumnSettings[measure.id] = {
            elements: measureElements,
        };
    });
    
    return measureColumnSettings;
}

/**
 * Cria elementos de configuração para dimensões
 */
function createDimensionColumnSettings(
    dimensionColumns: ChartColumn[],
    currentVisualProps: ChartModel
): { [columnId: string]: { elements: any[] } } {
    const dimensionColumnSettings: { [columnId: string]: { elements: any[] } } = {};
    
    dimensionColumns.forEach((dimension: ChartColumn) => {
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
            dimensionColumnSettings[dimension.id] = { elements };
        }
    });
    
    return dimensionColumnSettings;
}

/**
 * Cria seções de configuração para o editor de propriedades visuais
 */
function createEditorSections(
    savedChartVisual: any,
    savedChartDimensions: any,
    savedChartDividerLines: any,
    savedChartOptions: any,
    savedTextSizes: any,
    savedChartColorsStyle: any,
    savedChartTooltip: any
): any[] {
    const elements: any[] = [];
    
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
        {
            type: 'dropdown',
            key: 'measureNameRotation',
            label: 'Rotação do Nome da Medida',
            defaultValue: getSavedValue(savedChartVisual.measureNameRotation, savedChartOptions.measureNameRotation, '-90'),
            values: ['-90', '0', '45', '-45', '90'],
        },
        {
            type: 'toggle',
            key: 'forceLabels',
            label: 'Forçar Labels',
            defaultValue: getSavedValue(savedChartVisual.forceLabels, savedChartOptions.forceLabels, false) === true,
        },
    ];
    
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
        const defaultDividerColor = getSavedValue(savedChartDividerLines.dividerLinesColor, savedChartOptions.dividerLinesColor, '#d1d5db');
        const dividerLinesBetweenMeasuresEnabled = getSavedValue(savedChartDividerLines.dividerLinesBetweenMeasures, savedChartOptions.dividerLinesBetweenMeasures, true) !== false;
        const dividerLinesBetweenGroupsEnabled = getSavedValue(savedChartDividerLines.dividerLinesBetweenGroups, savedChartOptions.dividerLinesBetweenGroups, true) !== false;
        const dividerLinesBetweenBarsEnabled = getSavedValue(savedChartDividerLines.dividerLinesBetweenBars, savedChartOptions.dividerLinesBetweenBars, false) === true;
        
        const dividerLinesChildren: any[] = [
            {
                type: 'toggle',
                key: 'dividerLinesBetweenMeasures',
                label: 'Linhas entre Medidas',
                defaultValue: dividerLinesBetweenMeasuresEnabled,
            },
            ...(dividerLinesBetweenMeasuresEnabled ? [
                {
                    type: 'colorpicker',
                    key: 'dividerLinesBetweenMeasuresColor',
                    label: 'Cor - Linhas entre Medidas',
                    selectorType: 'COLOR',
                    defaultValue: getSavedValue(savedChartDividerLines.dividerLinesBetweenMeasuresColor, savedChartOptions.dividerLinesBetweenMeasuresColor, defaultDividerColor),
                },
                {
                    type: 'number',
                    key: 'dividerLinesBetweenMeasuresWidth',
                    label: 'Espessura - Linhas entre Medidas (px)',
                    defaultValue: getSavedValue(savedChartDividerLines.dividerLinesBetweenMeasuresWidth, savedChartOptions.dividerLinesBetweenMeasuresWidth, 1) ?? 1,
                },
            ] : []),
            {
                type: 'toggle',
                key: 'dividerLinesBetweenGroups',
                label: 'Linhas entre Grupos',
                defaultValue: dividerLinesBetweenGroupsEnabled,
            },
            ...(dividerLinesBetweenGroupsEnabled ? [
                {
                    type: 'colorpicker',
                    key: 'dividerLinesBetweenGroupsColor',
                    label: 'Cor - Linhas entre Grupos',
                    selectorType: 'COLOR',
                    defaultValue: getSavedValue(savedChartDividerLines.dividerLinesBetweenGroupsColor, savedChartOptions.dividerLinesBetweenGroupsColor, defaultDividerColor),
                },
                {
                    type: 'number',
                    key: 'dividerLinesBetweenGroupsWidth',
                    label: 'Espessura - Linhas entre Grupos (px)',
                    defaultValue: getSavedValue(savedChartDividerLines.dividerLinesBetweenGroupsWidth, savedChartOptions.dividerLinesBetweenGroupsWidth, 1) ?? 1,
                },
            ] : []),
            {
                type: 'toggle',
                key: 'dividerLinesBetweenBars',
                label: 'Linhas entre Barras',
                defaultValue: dividerLinesBetweenBarsEnabled,
            },
            ...(dividerLinesBetweenBarsEnabled ? [
                {
                    type: 'colorpicker',
                    key: 'dividerLinesBetweenBarsColor',
                    label: 'Cor - Linhas entre Barras',
                    selectorType: 'COLOR',
                    defaultValue: getSavedValue(savedChartDividerLines.dividerLinesBetweenBarsColor, savedChartOptions.dividerLinesBetweenBarsColor, defaultDividerColor),
                },
                {
                    type: 'number',
                    key: 'dividerLinesBetweenBarsWidth',
                    label: 'Espessura - Linhas entre Barras (px)',
                    defaultValue: getSavedValue(savedChartDividerLines.dividerLinesBetweenBarsWidth, savedChartOptions.dividerLinesBetweenBarsWidth, 1) ?? 1,
                },
            ] : []),
        ];
        
        elements.push({
            type: 'section',
            key: 'chart_divider_lines',
            label: 'Configurações de Linhas Divisórias',
            isAccordianExpanded: false,
            children: dividerLinesChildren,
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
            },
            {
                type: 'number',
                key: 'barSpacing',
                label: 'Espaçamento Entre Barras (px)',
                defaultValue: getSavedValue(savedChartDimensions.barSpacing, savedChartOptions.barSpacing, savedShowYAxis ? 20 : 15),
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
    
    // Seção para cores e estilo - TEMPORARIAMENTE REMOVIDA PARA DEBUG
    // elements.push({
    //     type: 'section',
    //     key: 'chart_colors_style',
    //     label: 'Cores e Estilo',
    //     isAccordianExpanded: false,
    //     children: [
    //         {
    //             type: 'colorpicker',
    //             key: 'yAxisColor',
    //             label: 'Cor do Eixo Y',
    //             selectorType: 'COLOR',
    //             defaultValue: savedChartColorsStyle?.yAxisColor || '#374151',
    //         },
    //         {
    //             type: 'colorpicker',
    //             key: 'xAxisColor',
    //             label: 'Cor do Eixo X',
    //             selectorType: 'COLOR',
    //             defaultValue: savedChartColorsStyle?.xAxisColor || '#374151',
    //         },
    //         {
    //             type: 'colorpicker',
    //             key: 'backgroundColor',
    //             label: 'Cor de Fundo',
    //             selectorType: 'COLOR',
    //             defaultValue: savedChartColorsStyle?.backgroundColor || '#ffffff',
    //         },
    //         {
    //             type: 'number',
    //             key: 'axisStrokeWidth',
    //             label: 'Espessura dos Eixos (px)',
    //             defaultValue: savedChartColorsStyle?.axisStrokeWidth ?? 1.5,
    //             min: 0.5,
    //             max: 5,
    //             step: 0.1,
    //         },
    //     ],
    // });
    
    // Seção para tooltip - TEMPORARIAMENTE REMOVIDA PARA DEBUG
    // const tooltipEnabled = (savedChartTooltip?.enabled === true) || false;
    // const tooltipChildren: any[] = [
    //     {
    //         type: 'toggle',
    //         key: 'enabled',
    //         label: 'Habilitar Tooltip',
    //         defaultValue: tooltipEnabled,
    //     },
    // ];
    // 
    // if (tooltipEnabled) {
    //     tooltipChildren.push(
    //         {
    //             type: 'dropdown',
    //             key: 'format',
    //             label: 'Formato do Tooltip',
    //             defaultValue: savedChartTooltip?.format || 'simple',
    //             values: ['simple', 'detailed'],
    //             labels: ['Simples', 'Detalhado'],
    //         },
    //         {
    //             type: 'toggle',
    //             key: 'showAllMeasures',
    //             label: 'Mostrar Todas as Medidas',
    //             defaultValue: (savedChartTooltip?.showAllMeasures === true) || false,
    //         },
    //         {
    //             type: 'colorpicker',
    //             key: 'backgroundColor',
    //             label: 'Cor de Fundo do Tooltip',
    //             selectorType: 'COLOR',
    //             defaultValue: savedChartTooltip?.backgroundColor || '#ffffff',
    //         }
    //     );
    // }
    // 
    // elements.push({
    //     type: 'section',
    //     key: 'chart_tooltip',
    //     label: 'Tooltip',
    //     isAccordianExpanded: false,
    //     children: tooltipChildren,
    // });
    
    return elements;
}

/**
 * Cria a definição completa do editor de propriedades visuais
 */
export function createVisualPropEditorDefinition(
    currentVisualProps: ChartModel,
    ctx: CustomChartContext,
): VisualPropEditorDefinition {
    logger.debug('🎨 [DEBUG] visualPropEditorDefinition chamado');
    logger.debug('🎨 [DEBUG] currentVisualProps:', currentVisualProps);
    
    const columns = currentVisualProps.columns || [];
    const measureColumns = columns.filter((col: ChartColumn) => col.type === ColumnType.MEASURE);
    const dimensionColumns = columns.filter((col: ChartColumn) => col.type === ColumnType.ATTRIBUTE);
    
    logger.debug('🎨 [DEBUG] Medidas encontradas para configuração:', measureColumns.map((m: ChartColumn) => m.name));
    logger.debug('🎨 [DEBUG] Dimensões encontradas para configuração:', dimensionColumns.map((d: ChartColumn) => d.name));
    
    // Ler valores salvos
    const allSavedProps = (currentVisualProps.visualProps as Record<string, unknown>) || {};
    const { chartVisual: savedChartVisual, chartDimensions: savedChartDimensions, chartDividerLines: savedChartDividerLines, chartOptions: savedChartOptions, textSizes: savedTextSizes, chartColorsStyle: savedChartColorsStyle, chartTooltip: savedChartTooltip } = readSavedValues(allSavedProps);
    
    // Criar seções do editor
    const elements = createEditorSections(
        savedChartVisual,
        savedChartDimensions,
        savedChartDividerLines,
        savedChartOptions,
        savedTextSizes,
        savedChartColorsStyle,
        savedChartTooltip
    );
    
    // Criar configurações por coluna para aparecer na aba "Configure"
    const columnsVizPropDefinition: any[] = [];
    
    if (measureColumns.length > 0) {
        const measureColumnSettings = createMeasureColumnSettings(measureColumns, currentVisualProps);
        if (Object.keys(measureColumnSettings).length > 0) {
            columnsVizPropDefinition.push({
                type: ColumnType.MEASURE,
                columnSettingsDefinition: measureColumnSettings,
            });
        }
    }
    
    if (dimensionColumns.length > 0) {
        const dimensionColumnSettings = createDimensionColumnSettings(dimensionColumns, currentVisualProps);
        if (Object.keys(dimensionColumnSettings).length > 0) {
            columnsVizPropDefinition.push({
                type: ColumnType.ATTRIBUTE,
                columnSettingsDefinition: dimensionColumnSettings,
            });
        }
    }
    
    // Criar assinatura baseada nas colunas para forçar o ThoughtSpot a re-executar getDefaultChartConfig
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
        
        if (measureColumns.length !== measuresInConfig) {
            logger.debug(`DISCREPÂNCIA DETECTADA: ${measureColumns.length} medidas no chartModel, mas ${measuresInConfig} medidas no columnsVizPropDefinition`);
            logger.debug('Isso indica que getDefaultChartConfig precisa ser re-executado!');
            logger.debug('Medidas no chartModel:', measureColumns.map(m => ({ id: m.id, name: m.name })));
            logger.debug('IDs no columnsVizPropDefinition:', Object.keys(columnsVizPropDefinition[0].columnSettingsDefinition || {}));
        }
    }
    logger.debug('🎨 [DEBUG] ===== FIM visualPropEditorDefinition =====');
    
    return result;
}

/**
 * Cria a definição do editor de configuração do gráfico
 */
export function createChartConfigEditorDefinition(): ChartConfigEditorDefinition[] {
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
}

