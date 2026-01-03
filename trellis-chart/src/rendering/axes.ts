/**
 * Funções de renderização de eixos
 */

import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import type { ChartDataPoint } from '../types/chartTypes';
import { calculateMeasureRowTop, calculateLastMeasureRowTop, calculateBarCenterX } from '../utils/calculations';
import { formatDimension } from '../utils/formatters';

/**
 * Interface para range de valores de uma medida
 */
export interface MeasureRange {
    measure: ChartColumn;
    min: number;
    max: number;
}

/**
 * Renderiza eixos Y individuais para cada medida
 */
export function renderYAxes(
    measureRanges: MeasureRange[],
    measureCols: ChartColumn[],
    topMargin: number,
    measureRowHeight: number,
    spacingBetweenMeasures: number,
    leftMargin: number,
    measureLabelSpace: number,
    measureTitleFontSize: number,
    measureNameRotation: number,
    showYAxis: boolean
): string {
    return measureRanges.map((range, measureIdx) => {
        const measureRowTop = calculateMeasureRowTop(
            measureIdx,
            topMargin,
            measureRowHeight,
            spacingBetweenMeasures
        );
        const axisX = leftMargin - 10;

        // Linha do eixo Y para esta medida
        const yAxisLine = showYAxis ? `
            <line 
                x1="${axisX}" 
                y1="${measureRowTop}" 
                x2="${axisX}" 
                y2="${measureRowTop + measureRowHeight}" 
                stroke="#374151" 
                stroke-width="1.5"
            />
        ` : '';

        // Título da medida (sempre mostrar) - com rotação configurável
        const titleX = measureLabelSpace / 2;
        const titleY = measureRowTop + measureRowHeight / 2;
        const measureTitle = `
            <text 
                x="${titleX}" 
                y="${titleY}" 
                text-anchor="middle"
                font-size="${measureTitleFontSize}"
                fill="#374151"
                font-weight="500"
                transform="rotate(${measureNameRotation} ${titleX} ${titleY})"
            >${range.measure.name}</text>
        `;

        return yAxisLine + measureTitle;
    }).join('');
}

/**
 * Interface para parâmetros de renderização do eixo X
 */
export interface RenderXAxisParams {
    chartData: ChartDataPoint[];
    primaryDateFormat: string;
    formatDimension: (value: unknown, formatType?: string) => string;
    leftMargin: number;
    barWidth: number;
    barSpacing: number;
    lastMeasureRowTop: number;
    measureRowHeight: number;
    labelFontSize: number;
    plotAreaWidth: number;
}

/**
 * Renderiza eixo X completo (labels e linha)
 */
export function renderXAxis(params: RenderXAxisParams): { xAxisLabels: string; xAxis: string } {
    const {
        chartData,
        primaryDateFormat,
        formatDimension,
        leftMargin,
        barWidth,
        barSpacing,
        lastMeasureRowTop,
        measureRowHeight,
        labelFontSize,
        plotAreaWidth,
    } = params;
    
    // Renderizar labels do eixo X
    const xAxisLabels = chartData.map((item, idx) => {
        const labelX = calculateBarCenterX(idx, leftMargin, barWidth, barSpacing);
        const primaryLabel = formatDimension(item.primaryLabel, primaryDateFormat);
        const labelY = lastMeasureRowTop + measureRowHeight + 30;
        
        return `
            <text 
                x="${labelX}" 
                y="${labelY}" 
                text-anchor="middle"
                font-size="${labelFontSize}"
                fill="#374151"
                transform="rotate(-45 ${labelX} ${labelY})"
            >${primaryLabel}</text>
        `;
    }).join('');
    
    // Renderizar linha do eixo X
    const xAxis = `
        <line 
            x1="${leftMargin}" 
            y1="${lastMeasureRowTop + measureRowHeight}" 
            x2="${leftMargin + plotAreaWidth}" 
            y2="${lastMeasureRowTop + measureRowHeight}" 
            stroke="#374151" 
            stroke-width="1.5"
        />
    `;
    
    return { xAxisLabels, xAxis };
}

