/**
 * Utilitários para processamento de templates de tooltip personalizados
 */

import type { ChartDataPoint } from '../types/chartTypes';
import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import { formatValue } from './formatters';
import { formatDimension } from './formatters';

export interface TemplateData {
    dataPoint: ChartDataPoint;
    measureIdx: number;
    measureCol: ChartColumn;
    measureConfig: {
        format?: string;
        decimals?: number;
        useThousandsSeparator?: boolean;
        valueFormat?: string;
        valuePrefix?: string;
        valueSuffix?: string;
    };
    primaryDateFormat?: string;
    secondaryDateFormat?: string;
}

/**
 * Substitui placeholders no template personalizado pelos valores reais
 */
export function processTooltipTemplate(
    template: string,
    data: TemplateData
): string {
    if (!template || template.trim() === '') {
        return '';
    }

    const { dataPoint, measureIdx, measureCol, measureConfig, primaryDateFormat, secondaryDateFormat } = data;
    
    // Formatar valor da medida
    const value = dataPoint.values[measureIdx] || 0;
    const format = measureConfig.format || 'decimal';
    const decimals = measureConfig.decimals ?? 2;
    const useThousandsSeparator = measureConfig.useThousandsSeparator ?? true;
    const valueFormat = (measureConfig.valueFormat || 'normal') as 'normal' | 'compacto';
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

    // Formatar dimensões
    const primaryLabel = formatDimension(dataPoint.primaryLabel, primaryDateFormat);
    const secondaryLabels = dataPoint.secondaryLabels || [];
    const secondaryLabel = secondaryLabels.length > 0 
        ? formatDimension(secondaryLabels[0], secondaryDateFormat) 
        : '';

    // Mapear placeholders
    const placeholders: Record<string, string> = {
        '{valor}': formattedValue,
        '{medida}': measureCol.name,
        '{dimensao1}': primaryLabel,
        '{dimensao2}': secondaryLabel,
        // Aliases em português
        '{value}': formattedValue,
        '{measure}': measureCol.name,
        '{dimension1}': primaryLabel,
        '{dimension2}': secondaryLabel,
    };

    // Substituir placeholders no template
    let result = template;
    for (const [placeholder, replacement] of Object.entries(placeholders)) {
        result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacement);
    }

    return result;
}

