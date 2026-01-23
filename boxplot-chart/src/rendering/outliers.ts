/**
 * Renderização de outliers do boxplot
 */

import type { BoxplotStatistics } from '@shared/utils/statistical';
import type { BoxplotRenderConfig, OutlierStyle, OutlierShape, BoxplotOrientation } from '../types/boxplotTypes';
import { valueToCoordinate } from '../utils/boxplotCalculations';

/**
 * Renderiza um outlier com base no shape configurado
 */
function renderOutlierShape(
    x: number,
    y: number,
    shape: OutlierShape,
    size: number,
    fill: string,
    stroke: string,
    strokeWidth: number
): string {
    switch (shape) {
        case 'circle':
            return `
                <circle
                    cx="${x}"
                    cy="${y}"
                    r="${size}"
                    fill="${fill}"
                    stroke="${stroke}"
                    stroke-width="${strokeWidth}"
                />
            `;
        
        case 'square':
            return `
                <rect
                    x="${x - size}"
                    y="${y - size}"
                    width="${size * 2}"
                    height="${size * 2}"
                    fill="${fill}"
                    stroke="${stroke}"
                    stroke-width="${strokeWidth}"
                />
            `;
        
        case 'diamond':
            return `
                <polygon
                    points="${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}"
                    fill="${fill}"
                    stroke="${stroke}"
                    stroke-width="${strokeWidth}"
                />
            `;
        
        case 'triangle':
            return `
                <polygon
                    points="${x},${y - size} ${x + size},${y + size} ${x - size},${y + size}"
                    fill="${fill}"
                    stroke="${stroke}"
                    stroke-width="${strokeWidth}"
                />
            `;
        
        case 'cross':
            return `
                <g>
                    <line
                        x1="${x - size}"
                        y1="${y - size}"
                        x2="${x + size}"
                        y2="${y + size}"
                        stroke="${fill}"
                        stroke-width="${strokeWidth}"
                    />
                    <line
                        x1="${x - size}"
                        y1="${y + size}"
                        x2="${x + size}"
                        y2="${y - size}"
                        stroke="${fill}"
                        stroke-width="${strokeWidth}"
                    />
                </g>
            `;
        
        default:
            // Fallback para circle
            return `
                <circle
                    cx="${x}"
                    cy="${y}"
                    r="${size}"
                    fill="${fill}"
                    stroke="${stroke}"
                    stroke-width="${strokeWidth}"
                />
            `;
    }
}

export function renderOutliers(
    stats: BoxplotStatistics,
    centerX: number,
    centerY: number,
    config: BoxplotRenderConfig,
    orientation: BoxplotOrientation,
    outlierStyle: OutlierStyle,
    globalMin: number,
    globalMax: number,
    scale: 'linear' | 'log' = 'linear',
    groupIndex?: number
): string {
    if (!outlierStyle.show || stats.outliers.length === 0) {
        return '';
    }

    const { plotAreaHeight, plotAreaWidth, topMargin, leftMargin } = config;
    const { shape, size, fill, stroke, strokeWidth } = outlierStyle;

    return stats.outliers.map((outlier, outlierIndex) => {
        let shapeHtml: string;
        if (orientation === 'vertical') {
            const y = valueToCoordinate(outlier, globalMin, globalMax, topMargin, plotAreaHeight, 'vertical', scale);
            shapeHtml = renderOutlierShape(centerX, y, shape, size, fill, stroke, strokeWidth);
        } else {
            const x = valueToCoordinate(outlier, globalMin, globalMax, leftMargin, plotAreaWidth, 'horizontal', scale);
            shapeHtml = renderOutlierShape(x, centerY, shape, size, fill, stroke, strokeWidth);
        }
        
        // Adicionar data attributes para tooltip
        const dataAttrs = groupIndex !== undefined 
            ? `data-outlier="true" data-outlier-value="${outlier}" data-group-index="${groupIndex}" data-outlier-index="${outlierIndex}"`
            : '';
        
        // Envolver o shape em um grupo com data attributes
        return `<g ${dataAttrs}>${shapeHtml}</g>`;
    }).join('');
}

