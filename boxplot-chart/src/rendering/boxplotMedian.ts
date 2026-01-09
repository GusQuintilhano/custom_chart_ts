/**
 * Renderização da linha mediana (Q2) e média do boxplot
 */

import type { BoxplotStatistics } from '@shared/utils/statistical';
import type { BoxplotRenderConfig, MedianStyle, BoxplotOrientation } from '../types/boxplotTypes';

export function renderBoxplotMedian(
    stats: BoxplotStatistics,
    centerX: number,
    centerY: number,
    config: BoxplotRenderConfig,
    orientation: BoxplotOrientation,
    medianStyle: MedianStyle,
    boxWidth: number,
    globalMin: number,
    globalMax: number
): string {
    const { plotAreaHeight, plotAreaWidth, topMargin, leftMargin } = config;
    const globalRange = globalMax - globalMin;

    const color = medianStyle.color;
    const strokeWidth = medianStyle.strokeWidth;
    const strokeDash = medianStyle.strokeDasharray || 'none';

    if (orientation === 'vertical') {
        const medianY = topMargin + plotAreaHeight - ((stats.q2 - globalMin) / globalRange) * plotAreaHeight;
        
        const dashAttr = strokeDash !== 'none' ? `stroke-dasharray="${strokeDash}"` : '';
        
        return `
            <line
                x1="${centerX - boxWidth / 2}"
                y1="${medianY}"
                x2="${centerX + boxWidth / 2}"
                y2="${medianY}"
                stroke="${color}"
                stroke-width="${strokeWidth}"
                ${dashAttr}
            />
        `;
    } else {
        // Horizontal
        const medianX = leftMargin + ((stats.q2 - globalMin) / globalRange) * plotAreaWidth;
        
        const dashAttr = strokeDash !== 'none' ? `stroke-dasharray="${strokeDash}"` : '';
        
        return `
            <line
                x1="${medianX}"
                y1="${centerY - boxWidth / 2}"
                x2="${medianX}"
                y2="${centerY + boxWidth / 2}"
                stroke="${color}"
                stroke-width="${strokeWidth}"
                ${dashAttr}
            />
        `;
    }
}

/**
 * Renderiza a média (mean) como um ponto ou linha adicional
 */
export function renderBoxplotMean(
    stats: BoxplotStatistics,
    centerX: number,
    centerY: number,
    config: BoxplotRenderConfig,
    orientation: BoxplotOrientation,
    meanColor: string,
    meanSize: number,
    boxWidth: number,
    globalMin: number,
    globalMax: number
): string {
    if (stats.mean === undefined) {
        return '';
    }

    const { plotAreaHeight, plotAreaWidth, topMargin, leftMargin } = config;
    const globalRange = globalMax - globalMin;

    if (orientation === 'vertical') {
        const meanY = topMargin + plotAreaHeight - ((stats.mean - globalMin) / globalRange) * plotAreaHeight;
        return `
            <circle
                cx="${centerX}"
                cy="${meanY}"
                r="${meanSize}"
                fill="${meanColor}"
                stroke="#ffffff"
                stroke-width="1"
            />
        `;
    } else {
        // Horizontal
        const meanX = leftMargin + ((stats.mean - globalMin) / globalRange) * plotAreaWidth;
        return `
            <circle
                cx="${meanX}"
                cy="${centerY}"
                r="${meanSize}"
                fill="${meanColor}"
                stroke="#ffffff"
                stroke-width="1"
            />
        `;
    }
}

