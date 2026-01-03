/**
 * Funções de renderização de linhas divisórias
 */

import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import type { ChartDataPoint } from '../types/chartTypes';
import { calculateMeasureRowTop, calculateLastMeasureRowTop, calculateBarX } from '../utils/calculations';

/**
 * Interface para parâmetros de renderização de linhas divisórias entre medidas
 */
export interface RenderDividerLinesBetweenMeasuresParams {
    showGridLines: boolean;
    dividerLinesBetweenMeasures: boolean;
    measureCols: ChartColumn[];
    topMargin: number;
    measureRowHeight: number;
    spacingBetweenMeasures: number;
    leftMargin: number;
    plotAreaWidth: number;
    dividerLinesColor: string;
}

/**
 * Renderiza linhas divisórias horizontais entre medidas
 */
export function renderDividerLinesBetweenMeasures(
    params: RenderDividerLinesBetweenMeasuresParams
): string {
    const {
        showGridLines,
        dividerLinesBetweenMeasures,
        measureCols,
        topMargin,
        measureRowHeight,
        spacingBetweenMeasures,
        leftMargin,
        plotAreaWidth,
        dividerLinesColor,
    } = params;
    
    if (!showGridLines || !dividerLinesBetweenMeasures || measureCols.length <= 1) {
        return '';
    }
    
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
 * Interface para parâmetros de renderização de linhas divisórias entre barras
 */
export interface RenderDividerLinesBetweenBarsParams {
    showGridLines: boolean;
    dividerLinesBetweenBars: boolean;
    chartData: ChartDataPoint[];
    leftMargin: number;
    barWidth: number;
    barSpacing: number;
    topMargin: number;
    measureCols: ChartColumn[];
    measureRowHeight: number;
    spacingBetweenMeasures: number;
    dividerLinesColor: string;
}

/**
 * Renderiza linhas divisórias verticais entre barras
 */
export function renderDividerLinesBetweenBars(
    params: RenderDividerLinesBetweenBarsParams
): string {
    const {
        showGridLines,
        dividerLinesBetweenBars,
        chartData,
        leftMargin,
        barWidth,
        barSpacing,
        topMargin,
        measureCols,
        measureRowHeight,
        spacingBetweenMeasures,
        dividerLinesColor,
    } = params;
    
    if (!showGridLines || !dividerLinesBetweenBars || chartData.length <= 1) {
        return '';
    }
    
    const lastMeasureRowTop = calculateLastMeasureRowTop(
        measureCols.length,
        topMargin,
        measureRowHeight,
        spacingBetweenMeasures
    );
    const dividerEndY = lastMeasureRowTop + measureRowHeight;
    
    let html = '';
    for (let barIdx = 0; barIdx < chartData.length - 1; barIdx++) {
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

