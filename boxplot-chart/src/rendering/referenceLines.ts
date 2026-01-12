/**
 * Renderização de linhas de referência no boxplot
 */

import type { BoxplotRenderConfig, ReferenceLinesConfig, BoxplotOrientation } from '../types/boxplotTypes';
import type { BoxplotStatistics } from '@shared/utils/statistical';
import { valueToYCoordinate, valueToXCoordinate } from '../utils/boxplotCalculations';
import { formatValue } from '@shared/utils/formatters';

/**
 * Calcula o valor da linha de referência baseado no tipo
 */
function calculateReferenceLineValue(
    type: 'fixed' | 'global_mean' | 'global_median' | 'none',
    fixedValue: number | undefined,
    globalStats: BoxplotStatistics
): number | null {
    if (type === 'none' || !type) {
        return null;
    }
    
    if (type === 'fixed') {
        return fixedValue !== undefined ? fixedValue : null;
    }
    
    if (type === 'global_mean') {
        return globalStats.mean !== undefined ? globalStats.mean : null;
    }
    
    if (type === 'global_median') {
        return globalStats.q2; // q2 é a mediana
    }
    
    return null;
}

/**
 * Renderiza linhas de referência
 */
export function renderReferenceLines(
    config: BoxplotRenderConfig,
    options: { referenceLines: ReferenceLinesConfig; yScale: 'linear' | 'log'; orientation: BoxplotOrientation },
    globalStats: BoxplotStatistics,
    globalMin: number,
    globalMax: number
): string {
    const { referenceLines, yScale, orientation } = options;
    
    if (!referenceLines.show || referenceLines.type === 'none') {
        return '';
    }
    
    const value = calculateReferenceLineValue(referenceLines.type, referenceLines.value, globalStats);
    if (value === null || value === undefined) {
        return '';
    }
    
    const { plotAreaWidth, plotAreaHeight, topMargin, leftMargin } = config;
    const color = referenceLines.color || '#ef4444';
    const strokeWidth = referenceLines.strokeWidth || 2;
    const strokeDash = referenceLines.strokeDasharray || '5,5';
    const dashAttr = strokeDash !== 'none' ? `stroke-dasharray="${strokeDash}"` : '';
    const label = referenceLines.label || formatValue(value, 'decimal', 2);
    
    if (orientation === 'vertical') {
        // Linha horizontal para orientação vertical
        const y = valueToYCoordinate(value, globalMin, globalMax, topMargin, plotAreaHeight, yScale);
        
        return `
            <g class="reference-lines">
                <line
                    x1="${leftMargin}"
                    y1="${y}"
                    x2="${leftMargin + plotAreaWidth}"
                    y2="${y}"
                    stroke="${color}"
                    stroke-width="${strokeWidth}"
                    ${dashAttr}
                />
                <text
                    x="${leftMargin + plotAreaWidth + 5}"
                    y="${y + 4}"
                    font-size="10"
                    fill="${color}"
                    text-anchor="start"
                >${label}</text>
            </g>
        `;
    } else {
        // Linha vertical para orientação horizontal
        const x = valueToXCoordinate(value, globalMin, globalMax, leftMargin, plotAreaWidth, yScale);
        
        return `
            <g class="reference-lines">
                <line
                    x1="${x}"
                    y1="${topMargin}"
                    x2="${x}"
                    y2="${topMargin + plotAreaHeight}"
                    stroke="${color}"
                    stroke-width="${strokeWidth}"
                    ${dashAttr}
                />
                <text
                    x="${x}"
                    y="${topMargin - 5}"
                    font-size="10"
                    fill="${color}"
                    text-anchor="middle"
                >${label}</text>
            </g>
        `;
    }
}
