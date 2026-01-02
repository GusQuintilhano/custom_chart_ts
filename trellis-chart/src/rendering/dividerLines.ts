/**
 * Funções de renderização de linhas divisórias
 */

import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import { calculateMeasureRowTop, calculateLastMeasureRowTop, calculateBarX } from '../utils/calculations';

/**
 * Renderiza linhas divisórias horizontais entre medidas
 */
export function renderDividerLinesBetweenMeasures(
    measureCols: ChartColumn[],
    topMargin: number,
    measureRowHeight: number,
    spacingBetweenMeasures: number,
    leftMargin: number,
    plotAreaWidth: number,
    dividerLinesColor: string
): string {
    if (measureCols.length <= 1) return '';
    
    let html = '';
    for (let measureIdx = 0; measureIdx < measureCols.length - 1; measureIdx++) {
        const measureRowTop = calculateMeasureRowTop(
            measureIdx,
            topMargin,
            measureRowHeight,
            spacingBetweenMeasures
        );
        const dividerY = measureRowTop + measureRowHeight + spacingBetweenMeasures / 2;
        html += `
            <line 
                x1="${leftMargin}" 
                y1="${dividerY}" 
                x2="${leftMargin + plotAreaWidth}" 
                y2="${dividerY}" 
                stroke="${dividerLinesColor}" 
                stroke-width="1"
            />
        `;
    }
    return html;
}

/**
 * Renderiza linhas divisórias verticais entre barras
 */
export function renderDividerLinesBetweenBars(
    chartDataLength: number,
    leftMargin: number,
    barWidth: number,
    barSpacing: number,
    topMargin: number,
    measureCols: ChartColumn[],
    measureRowHeight: number,
    spacingBetweenMeasures: number,
    dividerLinesColor: string
): string {
    if (chartDataLength <= 1) return '';
    
    const lastMeasureRowTop = calculateLastMeasureRowTop(
        measureCols.length,
        topMargin,
        measureRowHeight,
        spacingBetweenMeasures
    );
    const dividerEndY = lastMeasureRowTop + measureRowHeight;
    
    let html = '';
    for (let barIdx = 0; barIdx < chartDataLength - 1; barIdx++) {
        const barX = calculateBarX(barIdx, leftMargin, barWidth, barSpacing) + barWidth + barSpacing / 2;
        html += `
            <line 
                x1="${barX}" 
                y1="${topMargin}" 
                x2="${barX}" 
                y2="${dividerEndY}" 
                stroke="${dividerLinesColor}" 
                stroke-width="1"
            />
        `;
    }
    return html;
}

