/**
 * Renderização dos bigodes (whiskers) do boxplot
 */

import type { BoxplotStatistics } from '@shared/utils/statistical';
import type { BoxplotRenderConfig, WhiskerStyle, BoxplotOrientation } from '../types/boxplotTypes';

export function renderBoxplotWhiskers(
    stats: BoxplotStatistics,
    centerX: number,
    centerY: number,
    config: BoxplotRenderConfig,
    orientation: BoxplotOrientation,
    whiskerStyle: WhiskerStyle,
    globalMin: number,
    globalMax: number
): string {
    const { boxWidth, plotAreaHeight, plotAreaWidth, topMargin, leftMargin } = config;
    const globalRange = globalMax - globalMin;

    // Usar configurações do whiskerStyle
    const color = whiskerStyle.color;
    const strokeWidth = whiskerStyle.strokeWidth;
    const capWidth = whiskerStyle.capWidth; // Largura do "T" na ponta do bigode

    if (orientation === 'vertical') {
        // Usar globalRange para consistência e proteger contra divisão por zero
        if (globalRange <= 0) {
            return ''; // Retornar vazio se não há range válido
        }
        
        // Para orientação vertical, calcular coordenadas Y baseadas no globalRange
        const q1Y = topMargin + plotAreaHeight - ((stats.q1 - globalMin) / globalRange) * plotAreaHeight;
        const q3Y = topMargin + plotAreaHeight - ((stats.q3 - globalMin) / globalRange) * plotAreaHeight;
        const minY = topMargin + plotAreaHeight - ((stats.min - globalMin) / globalRange) * plotAreaHeight;
        const maxY = topMargin + plotAreaHeight - ((stats.max - globalMin) / globalRange) * plotAreaHeight;

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
        const globalRange = globalMax - globalMin;
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

