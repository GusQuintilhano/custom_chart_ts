/**
 * Renderização da linha mediana (Q2) do boxplot
 */

import type { BoxplotStatistics } from '@shared/utils/statistical';
import type { BoxplotRenderConfig } from '../types/boxplotTypes';

export function renderBoxplotMedian(
    stats: BoxplotStatistics,
    centerX: number,
    centerY: number,
    config: BoxplotRenderConfig,
    orientation: 'vertical' | 'horizontal',
    globalMin: number,
    globalMax: number,
    color: string = '#000000'
): string {
    const { boxWidth, plotAreaHeight, plotAreaWidth, topMargin, leftMargin } = config;
    const globalRange = globalMax - globalMin;

    if (orientation === 'vertical') {
        const medianY = topMargin + plotAreaHeight - ((stats.q2 - globalMin) / globalRange) * plotAreaHeight;
        return `
            <line
                x1="${centerX - boxWidth / 2}"
                y1="${medianY}"
                x2="${centerX + boxWidth / 2}"
                y2="${medianY}"
                stroke="${color}"
                stroke-width="2"
            />
        `;
    } else {
        // Horizontal
        const medianX = leftMargin + ((stats.q2 - globalMin) / globalRange) * plotAreaWidth;
        return `
            <line
                x1="${medianX}"
                y1="${centerY - boxWidth / 2}"
                x2="${medianX}"
                y2="${centerY + boxWidth / 2}"
                stroke="${color}"
                stroke-width="2"
            />
        `;
    }
}

