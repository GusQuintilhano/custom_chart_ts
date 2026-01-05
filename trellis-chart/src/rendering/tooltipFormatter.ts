/**
 * Módulo para formatação customizada de tooltips com suporte a layout customizável
 */

import type { ChartDataPoint, MeasureConfig } from '../types/chartTypes';
import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import { formatValue } from '../utils/formatters';
import { formatDimension } from '../utils/formatters';

/**
 * Formata o conteúdo do tooltip no formato simples com layout customizado
 */
export function formatCustomSimpleTooltip(
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

    const tooltipConfig = measureConfig.tooltip;
    const layout = tooltipConfig?.layout || 'vertical';

    // Conteúdo de dados
    const dataContent = `<strong>${measureName}</strong><br/>${primaryLabel}: ${formattedValue}`;

    // Aplicar layout customizado
    return applyLayout(dataContent, layout);
}

/**
 * Formata o conteúdo do tooltip no formato detalhado com layout customizado
 */
export function formatCustomDetailedTooltip(
    dataPoint: ChartDataPoint,
    measureCols: ChartColumn[],
    measureConfigs: MeasureConfig[],
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

    html += '<div style="margin-top: 6px;">';
    measureCols.forEach((measureCol, idx) => {
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

    // Usar configuração da primeira medida para layout
    const tooltipConfig = measureConfigs[0]?.tooltip;
    const layout = tooltipConfig?.layout || 'vertical';

    // Aplicar layout customizado
    return applyLayout(html, layout);
}

/**
 * Aplica layout customizado ao conteúdo do tooltip
 */
function applyLayout(
    content: string,
    layout: 'vertical' | 'horizontal' | 'grid'
): string {
    switch (layout) {
        case 'vertical':
            // Layout vertical: conteúdo empilhado (padrão)
            return content;

        case 'horizontal':
            // Layout horizontal: conteúdo lado a lado (usando flex)
            return `<div style="display: flex; flex-direction: column; gap: 8px;">${content}</div>`;

        case 'grid':
            // Layout grid: conteúdo em grid
            return `<div style="display: grid; grid-template-columns: 1fr; gap: 8px;">${content}</div>`;

        default:
            return content;
    }
}
