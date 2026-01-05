/**
 * Funções de renderização de eixos
 */

import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import type { ChartDataPoint, MeasureConfig } from '../types/chartTypes';
import type { MeasureRange } from '../utils/measureRanges';
import { calculateMeasureRowTop, calculateLastMeasureRowTop, calculateBarCenterX, valueToY } from '../utils/calculations';
import { formatDimension, formatValue } from '../utils/formatters';

/**
 * Calcula posições e valores dos ticks do eixo Y
 */
function calculateYTicks(minValue: number, maxValue: number, tickCount: number | 'auto'): number[] {
    if (tickCount === 'auto' || tickCount === 0) {
        // Auto: usar aproximadamente 5 ticks
        tickCount = 5;
    }
    
    const ticks: number[] = [];
    const step = (maxValue - minValue) / (tickCount - 1);
    
    for (let i = 0; i < tickCount; i++) {
        ticks.push(minValue + step * i);
    }
    
    return ticks;
}

/**
 * Renderiza eixos Y individuais para cada medida
 */
export function renderYAxes(
    measureRanges: MeasureRange[],
    measureCols: ChartColumn[],
    measureConfigs: MeasureConfig[],
    topMargin: number,
    measureRowHeight: number,
    spacingBetweenMeasures: number,
    leftMargin: number,
    measureLabelSpace: number,
    measureTitleFontSize: number,
    measureNameRotation: number,
    showYAxis: boolean,
    yAxisColor: string,
    axisStrokeWidth: number,
    valueLabelFontSize: number
): string {
    return measureRanges.map((range, measureIdx) => {
        const measureRowTop = calculateMeasureRowTop(
            measureIdx,
            topMargin,
            measureRowHeight,
            spacingBetweenMeasures
        );
        const axisX = leftMargin - 10;
        const measureConfig = measureConfigs[measureIdx];
        
        // Usar effectiveMin/effectiveMax se disponíveis, senão usar min/max
        const minValue = range.effectiveMin ?? range.min;
        const maxValue = range.effectiveMax ?? range.max;
        
        const showYAxisValues = measureConfig?.showYAxisValues !== false;
        const yAxisTicks = measureConfig?.yAxisTicks ?? 'auto';
        const format = measureConfig?.format || 'decimal';
        const decimals = measureConfig?.decimals ?? 2;
        const useThousandsSeparator = measureConfig?.useThousandsSeparator ?? true;
        const valueFormat = measureConfig?.valueFormat || 'normal';
        const valuePrefix = measureConfig?.valuePrefix || '';
        const valueSuffix = measureConfig?.valueSuffix || '';
        
        // Linha do eixo Y para esta medida
        const yAxisLine = showYAxis ? `
            <line 
                x1="${axisX}" 
                y1="${measureRowTop}" 
                x2="${axisX}" 
                y2="${measureRowTop + measureRowHeight}" 
                stroke="${yAxisColor}" 
                stroke-width="${axisStrokeWidth}"
            />
        ` : '';
        
        // Ticks e valores do eixo Y
        let yAxisTicksHtml = '';
        if (showYAxis && showYAxisValues) {
            const ticks = calculateYTicks(minValue, maxValue, yAxisTicks);
            yAxisTicksHtml = ticks.map(tickValue => {
                const tickY = valueToY(tickValue, minValue, maxValue, measureRowTop, measureRowHeight);
                const tickX = axisX;
                const tickLabelX = axisX - 5;
                const formattedTick = formatValue(
                    tickValue,
                    format,
                    decimals,
                    useThousandsSeparator,
                    valueFormat,
                    valuePrefix,
                    valueSuffix,
                    true
                );
                
                return `
                    <line 
                        x1="${tickX}" 
                        y1="${tickY}" 
                        x2="${tickX - 5}" 
                        y2="${tickY}" 
                        stroke="${yAxisColor}" 
                        stroke-width="${axisStrokeWidth}"
                    />
                    <text 
                        x="${tickLabelX}" 
                        y="${tickY + 4}" 
                        text-anchor="end"
                        font-size="${valueLabelFontSize}"
                        fill="${yAxisColor}"
                    >${formattedTick}</text>
                `;
            }).join('');
        }

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

        return yAxisLine + yAxisTicksHtml + measureTitle;
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
    xAxisColor: string;
    axisStrokeWidth: number;
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
        xAxisColor,
        axisStrokeWidth,
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
                fill="${xAxisColor}"
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
            stroke="${xAxisColor}" 
            stroke-width="${axisStrokeWidth}"
        />
    `;
    
    return { xAxisLabels, xAxis };
}

