/**
 * Renderização de Dot Plot (para amostra insuficiente < 3 pontos)
 */

import type { BoxplotRenderConfig, BoxplotOrientation } from '../types/boxplotTypes';
import type { BoxplotDataGroup } from '../types/boxplotTypes';
import { valueToYCoordinate, valueToXCoordinate } from '../utils/boxplotCalculations';

/**
 * Renderiza dot plot para grupo com amostra insuficiente
 */
export function renderDotPlot(
    group: BoxplotDataGroup,
    centerX: number,
    centerY: number,
    config: BoxplotRenderConfig,
    orientation: BoxplotOrientation,
    globalMin: number,
    globalMax: number,
    yScale: 'linear' | 'log',
    pointSize: number = 4,
    pointColor: string = '#6b7280'
): string {
    const { plotAreaHeight, plotAreaWidth, topMargin, leftMargin } = config;
    
    const points = group.values.map((value, index) => {
        let x: number;
        let y: number;
        
        if (orientation === 'vertical') {
            // Para vertical: pontos alinhados horizontalmente no centro
            const offset = (index - (group.values.length - 1) / 2) * (pointSize * 1.5);
            x = centerX + offset;
            y = valueToYCoordinate(value, globalMin, globalMax, topMargin, plotAreaHeight, yScale);
        } else {
            // Para horizontal: pontos alinhados verticalmente no centro
            const offset = (index - (group.values.length - 1) / 2) * (pointSize * 1.5);
            x = valueToXCoordinate(value, globalMin, globalMax, leftMargin, plotAreaWidth, yScale);
            y = centerY + offset;
        }
        
        return `
            <circle
                cx="${x}"
                cy="${y}"
                r="${pointSize}"
                fill="${pointColor}"
                stroke="none"
                opacity="0.8"
            />
        `;
    }).join('');
    
    return `<g class="dot-plot" data-group-index="${group.dimensionValue}">${points}</g>`;
}
