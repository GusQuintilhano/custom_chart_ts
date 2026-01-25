/**
 * Módulo para gerenciamento de tooltips interativos
 */

import type { ChartDataPoint, MeasureConfig } from '../types/chartTypes';
import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import { formatValue, formatDimension } from '@shared/utils/formatters';
import { processTooltipTemplate } from '../utils/tooltipTemplate';
import { getTemplateById } from '../utils/tooltipTemplates';
import { formatCustomSimpleTooltip, formatCustomDetailedTooltip } from './tooltipFormatter';
import { analytics } from '@shared/utils/analytics';

export interface TooltipConfig {
    enabled: boolean;
    format: 'simple' | 'detailed';
    showAllMeasures: boolean;
    backgroundColor: string;
    customTemplate?: string;
}

export interface TooltipData {
    chartData: ChartDataPoint[];
    measureCols: ChartColumn[];
    measureConfigs: MeasureConfig[];
    primaryDateFormat?: string;
    secondaryDateFormat?: string;
}

/**
 * Cria e retorna o elemento HTML do tooltip
 */
function createTooltipElement(backgroundColor: string): HTMLElement {
    let tooltip = document.getElementById('chart-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'chart-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            pointer-events: none;
            background: ${backgroundColor};
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.2s;
            max-width: 350px;
            line-height: 1.5;
            word-wrap: break-word;
        `;
        document.body.appendChild(tooltip);
    } else {
        tooltip.style.background = backgroundColor;
    }
    return tooltip;
}

/**
 * Formata o conteúdo do tooltip no formato simples
 */
function formatSimpleTooltip(
    dataPoint: ChartDataPoint,
    measureIdx: number,
    measureConfig: MeasureConfig,
    measureCol: ChartColumn,
    primaryDateFormat?: string,
    customTemplate?: string
): string {
    // Se há template personalizado, usar ele
    if (customTemplate && customTemplate !== 'default' && customTemplate.trim() !== '') {
        // Converter ID do template para string do template
        const templateString = getTemplateById(customTemplate as any);
        if (templateString) {
            // Note: secondaryDateFormat não está disponível neste contexto, mas processTooltipTemplate trata isso
            const templateResult = processTooltipTemplate(templateString, {
                dataPoint,
                measureIdx,
                measureCol,
                measureConfig: {
                    format: measureConfig.format,
                    decimals: measureConfig.decimals,
                    useThousandsSeparator: measureConfig.useThousandsSeparator,
                    valueFormat: measureConfig.valueFormat,
                    valuePrefix: measureConfig.valuePrefix,
                    valueSuffix: measureConfig.valueSuffix,
                },
                primaryDateFormat,
                secondaryDateFormat: undefined, // Não disponível no contexto simples
            });
            if (templateResult) {
                return templateResult;
            }
        }
    }

    // Formato padrão
    const value = dataPoint.values[measureIdx] || 0;
    const format = measureConfig.format || 'decimal';
    const decimals = measureConfig.decimals ?? 2;
    const useThousandsSeparator = measureConfig.useThousandsSeparator ?? true;
    const valueFormat = measureConfig.valueFormat || 'normal';
    const valuePrefix = measureConfig.valuePrefix || '';
    const valueSuffix = measureConfig.valueSuffix || '';

    // Para rotação, usar 'normal' no formatValue (tooltips não rotacionam)
    const formatValueForFormatting = valueFormat === 'rotacionado' ? 'normal' : valueFormat;
    const formattedValue = formatValue(
        value,
        format,
        decimals,
        useThousandsSeparator,
        formatValueForFormatting as 'normal' | 'compacto',
        valuePrefix,
        valueSuffix,
        true
    );

    const primaryLabel = formatDimension(dataPoint.primaryLabel, primaryDateFormat);
    const measureName = measureCol.name;

    return `<strong>${measureName}</strong><br/>${primaryLabel}: ${formattedValue}`;
}

/**
 * Formata o conteúdo do tooltip no formato detalhado
 */
function formatDetailedTooltip(
    dataPoint: ChartDataPoint,
    measureCols: ChartColumn[],
    measureConfigs: MeasureConfig[],
    showAllMeasures: boolean,
    primaryDateFormat?: string,
    secondaryDateFormat?: string
): string {
    const primaryLabel = formatDimension(dataPoint.primaryLabel, primaryDateFormat);
    const secondaryLabels = dataPoint.secondaryLabels || [];
    
    let html = `<div style="margin-bottom: 4px;"><strong>${primaryLabel}</strong></div>`;
    
    if (secondaryLabels.length > 0) {
        const secondaryLabel = formatDimension(secondaryLabels[0], secondaryDateFormat);
        html += `<div style="margin-bottom: 6px; color: #6b7280; font-size: 11px;">${secondaryLabel}</div>`;
    }

    const measuresToShow = showAllMeasures ? measureCols : [measureCols[0]];
    
    html += '<div style="margin-top: 6px;">';
    measuresToShow.forEach((measureCol, idx) => {
        const measureConfig = measureConfigs[idx];
        const value = dataPoint.values[idx] || 0;
        const format = measureConfig.format || 'decimal';
        const decimals = measureConfig.decimals ?? 2;
        const useThousandsSeparator = measureConfig.useThousandsSeparator ?? true;
        const valueFormat = measureConfig.valueFormat || 'normal';
        const valuePrefix = measureConfig.valuePrefix || '';
        const valueSuffix = measureConfig.valueSuffix || '';

        // Para rotação, usar 'normal' no formatValue (tooltips não rotacionam)
        const formatValueForFormatting = valueFormat === 'rotacionado' ? 'normal' : valueFormat;
        const formattedValue = formatValue(
            value,
            format,
            decimals,
            useThousandsSeparator,
            formatValueForFormatting as 'normal' | 'compacto',
            valuePrefix,
            valueSuffix,
            true
        );

        const color = measureConfig.color || '#3b82f6';
        html += `
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <span style="display: inline-block; width: 12px; height: 12px; background: ${color}; border-radius: 2px; margin-right: 6px;"></span>
                <span><strong>${measureCol.name}:</strong> ${formattedValue}</span>
            </div>
        `;
    });
    html += '</div>';

    return html;
}

/**
 * Mostra o tooltip na posição especificada
 */
function showTooltip(
    tooltip: HTMLElement,
    content: string,
    x: number,
    y: number,
    elementWidth: number = 0,
    elementHeight: number = 0
): void {
    tooltip.innerHTML = content;
    tooltip.style.opacity = '1';
    tooltip.style.display = 'block';
    
    // Rastrear interação de tooltip
    analytics.trackInteraction('trellis', 'tooltip_open', 'tooltip', {
        position: { x, y },
        elementSize: { width: elementWidth, height: elementHeight },
    });

    // Reposicionar para evitar sair da tela
    const rect = tooltip.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = x + elementWidth / 2 + 10;
    let top = y - rect.height / 2;

    // Ajustar se sair da tela
    if (left + rect.width > windowWidth) {
        left = x - rect.width - 10;
    }
    if (top + rect.height > windowHeight) {
        top = windowHeight - rect.height - 10;
    }
    if (top < 0) {
        top = 10;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

/**
 * Esconde o tooltip
 */
function hideTooltip(tooltip: HTMLElement): void {
    tooltip.style.opacity = '0';
    setTimeout(() => {
        tooltip.style.display = 'none';
    }, 200);
}

/**
 * Adiciona event listeners de tooltip aos elementos do gráfico
 */
export function setupTooltips(
    chartElement: HTMLElement,
    tooltipConfig: TooltipConfig | null,
    tooltipData: TooltipData
): void {
    const { chartData, measureCols, measureConfigs, primaryDateFormat, secondaryDateFormat } = tooltipData;

    // Encontrar todos os elementos clicáveis (barras, pontos de linha, etc)
    const svg = chartElement.querySelector('svg');
    if (!svg) {
        return;
    }

    // Criar tooltip único (será reutilizado para todos os elementos)
    const defaultBackgroundColor = tooltipConfig?.backgroundColor || '#ffffff';
    let tooltip = document.getElementById('chart-tooltip');
    if (!tooltip) {
        tooltip = createTooltipElement(defaultBackgroundColor);
    }

    // Adicionar listeners aos retângulos (barras)
    const rects = svg.querySelectorAll('rect[data-measure-index][data-data-index]');
    rects.forEach((rect) => {
        const measureIdx = parseInt((rect as HTMLElement).dataset.measureIndex || '0', 10);
        const dataIdx = parseInt((rect as HTMLElement).dataset.dataIndex || '0', 10);
        const dataPoint = chartData[dataIdx];
        const measureConfig = measureConfigs[measureIdx];
        const measureCol = measureCols[measureIdx];

        if (!dataPoint || !measureConfig) {
            return;
        }

        // IMPORTANTE: Se tooltipConfig for null, significa que tooltip está desabilitado no nível global
        // Neste caso, não mostrar tooltip mesmo que a medida tenha configuração individual
        if (!tooltipConfig || tooltipConfig.enabled === false) {
            return;
        }
        
        // Usar configuração da medida se disponível, senão usar configuração global
        const measureTooltipConfig = measureConfig.tooltip;
        // Verificar se tooltip está habilitado para esta medida específica
        // Se measureTooltipConfig existe e enabled é false, desabilitar para esta medida
        // Se measureTooltipConfig não existe, usar configuração global (que já sabemos que está habilitada)
        const measureEnabled = measureTooltipConfig !== undefined 
            ? measureTooltipConfig.enabled !== false 
            : true; // Se não há configuração individual, usar global (que já está habilitada)
        
        if (!measureEnabled) {
            return;
        }

        // Mapear formato de português para inglês se necessário
        const formatRaw = measureTooltipConfig?.format || tooltipConfig?.format || 'simple';
        const format = (formatRaw === 'detalhado' || formatRaw === 'detailed') ? 'detailed' : 
                      (formatRaw === 'simples' || formatRaw === 'simple') ? 'simple' : formatRaw;
        const backgroundColor = measureTooltipConfig?.backgroundColor || tooltipConfig?.backgroundColor || '#ffffff';
        const customTemplate = tooltipConfig?.customTemplate || '';
        
        rect.addEventListener('mouseenter', (e) => {
            const target = e.target as SVGElement;
            const bbox = target.getBoundingClientRect();
            
            // Atualizar cor de fundo do tooltip para esta medida específica
            if (tooltip) {
                (tooltip as HTMLElement).style.background = backgroundColor;
            }
            
            // Usar formatação customizada que aplica layout
            let content: string;
            if (customTemplate && customTemplate !== 'default' && customTemplate.trim() !== '') {
                // Se há template personalizado, usar formatação padrão (sem layout customizado)
                content = format === 'detailed'
                    ? formatDetailedTooltip(dataPoint, measureCols, measureConfigs, false, primaryDateFormat, secondaryDateFormat)
                    : formatSimpleTooltip(dataPoint, measureIdx, measureConfig, measureCol, primaryDateFormat, customTemplate);
            } else {
                // Usar formatação customizada que aplica layout
                content = format === 'detailed'
                    ? formatCustomDetailedTooltip(dataPoint, measureCols, measureConfigs, primaryDateFormat, secondaryDateFormat)
                    : formatCustomSimpleTooltip(dataPoint, measureIdx, measureConfig, measureCol, primaryDateFormat);
            }
            
            if (tooltip) {
                showTooltip(tooltip, content, bbox.left, bbox.top, bbox.width, bbox.height);
            }
        });

        rect.addEventListener('mouseleave', () => {
            if (tooltip) {
                hideTooltip(tooltip);
            }
        });
    });

    // Adicionar listeners aos círculos (pontos de linha)
    const circles = svg.querySelectorAll('circle[data-measure-index][data-data-index]');
    circles.forEach((circle) => {
        const measureIdx = parseInt((circle as HTMLElement).dataset.measureIndex || '0', 10);
        const dataIdx = parseInt((circle as HTMLElement).dataset.dataIndex || '0', 10);
        const dataPoint = chartData[dataIdx];
        const measureConfig = measureConfigs[measureIdx];
        const measureCol = measureCols[measureIdx];

        if (!dataPoint || !measureConfig) {
            return;
        }

        // IMPORTANTE: Se tooltipConfig for null, significa que tooltip está desabilitado no nível global
        // Neste caso, não mostrar tooltip mesmo que a medida tenha configuração individual
        if (!tooltipConfig || tooltipConfig.enabled === false) {
            return;
        }
        
        // Usar configuração da medida se disponível, senão usar configuração global
        const measureTooltipConfig = measureConfig.tooltip;
        // Verificar se tooltip está habilitado para esta medida específica
        // Se measureTooltipConfig existe e enabled é false, desabilitar para esta medida
        // Se measureTooltipConfig não existe, usar configuração global (que já sabemos que está habilitada)
        const measureEnabled = measureTooltipConfig !== undefined 
            ? measureTooltipConfig.enabled !== false 
            : true; // Se não há configuração individual, usar global (que já está habilitada)
        
        if (!measureEnabled) {
            return;
        }

        // Mapear formato de português para inglês se necessário
        const formatRaw = measureTooltipConfig?.format || tooltipConfig?.format || 'simple';
        const format = (formatRaw === 'detalhado' || formatRaw === 'detailed') ? 'detailed' : 
                      (formatRaw === 'simples' || formatRaw === 'simple') ? 'simple' : formatRaw;
        const backgroundColor = measureTooltipConfig?.backgroundColor || tooltipConfig?.backgroundColor || '#ffffff';
        const customTemplate = tooltipConfig?.customTemplate || '';
        
        circle.addEventListener('mouseenter', (e) => {
            const target = e.target as SVGElement;
            const bbox = target.getBoundingClientRect();
            
            // Atualizar cor de fundo do tooltip para esta medida específica
            if (tooltip) {
                (tooltip as HTMLElement).style.background = backgroundColor;
            }
            
            // Usar formatação customizada que aplica layout
            let content: string;
            if (customTemplate && customTemplate !== 'default' && customTemplate.trim() !== '') {
                // Se há template personalizado, usar formatação padrão (sem layout customizado)
                content = format === 'detailed'
                    ? formatDetailedTooltip(dataPoint, measureCols, measureConfigs, false, primaryDateFormat, secondaryDateFormat)
                    : formatSimpleTooltip(dataPoint, measureIdx, measureConfig, measureCol, primaryDateFormat, customTemplate);
            } else {
                // Usar formatação customizada que aplica layout
                content = format === 'detailed'
                    ? formatCustomDetailedTooltip(dataPoint, measureCols, measureConfigs, primaryDateFormat, secondaryDateFormat)
                    : formatCustomSimpleTooltip(dataPoint, measureIdx, measureConfig, measureCol, primaryDateFormat);
            }
            
            if (tooltip) {
                showTooltip(tooltip, content, bbox.left, bbox.top, bbox.width, bbox.height);
            }
        });

        circle.addEventListener('mouseleave', () => {
            if (tooltip) {
                hideTooltip(tooltip);
            }
        });
    });
}

