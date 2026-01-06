/**
 * Renderização da caixa do boxplot (Q1 a Q3)
 */

import type { BoxplotStatistics } from '@shared/utils/statistical';
import type { BoxplotRenderConfig } from '../types/boxplotTypes';

export function renderBoxplotBox(
    stats: BoxplotStatistics,
    centerX: number,
    centerY: number,
    config: BoxplotRenderConfig,
    orientation: 'vertical' | 'horizontal',
    color: string,
    opacity: number
): string {
    const { boxWidth, plotAreaHeight, plotAreaWidth, topMargin, leftMargin } = config;

    if (orientation === 'vertical') {
        const boxHeight = (stats.q3 - stats.q1) / (stats.whiskerUpper - stats.whiskerLower) * plotAreaHeight;
        const boxTop = centerY - boxHeight / 2;
        const boxLeft = centerX - boxWidth / 2;

        return `
            <rect
                x="${boxLeft}"
                y="${boxTop}"
                width="${boxWidth}"
                height="${boxHeight}"
                fill="${color}"
                fill-opacity="${opacity}"
                stroke="#374151"
                stroke-width="1.5"
            />
        `;
    } else {
        // Horizontal
        const q1X = leftMargin + ((stats.q1 - globalMin) / globalRange) * plotAreaWidth;
        const q3X = leftMargin + ((stats.q3 - globalMin) / globalRange) * plotAreaWidth;
        const boxLength = Math.abs(q3X - q1X);
        const boxLeft = Math.min(q1X, q3X);
        const boxHeight = boxWidth;
        const boxTop = centerY - boxHeight / 2;

        return `
            <rect
                x="${boxLeft}"
                y="${boxTop}"
                width="${boxLength}"
                height="${boxHeight}"
                fill="${color}"
                fill-opacity="${opacity}"
                stroke="#374151"
                stroke-width="1.5"
            />
        `;
    }
}

