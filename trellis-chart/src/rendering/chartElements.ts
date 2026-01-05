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
    valueLabelFontSize: number,
    forceLabels: boolean
): string {
    const color = measureConfig.color || '#3b82f6';
    const format = measureConfig.format || 'decimal';
    const decimals = measureConfig.decimals ?? 2;
    const useThousandsSeparator = measureConfig.useThousandsSeparator ?? true;
    const opacity = measureConfig.opacity ?? 0.8;
    const valueLabelPosition = measureConfig.valueLabelPosition || 'automático';
    const valuePrefix = measureConfig.valuePrefix || '';
    const valueSuffix = measureConfig.valueSuffix || '';
    const valueFormat = measureConfig.valueFormat || 'normal';
    const showZeroValues = measureConfig.showZeroValues !== false;
    
    const points = chartData.map((item, itemIdx) => {
        const value = item.values[measureIdx] || 0;
        const x = calculateBarCenterX(itemIdx, leftMargin, barWidth, barSpacing);
        const y = valueToY(value, minValue, maxValue, measureRowTop, measureRowHeight);
        return { x, y, value, dataIndex: itemIdx };
    });
    
    // Criar path para a linha
    const pathData = points.map((point, idx) => 
        `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');
    
    // Renderizar círculos nos pontos
    const circles = points.map(point => {
        if (!showZeroValues && point.value === 0) {
            return '';
        }
        
        // Calcular posição do label baseado em valueLabelPosition
        let labelY = point.y - 8;
        if (valueLabelPosition === 'dentro-superior') {
            labelY = point.y + 12;
        } else if (valueLabelPosition === 'dentro-centro') {
            labelY = point.y + 4;
        } else if (valueLabelPosition === 'abaixo') {
            labelY = point.y + 20;
        }
        
        const formattedValue = formatValue(
            point.value,
            format,
            decimals,
            useThousandsSeparator,
            valueFormat,
            valuePrefix,
            valueSuffix,
            showZeroValues
        );
        
        if (!formattedValue) {
            return `<circle cx="${point.x}" cy="${point.y}" r="4" fill="${color}" stroke="white" stroke-width="2" data-measure-index="${measureIdx}" data-data-index="${point.dataIndex}" style="cursor: pointer;" />`;
        }
        
        return `
            <circle 
                cx="${point.x}" 
                cy="${point.y}" 
                r="4"
                fill="${color}"
                stroke="white"
                stroke-width="2"
                data-measure-index="${measureIdx}"
                data-data-index="${point.dataIndex}"
                style="cursor: pointer;"
            />
            <text 
                x="${point.x}" 
                y="${labelY}" 
                text-anchor="middle"
                font-size="${valueLabelFontSize}"
                fill="#374151"
                font-weight="500"
            >${formattedValue}</text>
        `;
    }).join('');
    
    return `
        <g>
            <path 
                d="${pathData}"
                stroke="${color}"
                stroke-width="2"
                fill="none"
                opacity="${opacity}"
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
    const useThousandsSeparator = measureConfig.useThousandsSeparator ?? true;
    const opacity = measureConfig.opacity ?? 0.9;
    const valueLabelPosition = measureConfig.valueLabelPosition || 'automático';
    const valuePrefix = measureConfig.valuePrefix || '';
    const valueSuffix = measureConfig.valueSuffix || '';
    const valueFormat = measureConfig.valueFormat || 'normal';
    const showZeroValues = measureConfig.showZeroValues !== false;
    const format = measureConfig.format || 'decimal';
    const decimals = measureConfig.decimals ?? 2;
    
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
        
        // Determinar se deve mostrar label
        const shouldShowLabel = (barHeight > 15 || forceLabels) && (showZeroValues || value !== 0);
        
        // Calcular posição do label
        let labelX = barX + barWidth / 2;
        let labelY = barY - 5; // Padrão: acima
        let labelAnchor = 'middle';
        
        if (shouldShowLabel && valueLabelPosition !== 'automático') {
            if (valueLabelPosition === 'dentro-superior') {
                labelY = barY + valueLabelFontSize + 2;
            } else if (valueLabelPosition === 'dentro-centro') {
                labelY = barY + barHeight / 2 + valueLabelFontSize / 3;
            } else if (valueLabelPosition === 'abaixo') {
                labelY = barY + barHeight + valueLabelFontSize + 5;
            }
            // 'acima' mantém o padrão (barY - 5)
        }
        
        const formattedValue = shouldShowLabel ? formatValue(
            value,
            format,
            decimals,
            useThousandsSeparator,
            valueFormat,
            valuePrefix,
            valueSuffix,
            showZeroValues
        ) : '';
        
        return `
            <g>
                <rect 
                    x="${barX}" 
                    y="${barY}" 
                    width="${barWidth}" 
                    height="${barHeight}"
                    fill="${measureConfig.color || '#3b82f6'}"
                    opacity="${opacity}"
                    data-measure-index="${measureIdx}"
                    data-data-index="${itemIdx}"
                    style="cursor: pointer;"
                />
                ${formattedValue ? `
                <text 
                    x="${labelX}" 
                    y="${labelY}" 
                    text-anchor="${labelAnchor}"
                    font-size="${valueLabelFontSize}"
                    fill="#374151"
                    font-weight="500"
                >${formattedValue}</text>
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
        const chartType = (measureConfig as any).chartType || 'barras';
        const color = measureConfig.color || '#3b82f6';
        const format = measureConfig.format || 'decimal';
        const decimals = (measureConfig as any).decimals ?? 2;
        
        if (chartType === 'linha') {
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
                valueLabelFontSize,
                forceLabels
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

