/**
 * Módulo para gerenciamento de tooltips interativos
 */

import type { ChartDataPoint, MeasureConfig } from '../types/chartTypes';
import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import { formatValue } from '../utils/formatters';
import { formatDimension } from '../utils/formatters';
import { processTooltipTemplate } from '../utils/tooltipTemplate';
import { formatCustomSimpleTooltip, formatCustomDetailedTooltip } from './tooltipFormatter';

export interface TooltipConfig {
    enabled: boolean;
    format: 'simple' | 'detailed';
    showAllMeasures: boolean;
    backgroundColor: string;
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
            max-width: 300px;
            line-height: 1.5;
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
    primaryDateFormat?: string
): string {
    const value = dataPoint.values[measureIdx] || 0;
    const format = measureConfig.format || 'decimal';
    const decimals = measureConfig.decimals ?? 2;
    const useThousandsSeparator = measureConfig.useThousandsSeparator ?? true;
    const valueFormat = measureConfig.valueFormat || 'normal';
    const valuePrefix = measureConfig.valuePrefix || '';
    const valueSuffix = measureConfig.valueSuffix || '';

    const formattedValue = formatValue(
        value,
        format,
        decimals,
        useThousandsSeparator,
        valueFormat,
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

        const formattedValue = formatValue(
            value,
            format,
            decimals,
            useThousandsSeparator,
            valueFormat,
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

        // Usar configuração da medida se disponível, senão usar configuração global
        const measureTooltipConfig = measureConfig.tooltip;
        const enabled = measureTooltipConfig?.enabled !== false && (tooltipConfig?.enabled !== false);
        
        if (!enabled) {
            return;
        }

        const format = measureTooltipConfig?.format || tooltipConfig?.format || 'simple';
        const backgroundColor = measureTooltipConfig?.backgroundColor || tooltipConfig?.backgroundColor || '#ffffff';
        const customTemplate = tooltipConfig?.customTemplate || '';

        rect.addEventListener('mouseenter', (e) => {
            const target = e.target as SVGElement;
            const bbox = target.getBoundingClientRect();
            
            // Atualizar cor de fundo do tooltip para esta medida específica
            if (tooltip) {
                (tooltip as HTMLElement).style.background = backgroundColor;
            }
            
            // Sempre usar formatação padrão (layout customizado pode ser aplicado no futuro se necessário)
            const content = format === 'detailed'
                ? formatDetailedTooltip(dataPoint, measureCols, measureConfigs, false, primaryDateFormat, secondaryDateFormat)
                : formatSimpleTooltip(dataPoint, measureIdx, measureConfig, measureCol, primaryDateFormat, customTemplate);
            
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

        // Usar configuração da medida se disponível, senão usar configuração global
        const measureTooltipConfig = measureConfig.tooltip;
        const enabled = measureTooltipConfig?.enabled !== false && (tooltipConfig?.enabled !== false);
        
        if (!enabled) {
            return;
        }

        const format = measureTooltipConfig?.format || tooltipConfig?.format || 'simple';
        const backgroundColor = measureTooltipConfig?.backgroundColor || tooltipConfig?.backgroundColor || '#ffffff';

        circle.addEventListener('mouseenter', (e) => {
            const target = e.target as SVGElement;
            const bbox = target.getBoundingClientRect();
            
            // Atualizar cor de fundo do tooltip para esta medida específica
            if (tooltip) {
                (tooltip as HTMLElement).style.background = backgroundColor;
            }
            
            // Sempre usar formatação padrão (layout customizado pode ser aplicado no futuro se necessário)
            const content = format === 'detailed'
                ? formatDetailedTooltip(dataPoint, measureCols, measureConfigs, false, primaryDateFormat, secondaryDateFormat)
                : formatSimpleTooltip(dataPoint, measureIdx, measureConfig, measureCol, primaryDateFormat);
            
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

