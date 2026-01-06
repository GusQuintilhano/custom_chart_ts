/**
 * Renderização de outliers do boxplot
 */

import type { BoxplotStatistics } from '@shared/utils/statistical';
import type { BoxplotRenderConfig } from '../types/boxplotTypes';
import { valueToCoordinate } from '../utils/boxplotCalculations';

export function renderOutliers(
    stats: BoxplotStatistics,
    centerX: number,
    centerY: number,
    config: BoxplotRenderConfig,
    orientation: 'vertical' | 'horizontal',
    color: string,
    showOutliers: boolean,
    globalMin: number,
    globalMax: number
): string {
    if (!showOutliers || stats.outliers.length === 0) {
        return '';
    }

    const { plotAreaHeight, plotAreaWidth, topMargin, leftMargin } = config;

    return stats.outliers.map(outlier => {
        if (orientation === 'vertical') {
            const y = valueToCoordinate(outlier, globalMin, globalMax, topMargin, plotAreaHeight, 'vertical');
            return `
                <circle
                    cx="${centerX}"
                    cy="${y}"
                    r="3"
                    fill="${color}"
                    stroke="#ffffff"
                    stroke-width="1"
                />
            `;
        } else {
            const x = valueToCoordinate(outlier, globalMin, globalMax, leftMargin, plotAreaWidth, 'horizontal');
            return `
                <circle
                    cx="${x}"
                    cy="${centerY}"
                    r="3"
                    fill="${color}"
                    stroke="#ffffff"
                    stroke-width="1"
                />
            `;
        }
    }).join('');
}

