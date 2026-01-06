/**
 * Renderização dos bigodes (whiskers) do boxplot
 */

import type { BoxplotStatistics } from '@shared/utils/statistical';
import type { BoxplotRenderConfig } from '../types/boxplotTypes';

export function renderBoxplotWhiskers(
    stats: BoxplotStatistics,
    centerX: number,
    centerY: number,
    config: BoxplotRenderConfig,
    orientation: 'vertical' | 'horizontal',
    color: string,
    whiskerWidth: number
): string {
    const { boxWidth, plotAreaHeight, plotAreaWidth, topMargin, leftMargin } = config;

    if (orientation === 'vertical') {
        const range = stats.whiskerUpper - stats.whiskerLower;
        const q1Y = centerY + (stats.q1 - stats.whiskerLower) / range * plotAreaHeight / 2;
        const q3Y = centerY - (stats.whiskerUpper - stats.q3) / range * plotAreaHeight / 2;
        const minY = centerY + (stats.min - stats.whiskerLower) / range * plotAreaHeight / 2;
        const maxY = centerY - (stats.max - stats.whiskerUpper) / range * plotAreaHeight / 2;

        return `
            <!-- Bigode inferior -->
            <line
                x1="${centerX}"
                y1="${q1Y}"
                x2="${centerX}"
                y2="${minY}"
                stroke="${color}"
                stroke-width="2"
            />
            <line
                x1="${centerX - whiskerWidth / 2}"
                y1="${minY}"
                x2="${centerX + whiskerWidth / 2}"
                y2="${minY}"
                stroke="${color}"
                stroke-width="2"
            />
            <!-- Bigode superior -->
            <line
                x1="${centerX}"
                y1="${q3Y}"
                x2="${centerX}"
                y2="${maxY}"
                stroke="${color}"
                stroke-width="2"
            />
            <line
                x1="${centerX - whiskerWidth / 2}"
                y1="${maxY}"
                x2="${centerX + whiskerWidth / 2}"
                y2="${maxY}"
                stroke="${color}"
                stroke-width="2"
            />
        `;
    } else {
        // Horizontal
        const q1X = leftMargin + ((stats.q1 - globalMin) / globalRange) * plotAreaWidth;
        const q3X = leftMargin + ((stats.q3 - globalMin) / globalRange) * plotAreaWidth;
        const minX = leftMargin + ((stats.min - globalMin) / globalRange) * plotAreaWidth;
        const maxX = leftMargin + ((stats.max - globalMin) / globalRange) * plotAreaWidth;

        return `
            <!-- Bigode esquerdo (min) -->
            <line
                x1="${q1X}"
                y1="${centerY}"
                x2="${minX}"
                y2="${centerY}"
                stroke="${color}"
                stroke-width="2"
            />
            <line
                x1="${minX}"
                y1="${centerY - whiskerWidth / 2}"
                x2="${minX}"
                y2="${centerY + whiskerWidth / 2}"
                stroke="${color}"
                stroke-width="2"
            />
            <!-- Bigode direito (max) -->
            <line
                x1="${q3X}"
                y1="${centerY}"
                x2="${maxX}"
                y2="${centerY}"
                stroke="${color}"
                stroke-width="2"
            />
            <line
                x1="${maxX}"
                y1="${centerY - whiskerWidth / 2}"
                x2="${maxX}"
                y2="${centerY + whiskerWidth / 2}"
                stroke="${color}"
                stroke-width="2"
            />
        `;
    }
}

