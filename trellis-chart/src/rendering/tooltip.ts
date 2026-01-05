/**
 * Módulo para gerenciamento de tooltips interativos
 */

import type { ChartDataPoint, MeasureConfig } from '../types/chartTypes';
import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import { formatValue } from '../utils/formatters';
import { formatDimension } from '../utils/formatters';

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
    tooltipConfig: TooltipConfig,
    tooltipData: TooltipData
): void {
    if (!tooltipConfig.enabled) {
        return;
    }

    const tooltip = createTooltipElement(tooltipConfig.backgroundColor);
    const { chartData, measureCols, measureConfigs, primaryDateFormat, secondaryDateFormat } = tooltipData;

    // Encontrar todos os elementos clicáveis (barras, pontos de linha, etc)
    const svg = chartElement.querySelector('svg');
    if (!svg) {
        return;
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

        rect.addEventListener('mouseenter', (e) => {
            const target = e.target as SVGElement;
            const bbox = target.getBoundingClientRect();
            
            const content = tooltipConfig.format === 'detailed'
                ? formatDetailedTooltip(dataPoint, measureCols, measureConfigs, tooltipConfig.showAllMeasures, primaryDateFormat, secondaryDateFormat)
                : formatSimpleTooltip(dataPoint, measureIdx, measureConfig, measureCol, primaryDateFormat);
            
            showTooltip(tooltip, content, bbox.left, bbox.top, bbox.width, bbox.height);
        });

        rect.addEventListener('mouseleave', () => {
            hideTooltip(tooltip);
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

        circle.addEventListener('mouseenter', (e) => {
            const target = e.target as SVGElement;
            const bbox = target.getBoundingClientRect();
            
            const content = tooltipConfig.format === 'detailed'
                ? formatDetailedTooltip(dataPoint, measureCols, measureConfigs, tooltipConfig.showAllMeasures, primaryDateFormat, secondaryDateFormat)
                : formatSimpleTooltip(dataPoint, measureIdx, measureConfig, measureCol, primaryDateFormat);
            
            showTooltip(tooltip, content, bbox.left, bbox.top, bbox.width, bbox.height);
        });

        circle.addEventListener('mouseleave', () => {
            hideTooltip(tooltip);
        });
    });
}

