/**
 * Funções de renderização de elementos do gráfico (barras, linhas, eixos)
 */

import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import type { ChartDataPoint, MeasureConfig } from '../types/chartTypes';
import { formatValue } from '../utils/formatters';
import { valueToY, calculateBarX, calculateBarCenterX } from '../utils/calculations';

/**
 * Renderiza um gráfico de linha para uma medida
 */
export function renderLineChart(
    chartData: ChartDataPoint[],
    measureIdx: number,
    minValue: number,
    maxValue: number,
    measureRowTop: number,
    measureRowHeight: number,
    leftMargin: number,
    barWidth: number,
    barSpacing: number,
    measureConfig: MeasureConfig,
    valueLabelFontSize: number
): string {
    const color = measureConfig.color || '#3b82f6';
    const format = measureConfig.format || 'decimal';
    const decimals = measureConfig.decimals ?? 2;
    
    const points = chartData.map((item, itemIdx) => {
        const value = item.values[measureIdx] || 0;
        const x = calculateBarCenterX(itemIdx, leftMargin, barWidth, barSpacing);
        const y = valueToY(value, minValue, maxValue, measureRowTop, measureRowHeight);
        return { x, y, value };
    });
    
    // Criar path para a linha
    const pathData = points.map((point, idx) => 
        `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');
    
    // Renderizar círculos nos pontos
    const circles = points.map(point => `
        <circle 
            cx="${point.x}" 
            cy="${point.y}" 
            r="4"
            fill="${color}"
            stroke="white"
            stroke-width="2"
        />
        <text 
            x="${point.x}" 
            y="${point.y - 8}" 
            text-anchor="middle"
            font-size="${valueLabelFontSize}"
            fill="#374151"
            font-weight="500"
        >${formatValue(point.value, format, decimals)}</text>
    `).join('');
    
    return `
        <g>
            <path 
                d="${pathData}"
                stroke="${color}"
                stroke-width="2"
                fill="none"
                opacity="0.8"
            />
            ${circles}
        </g>
    `;
}

/**
 * Renderiza barras para uma medida
 */
export function renderBars(
    chartData: ChartDataPoint[],
    measureIdx: number,
    minValue: number,
    maxValue: number,
    measureRowTop: number,
    measureRowHeight: number,
    leftMargin: number,
    barWidth: number,
    barSpacing: number,
    measureConfig: MeasureConfig,
    valueLabelFontSize: number,
    forceLabels: boolean
): string {
    const barsHtml = chartData.map((item, itemIdx) => {
        const value = item.values[measureIdx] || 0;
        const barX = calculateBarX(itemIdx, leftMargin, barWidth, barSpacing);
        
        // Posição Y do valor (topo da barra se positivo, fundo se negativo)
        const valueY = valueToY(value, minValue, maxValue, measureRowTop, measureRowHeight);
        // Posição Y do zero ou mínimo (base da barra)
        const baseY = valueToY(Math.max(0, minValue), minValue, maxValue, measureRowTop, measureRowHeight);
        
        // Altura da barra (sempre positiva)
        const barHeight = Math.abs(valueY - baseY);
        // Posição Y da barra (sempre do menor Y para maior Y)
        const barY = Math.min(valueY, baseY);
        
        return `
            <g>
                <rect 
                    x="${barX}" 
                    y="${barY}" 
                    width="${barWidth}" 
                    height="${barHeight}"
                    fill="${measureConfig.color || '#3b82f6'}"
                    opacity="0.9"
                />
                ${(barHeight > 15 || forceLabels) ? `
                <text 
                    x="${barX + barWidth / 2}" 
                    y="${barY - 5}" 
                    text-anchor="middle"
                    font-size="${valueLabelFontSize}"
                    fill="#374151"
                    font-weight="500"
                >${formatValue(value, measureConfig.format || 'decimal', measureConfig.decimals ?? 2)}</text>
                ` : ''}
            </g>
        `;
    });
    
    return barsHtml.join('');
}

/**
 * Interface para parâmetros de renderização de todos os elementos do gráfico
 */
export interface RenderChartElementsParams {
    chartData: ChartDataPoint[];
    measureCols: ChartColumn[];
    measureRanges: Array<{ min: number; max: number }>;
    measureConfigs: MeasureConfig[];
    leftMargin: number;
    barWidth: number;
    barSpacing: number;
    topMargin: number;
    measureRowHeight: number;
    spacingBetweenMeasures: number;
    valueLabelFontSize: number;
    forceLabels: boolean;
}

/**
 * Renderiza todos os elementos do gráfico (barras ou linhas para cada medida)
 */
export function renderAllChartElements(params: RenderChartElementsParams): string {
    const {
        chartData,
        measureCols,
        measureRanges,
        measureConfigs,
        leftMargin,
        barWidth,
        barSpacing,
        topMargin,
        measureRowHeight,
        spacingBetweenMeasures,
        valueLabelFontSize,
        forceLabels,
    } = params;
    
    return measureCols.map((measure, measureIdx) => {
        const measureRowTop = topMargin + measureIdx * (measureRowHeight + spacingBetweenMeasures);
        const { min: minValue, max: maxValue } = measureRanges[measureIdx];
        const measureConfig = measureConfigs[measureIdx];
        const chartType = (measureConfig as any).chartType || 'bar';
        const color = measureConfig.color || '#3b82f6';
        const format = measureConfig.format || 'decimal';
        const decimals = (measureConfig as any).decimals ?? 2;
        
        if (chartType === 'line') {
            return renderLineChart(
                chartData,
                measureIdx,
                minValue,
                maxValue,
                measureRowTop,
                measureRowHeight,
                leftMargin,
                barWidth,
                barSpacing,
                measureConfig,
                valueLabelFontSize
            );
        } else {
            return renderBars(
                chartData,
                measureIdx,
                minValue,
                maxValue,
                measureRowTop,
                measureRowHeight,
                leftMargin,
                barWidth,
                barSpacing,
                measureConfig,
                valueLabelFontSize,
                forceLabels
            );
        }
    }).join('');
}

