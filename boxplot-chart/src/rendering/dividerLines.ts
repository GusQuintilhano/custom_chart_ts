/**
 * Renderização de linhas divisórias entre grupos do boxplot
 */

import type { BoxplotRenderConfig } from '../types/boxplotTypes';
import type { BoxplotOptions } from '../utils/boxplotOptions';
import type { DividerLinesConfig } from '../types/boxplotTypes';

/**
 * Renderiza linhas divisórias entre grupos
 */
export function renderDividerLines(
    config: BoxplotRenderConfig,
    options: BoxplotOptions,
    numGroups: number
): string {
    const dividerLines = options.dividerLines as DividerLinesConfig;
    
    if (!dividerLines.show || numGroups <= 1) {
        return '';
    }

    const { plotAreaWidth, plotAreaHeight, topMargin, leftMargin } = config;
    const { orientation } = options;
    const color = dividerLines.color || '#e5e7eb';
    const strokeWidth = dividerLines.strokeWidth || 1;
    const strokeDash = dividerLines.strokeDasharray || 'none';
    const dashAttr = strokeDash !== 'none' ? `stroke-dasharray="${strokeDash}"` : '';

    const lines: string[] = [];

    if (orientation === 'vertical') {
        // Linhas verticais entre grupos (orientação vertical)
        for (let i = 1; i < numGroups; i++) {
            const x = leftMargin + (i * plotAreaWidth / numGroups);
            lines.push(`
                <line
                    x1="${x}"
                    y1="${topMargin}"
                    x2="${x}"
                    y2="${topMargin + plotAreaHeight}"
                    stroke="${color}"
                    stroke-width="${strokeWidth}"
                    ${dashAttr}
                    opacity="0.5"
                />
            `);
        }
    } else {
        // Linhas horizontais entre grupos (orientação horizontal)
        for (let i = 1; i < numGroups; i++) {
            const y = topMargin + (i * plotAreaHeight / numGroups);
            lines.push(`
                <line
                    x1="${leftMargin}"
                    y1="${y}"
                    x2="${leftMargin + plotAreaWidth}"
                    y2="${y}"
                    stroke="${color}"
                    stroke-width="${strokeWidth}"
                    ${dashAttr}
                    opacity="0.5"
                />
            `);
        }
    }

    return `<g class="divider-lines">${lines.join('')}</g>`;
}
