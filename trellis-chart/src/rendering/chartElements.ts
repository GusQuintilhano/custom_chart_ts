/**
 * Funções de renderização de elementos do gráfico (barras, linhas, eixos)
 */

import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import type { ChartDataPoint } from '../types/chartTypes';
import { formatValue } from '../utils/formatters';
import { valueToY, calculateBarX, calculateBarCenterX } from '../utils/calculations';

/**
 * Interface para configuração de medida
 */
export interface MeasureConfig {
    color: string;
    format: string;
    decimals: number;
    chartType: string;
}

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
            fill="${measureConfig.color}"
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
        >${formatValue(point.value, measureConfig.format, measureConfig.decimals)}</text>
    `).join('');
    
    return `
        <g>
            <path 
                d="${pathData}"
                stroke="${measureConfig.color}"
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
                    fill="${measureConfig.color}"
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
                >${formatValue(value, measureConfig.format, measureConfig.decimals)}</text>
                ` : ''}
            </g>
        `;
    });
    
    return barsHtml.join('');
}

