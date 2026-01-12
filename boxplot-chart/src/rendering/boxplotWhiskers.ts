/**
 * Renderização dos bigodes (whiskers) do boxplot
 */

import type { BoxplotStatistics } from '@shared/utils/statistical';
import type { BoxplotRenderConfig, WhiskerStyle, BoxplotOrientation } from '../types/boxplotTypes';
import { valueToYCoordinate, valueToXCoordinate } from '../utils/boxplotCalculations';

export function renderBoxplotWhiskers(
    stats: BoxplotStatistics,
    centerX: number,
    centerY: number,
    config: BoxplotRenderConfig,
    orientation: BoxplotOrientation,
    whiskerStyle: WhiskerStyle,
    globalMin: number,
    globalMax: number,
    scale: 'linear' | 'log' = 'linear'
): string {
    const { boxWidth, plotAreaHeight, plotAreaWidth, topMargin, leftMargin } = config;
    const globalRange = globalMax - globalMin;

    // Usar configurações do whiskerStyle
    const color = whiskerStyle.color;
    const strokeWidth = whiskerStyle.strokeWidth;
    const capWidth = whiskerStyle.capWidth; // Largura do "T" na ponta do bigode

    if (orientation === 'vertical') {
        // Proteger contra divisão por zero (apenas para escala linear)
        if (scale === 'linear' && globalRange <= 0) {
            return ''; // Retornar vazio se não há range válido
        }
        
        // Usar funções helper para suportar escala logarítmica
        const q1Y = valueToYCoordinate(stats.q1, globalMin, globalMax, topMargin, plotAreaHeight, scale);
        const q3Y = valueToYCoordinate(stats.q3, globalMin, globalMax, topMargin, plotAreaHeight, scale);
        const minY = valueToYCoordinate(stats.min, globalMin, globalMax, topMargin, plotAreaHeight, scale);
        const maxY = valueToYCoordinate(stats.max, globalMin, globalMax, topMargin, plotAreaHeight, scale);

        return `
            <!-- Bigode inferior -->
            <line
                x1="${centerX}"
                y1="${q1Y}"
                x2="${centerX}"
                y2="${minY}"
                stroke="${color}"
                stroke-width="${strokeWidth}"
            />
            <line
                x1="${centerX - capWidth / 2}"
                y1="${minY}"
                x2="${centerX + capWidth / 2}"
                y2="${minY}"
                stroke="${color}"
                stroke-width="${strokeWidth}"
            />
            <!-- Bigode superior -->
            <line
                x1="${centerX}"
                y1="${q3Y}"
                x2="${centerX}"
                y2="${maxY}"
                stroke="${color}"
                stroke-width="${strokeWidth}"
            />
            <line
                x1="${centerX - capWidth / 2}"
                y1="${maxY}"
                x2="${centerX + capWidth / 2}"
                y2="${maxY}"
                stroke="${color}"
                stroke-width="${strokeWidth}"
            />
        `;
    } else {
        // Horizontal
        if (scale === 'linear' && globalRange <= 0) {
            return ''; // Retornar vazio se não há range válido
        }
        // Usar funções helper para suportar escala logarítmica
        const q1X = valueToXCoordinate(stats.q1, globalMin, globalMax, leftMargin, plotAreaWidth, scale);
        const q3X = valueToXCoordinate(stats.q3, globalMin, globalMax, leftMargin, plotAreaWidth, scale);
        const minX = valueToXCoordinate(stats.min, globalMin, globalMax, leftMargin, plotAreaWidth, scale);
        const maxX = valueToXCoordinate(stats.max, globalMin, globalMax, leftMargin, plotAreaWidth, scale);

        return `
            <!-- Bigode esquerdo (min) -->
            <line
                x1="${q1X}"
                y1="${centerY}"
                x2="${minX}"
                y2="${centerY}"
                stroke="${color}"
                stroke-width="${strokeWidth}"
            />
            <line
                x1="${minX}"
                y1="${centerY - capWidth / 2}"
                x2="${minX}"
                y2="${centerY + capWidth / 2}"
                stroke="${color}"
                stroke-width="${strokeWidth}"
            />
            <!-- Bigode direito (max) -->
            <line
                x1="${q3X}"
                y1="${centerY}"
                x2="${maxX}"
                y2="${centerY}"
                stroke="${color}"
                stroke-width="${strokeWidth}"
            />
            <line
                x1="${maxX}"
                y1="${centerY - capWidth / 2}"
                x2="${maxX}"
                y2="${centerY + capWidth / 2}"
                stroke="${color}"
                stroke-width="${strokeWidth}"
            />
        `;
    }
}

