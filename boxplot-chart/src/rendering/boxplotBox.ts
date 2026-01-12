/**
 * Renderização da caixa do boxplot (Q1 a Q3)
 */

import type { BoxplotStatistics } from '@shared/utils/statistical';
import type { BoxplotRenderConfig, BoxStyle, BoxplotOrientation } from '../types/boxplotTypes';

export function renderBoxplotBox(
    stats: BoxplotStatistics,
    centerX: number,
    centerY: number,
    config: BoxplotRenderConfig,
    orientation: BoxplotOrientation,
    boxStyle: BoxStyle,
    globalMin: number,
    globalMax: number
): string {
    const { boxWidth, plotAreaHeight, plotAreaWidth, topMargin, leftMargin } = config;
    const globalRange = globalMax - globalMin;

    // Usar configurações do boxStyle
    const fill = boxStyle.fill;
    const stroke = boxStyle.stroke;
    const strokeWidth = boxStyle.strokeWidth;
    const opacity = boxStyle.opacity;
    const borderRadius = boxStyle.borderRadius || 0;

    if (orientation === 'vertical') {
        // Proteger contra divisão por zero
        if (globalRange <= 0) {
            return ''; // Retornar vazio se não há range válido
        }
        
        // Usar coordenadas absolutas para consistência com mediana e whiskers
        const q1Y = topMargin + plotAreaHeight - ((stats.q1 - globalMin) / globalRange) * plotAreaHeight;
        const q3Y = topMargin + plotAreaHeight - ((stats.q3 - globalMin) / globalRange) * plotAreaHeight;
        const boxHeight = Math.abs(q3Y - q1Y);
        const boxTop = Math.min(q1Y, q3Y);
        const boxLeft = centerX - boxWidth / 2;

        // Se borderRadius > 0, usar rounded rectangle
        if (borderRadius > 0) {
            return `
                <rect
                    x="${boxLeft}"
                    y="${boxTop}"
                    width="${boxWidth}"
                    height="${boxHeight}"
                    rx="${Math.min(borderRadius, boxWidth / 2, boxHeight / 2)}"
                    ry="${Math.min(borderRadius, boxWidth / 2, boxHeight / 2)}"
                    fill="${fill}"
                    fill-opacity="${opacity}"
                    stroke="${stroke}"
                    stroke-width="${strokeWidth}"
                />
            `;
        }

        return `
            <rect
                x="${boxLeft}"
                y="${boxTop}"
                width="${boxWidth}"
                height="${boxHeight}"
                fill="${fill}"
                fill-opacity="${opacity}"
                stroke="${stroke}"
                stroke-width="${strokeWidth}"
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

        if (borderRadius > 0) {
            return `
                <rect
                    x="${boxLeft}"
                    y="${boxTop}"
                    width="${boxLength}"
                    height="${boxHeight}"
                    rx="${Math.min(borderRadius, boxLength / 2, boxHeight / 2)}"
                    ry="${Math.min(borderRadius, boxLength / 2, boxHeight / 2)}"
                    fill="${fill}"
                    fill-opacity="${opacity}"
                    stroke="${stroke}"
                    stroke-width="${strokeWidth}"
                />
            `;
        }

        return `
            <rect
                x="${boxLeft}"
                y="${boxTop}"
                width="${boxLength}"
                height="${boxHeight}"
                fill="${fill}"
                fill-opacity="${opacity}"
                stroke="${stroke}"
                stroke-width="${strokeWidth}"
            />
        `;
    }
}

