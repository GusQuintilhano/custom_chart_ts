/**
 * Módulo para formatação customizada de tooltips com suporte a imagem e layout
 */

import type { ChartDataPoint, MeasureConfig } from '../types/chartTypes';
import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import { formatValue } from '../utils/formatters';
import { formatDimension } from '../utils/formatters';

/**
 * Formata o conteúdo do tooltip no formato simples com customização
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
    const imageUrl = tooltipConfig?.imageUrl;
    const imagePosition = tooltipConfig?.imagePosition || 'none';
    const layout = tooltipConfig?.layout || 'vertical';

    // Conteúdo de dados
    const dataContent = `<strong>${measureName}</strong><br/>${primaryLabel}: ${formattedValue}`;

    // Se não tem imagem, retorna conteúdo simples
    if (!imageUrl || imagePosition === 'none') {
        return dataContent;
    }

    // Montar HTML com imagem baseado na posição e layout
    return buildTooltipHTML(dataContent, imageUrl, imagePosition, layout);
}

/**
 * Formata o conteúdo do tooltip no formato detalhado com customização
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

    // Usar configuração da primeira medida para imagem e layout
    const tooltipConfig = measureConfigs[0]?.tooltip;
    const imageUrl = tooltipConfig?.imageUrl;
    const imagePosition = tooltipConfig?.imagePosition || 'none';
    const layout = tooltipConfig?.layout || 'vertical';

    // Se não tem imagem, retorna conteúdo simples
    if (!imageUrl || imagePosition === 'none') {
        return html;
    }

    // Montar HTML com imagem baseado na posição e layout
    return buildTooltipHTML(html, imageUrl, imagePosition, layout);
}

/**
 * Constrói HTML do tooltip com imagem e layout customizado
 */
function buildTooltipHTML(
    dataContent: string,
    imageUrl: string,
    imagePosition: 'none' | 'top' | 'bottom' | 'left' | 'right',
    layout: 'vertical' | 'horizontal' | 'grid'
): string {
    const imageHTML = `<img src="${imageUrl}" style="max-width: 150px; max-height: 150px; object-fit: contain; border-radius: 4px;" alt="" />`;

    switch (layout) {
        case 'vertical':
            // Layout vertical: elementos empilhados
            switch (imagePosition) {
                case 'top':
                    return `${imageHTML}<br/>${dataContent}`;
                case 'bottom':
                    return `${dataContent}<br/>${imageHTML}`;
                case 'left':
                case 'right':
                    // Em layout vertical, left/right vira top/bottom
                    return `${imageHTML}<br/>${dataContent}`;
                default:
                    return dataContent;
            }

        case 'horizontal':
            // Layout horizontal: elementos lado a lado
            switch (imagePosition) {
                case 'left':
                    return `
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div>${imageHTML}</div>
                            <div>${dataContent}</div>
                        </div>
                    `;
                case 'right':
                    return `
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div>${dataContent}</div>
                            <div>${imageHTML}</div>
                        </div>
                    `;
                case 'top':
                case 'bottom':
                    // Em layout horizontal, top/bottom vira left/right
                    return `
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div>${imageHTML}</div>
                            <div>${dataContent}</div>
                        </div>
                    `;
                default:
                    return dataContent;
            }

        case 'grid':
            // Layout grid: imagem e conteúdo em grid 2x2
            switch (imagePosition) {
                case 'top':
                    return `
                        <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                            <div style="text-align: center;">${imageHTML}</div>
                            <div>${dataContent}</div>
                        </div>
                    `;
                case 'bottom':
                    return `
                        <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                            <div>${dataContent}</div>
                            <div style="text-align: center;">${imageHTML}</div>
                        </div>
                    `;
                case 'left':
                    return `
                        <div style="display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start;">
                            <div>${imageHTML}</div>
                            <div>${dataContent}</div>
                        </div>
                    `;
                case 'right':
                    return `
                        <div style="display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: start;">
                            <div>${dataContent}</div>
                            <div>${imageHTML}</div>
                        </div>
                    `;
                default:
                    return dataContent;
            }

        default:
            return dataContent;
    }
}

