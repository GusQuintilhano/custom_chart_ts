/**
 * Renderização de Jitter Plot (dispersão total dos pontos)
 */

import type { BoxplotRenderConfig, BoxplotOrientation } from '../types/boxplotTypes';
import type { BoxplotDataGroup } from '../types/boxplotTypes';
import { valueToYCoordinate, valueToXCoordinate } from '../utils/boxplotCalculations';

/**
 * Gera um valor aleatório para jitter (deslocamento)
 * Usa seed baseado no valor para consistência visual
 */
function getJitterOffset(value: number, index: number, maxJitter: number): number {
    // Usar valor e índice como seed para jitter consistente
    const seed = (value * 1000 + index) % 1000;
    const normalized = seed / 1000; // 0 a 1
    // Mapear para -maxJitter a +maxJitter
    return (normalized - 0.5) * 2 * maxJitter;
}

/**
 * Renderiza jitter plot (todos os pontos de dados)
 */
export function renderJitterPlot(
    groups: BoxplotDataGroup[],
    config: BoxplotRenderConfig,
    orientation: BoxplotOrientation,
    centerPositions: Array<{ centerX: number; centerY: number }>,
    globalMin: number,
    globalMax: number,
    yScale: 'linear' | 'log',
    opacity: number,
    boxWidth: number
): string {
    const { plotAreaHeight, plotAreaWidth, topMargin, leftMargin } = config;
    
    // Largura máxima do jitter (proporcional à largura da caixa)
    const maxJitter = boxWidth * 0.4; // 40% da largura da caixa
    
    const points: string[] = [];
    
    groups.forEach((group, groupIndex) => {
        const { centerX, centerY } = centerPositions[groupIndex];
        
        group.values.forEach((value, valueIndex) => {
            let x: number;
            let y: number;
            
            if (orientation === 'vertical') {
                // Para vertical: jitter horizontal (variação em X)
                const jitterX = getJitterOffset(value, valueIndex, maxJitter);
                x = centerX + jitterX;
                y = valueToYCoordinate(value, globalMin, globalMax, topMargin, plotAreaHeight, yScale);
            } else {
                // Para horizontal: jitter vertical (variação em Y)
                const jitterY = getJitterOffset(value, valueIndex, maxJitter);
                x = valueToXCoordinate(value, globalMin, globalMax, leftMargin, plotAreaWidth, yScale);
                y = centerY + jitterY;
            }
            
            points.push(`
                <circle
                    cx="${x}"
                    cy="${y}"
                    r="2"
                    fill="#6b7280"
                    opacity="${opacity}"
                    stroke="none"
                    data-jitter="true"
                    data-point-value="${value}"
                    data-group-index="${groupIndex}"
                    data-point-index="${valueIndex}"
                />
            `);
        });
    });
    
    return `<g class="jitter-plot">${points.join('')}</g>`;
}
