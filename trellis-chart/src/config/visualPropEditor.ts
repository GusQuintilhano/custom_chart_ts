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
        
        // Organização das opções em seções
        const measureElements: any[] = [];
        
        // Seção 1: Visualização
        measureElements.push({
            type: 'section',
            key: 'visualization',
            label: 'Visualização',
            isAccordianExpanded: true,
            children: [
                {
                    type: 'dropdown',
                    key: 'chartType',
                    label: 'Tipo de Gráfico',
                    defaultValue: savedConfig?.chartType || 'barras',
                    values: ['barras', 'linha'],
                },
                {
                    type: 'colorpicker',
                    key: 'color',
                    label: 'Cor',
                    selectorType: 'COLOR',
                    defaultValue: savedConfig?.color || defaultColor,
                },
            ],
        });
        
        // Seção 2: Formatação de Números
        measureElements.push({
            type: 'section',
            key: 'number_formatting',
            label: 'Formatação de Números',
            isAccordianExpanded: false,
            children: [
                {
                    type: 'dropdown',
                    key: 'format',
                    label: 'Formato do Número',
                    defaultValue: savedConfig?.format || 'decimal',
                    values: ['decimal', 'porcentagem', 'moeda', 'cientifico', 'inteiro'],
                },
                {
                    type: 'number',
                    key: 'decimals',
                    label: 'Casas Decimais',
                    defaultValue: savedConfig?.decimals ?? 2,
                },
                {
                    type: 'toggle',
                    key: 'useThousandsSeparator',
                    label: 'Usar Separador de Milhares',
                    defaultValue: savedConfig?.useThousandsSeparator !== false,
                },
            ],
        });
        
        // Seção 3: Labels e Valores
        measureElements.push({
            type: 'section',
            key: 'labels_values',
            label: 'Labels e Valores',
            isAccordianExpanded: false,
            children: [
                {
                    type: 'dropdown',
                    key: 'valueLabelPosition',
                    label: 'Posição do Label de Valor',
                    defaultValue: savedConfig?.valueLabelPosition || 'automático',
                    values: ['automático', 'acima', 'dentro-superior', 'dentro-centro', 'abaixo'],
                },
                {
                    type: 'dropdown',
                    key: 'valueFormat',
                    label: 'Formato de Valor',
                    defaultValue: savedConfig?.valueFormat || 'normal',
                    values: ['normal', 'compacto'],
                },
                {
                    type: 'toggle',
                    key: 'showZeroValues',
                    label: 'Exibir Valores Zero',
                    defaultValue: savedConfig?.showZeroValues !== false,
                },
                {
                    type: 'toggle',
                    key: 'showYAxisValues',
                    label: 'Exibir Valores no Eixo Y',
                    defaultValue: savedConfig?.showYAxisValues !== false,
                },
            ],
        });
        
        // Seção 4: Linha de Referência
        measureElements.push({
            type: 'section',
            key: 'reference_line',
            label: 'Linha de Referência',
            isAccordianExpanded: false,
            children: [
                {
                    type: 'toggle',
                    key: 'referenceLine_enabled',
                    label: 'Habilitar Linha de Referência',
                    defaultValue: (savedConfig as any)?.referenceLine_enabled === true,
                },
                {
                    type: 'number',
                    key: 'referenceLine_value',
                    label: 'Valor da Linha de Referência',
                    defaultValue: (savedConfig as any)?.referenceLine_value ?? 0,
                },
                {
                    type: 'colorpicker',
                    key: 'referenceLine_color',
                    label: 'Cor da Linha de Referência',
                    selectorType: 'COLOR',
                    defaultValue: (savedConfig as any)?.referenceLine_color || '#ef4444',
                },
                {
                    type: 'dropdown',
                    key: 'referenceLine_style',
                    label: 'Estilo da Linha',
                    defaultValue: (savedConfig as any)?.referenceLine_style || 'sólida',
                    values: ['sólida', 'tracejada', 'pontilhada'],
                },
                {
                    type: 'toggle',
                    key: 'referenceLine_showLabel',
                    label: 'Exibir Label na Linha',
                    defaultValue: (savedConfig as any)?.referenceLine_showLabel !== false,
                },
            ],
        });
        
        // Seção 5: Dica de Contexto (Tooltip)
        measureElements.push({
            type: 'section',
            key: 'tooltip',
            label: 'Dica de Contexto',
            isAccordianExpanded: false,
            children: [
                {
                    type: 'toggle',
                    key: 'tooltip_enabled',
                    label: 'Habilitar Dica de Contexto',
                    defaultValue: (savedConfig as any)?.tooltip_enabled !== false,
                },
                {
                    type: 'dropdown',
                    key: 'tooltip_format',
                    label: 'Formato da Dica',
                    defaultValue: (savedConfig as any)?.tooltip_format || 'simples',
                    values: ['simples', 'detalhado'],
                },
                {
                    type: 'colorpicker',
                    key: 'tooltip_backgroundColor',
                    label: 'Cor de Fundo da Dica',
                    selectorType: 'COLOR',
                    defaultValue: (savedConfig as any)?.tooltip_backgroundColor || '#ffffff',
                },
                {
                    type: 'dropdown',
                    key: 'tooltip_layout',
                    label: 'Layout da Dica de Contexto',
                    defaultValue: (savedConfig as any)?.tooltip_layout || 'vertical',
                    values: ['vertical', 'horizontal', 'grade'],
                },
            ],
        });
        
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
    savedChartTooltip: any,
    currentVisualProps?: Record<string, unknown>
): any[] {
    const elements: any[] = [];
    
    // Ler valores atuais das props (se disponíveis) para calcular condicionais dinamicamente
    const currentChartDividerLines = (currentVisualProps?.chart_divider_lines || {}) as any;
    const currentChartTooltip = (currentVisualProps?.chart_tooltip || {}) as any;
    
    // Seção 1: Eixos
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
                defaultValue: getSavedValue(savedChartVisual.showYAxis, savedChartOptions.showYAxis, true) !== false,
            },
        ],
    });
    
    // Seção 2: Linhas Divisórias
    // Usar valores atuais se disponíveis (para condicionais dinâmicas), senão usar valores salvos
    const showGridLinesValue = (currentChartDividerLines.showGridLines !== undefined
        ? currentChartDividerLines.showGridLines !== false
        : (savedChartDividerLines as any).showGridLines !== undefined
        ? (savedChartDividerLines as any).showGridLines !== false
        : getSavedValue(savedChartVisual.showGridLines, savedChartOptions.showGridLines, true) !== false);
    const defaultDividerColor = getSavedValue(savedChartDividerLines.dividerLinesColor, savedChartOptions.dividerLinesColor, '#d1d5db');
    const dividerLinesBetweenMeasuresEnabled = (currentChartDividerLines.dividerLinesBetweenMeasures !== undefined
        ? currentChartDividerLines.dividerLinesBetweenMeasures !== false
        : getSavedValue(savedChartDividerLines.dividerLinesBetweenMeasures, savedChartOptions.dividerLinesBetweenMeasures, true) !== false);
    const dividerLinesBetweenGroupsEnabled = (currentChartDividerLines.dividerLinesBetweenGroups !== undefined
        ? currentChartDividerLines.dividerLinesBetweenGroups !== false
        : getSavedValue(savedChartDividerLines.dividerLinesBetweenGroups, savedChartOptions.dividerLinesBetweenGroups, true) !== false);
    const dividerLinesBetweenBarsEnabled = (currentChartDividerLines.dividerLinesBetweenBars !== undefined
        ? currentChartDividerLines.dividerLinesBetweenBars === true
        : getSavedValue(savedChartDividerLines.dividerLinesBetweenBars, savedChartOptions.dividerLinesBetweenBars, false) === true);
    
    // Sempre mostrar a seção (não usar condicional - limitação do SDK)
    const dividerLinesChildren: any[] = [
            {
                type: 'toggle',
                key: 'showGridLines',
                label: 'Exibir Linhas Divisórias',
                defaultValue: showGridLinesValue,
            },
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
        label: 'Linhas Divisórias',
        isAccordianExpanded: false,
        children: dividerLinesChildren,
    });
    
    // Seção 3: Tipografia e Textos
    elements.push({
        type: 'section',
        key: 'text_sizes',
        label: 'Tipografia e Textos',
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
            {
                type: 'dropdown',
                key: 'measureNameRotation',
                label: 'Rotação do Nome da Medida',
                defaultValue: (savedTextSizes as any).measureNameRotation !== undefined
                    ? (savedTextSizes as any).measureNameRotation
                    : getSavedValue(savedChartVisual.measureNameRotation, savedChartOptions.measureNameRotation, '-90'),
                values: ['-90', '0', '45', '-45', '90'],
            },
            {
                type: 'toggle',
                key: 'forceLabels',
                label: 'Forçar Exibição de Labels',
                defaultValue: (savedTextSizes as any).forceLabels !== undefined
                    ? (savedTextSizes as any).forceLabels === true
                    : getSavedValue(savedChartVisual.forceLabels, savedChartOptions.forceLabels, false) === true,
            },
        ],
    });
    
    // Seção 4: Dimensões e Espaçamento
    const savedFitWidth = getSavedValue(savedChartDimensions.fitWidth, savedChartOptions.fitWidth, false) === true;
    const savedShowYAxis = getSavedValue(savedChartVisual.showYAxis, savedChartOptions.showYAxis, true) !== false;
    elements.push({
        type: 'section',
        key: 'chart_dimensions',
        label: 'Dimensões e Espaçamento',
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
    
    
    // Seção para cores e estilo - TEMPORARIAMENTE REMOVIDA PARA DEBUG DO ERRO elements[4]
    // TODO: Investigar por que o ThoughtSpot SDK está rejeitando esta seção no índice 4
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
    
    // Seção para tooltip
    // Usar valor atual se disponível (para condicionais dinâmicas), senão usar valor salvo
    const tooltipEnabled = (currentChartTooltip?.enabled !== undefined
        ? currentChartTooltip.enabled === true
        : (savedChartTooltip?.enabled === true)) || false;
    const tooltipChildren: any[] = [
        {
            type: 'toggle',
            key: 'enabled',
            label: 'Habilitar Tooltip',
            defaultValue: tooltipEnabled,
        },
    ];
    
    // Mostrar opções somente se tooltip estiver habilitado
    if (tooltipEnabled) {
        tooltipChildren.push(
            {
                type: 'dropdown',
                key: 'format',
                label: 'Formato do Tooltip',
                defaultValue: savedChartTooltip?.format || 'simple',
                values: ['simple', 'detailed'],
            },
            {
                type: 'toggle',
                key: 'showAllMeasures',
                label: 'Mostrar Todas as Medidas',
                defaultValue: (savedChartTooltip?.showAllMeasures === true) || false,
            },
            {
                type: 'colorpicker',
                key: 'backgroundColor',
                label: 'Cor de Fundo do Tooltip',
                selectorType: 'COLOR',
                defaultValue: savedChartTooltip?.backgroundColor || '#ffffff',
            },
            {
                type: 'dropdown',
                key: 'customTemplate',
                label: 'Template Personalizado',
                defaultValue: savedChartTooltip?.customTemplate || 'default',
                values: [
                    'default',
                    'valor_medida_dimensao1_dimensao2',
                    'medida_valor_dimensao1',
                    'dimensao1_medida_valor',
                    'dimensao2_dimensao1_medida_valor',
                    'valor_medida',
                    'medida_valor',
                ],
            }
        );
    }
    
    // Seção 5: Dicas de Contexto (Tooltip)
    elements.push({
        type: 'section',
        key: 'chart_tooltip',
        label: 'Dicas de Contexto (Tooltip)',
        isAccordianExpanded: false,
        children: tooltipChildren,
    });
    
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
    
    // Criar seções do editor (passar allSavedProps para permitir condicionais dinâmicas)
    const elements = createEditorSections(
        savedChartVisual,
        savedChartDimensions,
        savedChartDividerLines,
        savedChartOptions,
        savedTextSizes,
        savedChartColorsStyle,
        savedChartTooltip,
        allSavedProps
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
    
    logger.debug('===== ASSINATURA DAS COLUNAS =====');
    logger.debug('Total de colunas:', columns.length);
    logger.debug('Total de medidas:', measureColumns.length);
    logger.debug('Total de dimensões:', dimensionColumns.length);
    logger.debug('IDs das medidas:', measureIds);
    logger.debug('Assinatura das colunas:', columnSignature);
    logger.debug('Assinatura das medidas:', measureSignature);
    
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
            label: 'Atributos e Medidas',
            descriptionText: 'O eixo X pode ter apenas atributos/dimensões. O eixo Y pode ter apenas medidas.',
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
                    label: 'Eixo Y (Medidas)',
                    allowAttributeColumns: false,
                    allowMeasureColumns: true,
                    allowTimeSeriesColumns: false,
                },
            ],
        },
    ];
}

