/**
 * Funções de renderização de elementos do gráfico (barras, linhas, eixos)
 */

import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import type { ChartDataPoint, MeasureConfig } from '../types/chartTypes';
import { formatValue } from '@shared/utils/formatters';
import { valueToY, calculateBarX, calculateBarCenterX } from '@shared/utils/calculations';
import { calculateBarColor } from '../utils/conditionalColor';

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
    primaryDimension: ChartColumn,
    secondaryDimensions: ChartColumn[],
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
        // Identificar o grupo usando secondaryLabels (concatenado como string para comparação)
        const groupKey = secondaryDimensions.length > 0 ? item.secondaryLabels.join('|') : 'default';
        return { x, y, value, dataIndex: itemIdx, groupKey };
    });
    
    // Separar pontos por grupo e criar paths separados
    const groupPaths: string[] = [];
    let currentGroupKey: string | null = null;
    let currentGroupPoints: Array<{ x: number; y: number }> = [];
    
    points.forEach((point, idx) => {
        if (currentGroupKey === null || point.groupKey !== currentGroupKey) {
            // Novo grupo: salvar path do grupo anterior e iniciar novo
            if (currentGroupPoints.length > 0) {
                const pathData = currentGroupPoints.map((p, i) => 
                    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                ).join(' ');
                groupPaths.push(pathData);
            }
            currentGroupKey = point.groupKey;
            currentGroupPoints = [{ x: point.x, y: point.y }];
        } else {
            // Mesmo grupo: adicionar ponto
            currentGroupPoints.push({ x: point.x, y: point.y });
        }
    });
    
    // Adicionar o último grupo
    if (currentGroupPoints.length > 0) {
        const pathData = currentGroupPoints.map((p, i) => 
            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
        ).join(' ');
        groupPaths.push(pathData);
    }
    
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
        
        // Para rotação, usar 'normal' no formatValue e aplicar rotação no SVG
        const formatValueForFormatting = valueFormat === 'rotacionado' ? 'normal' : valueFormat;
        const formattedValue = formatValue(
            point.value,
            format,
            decimals,
            useThousandsSeparator,
            formatValueForFormatting as 'normal' | 'compacto',
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
                ${valueFormat === 'rotacionado' ? `transform="rotate(-90 ${point.x} ${labelY})"` : ''}
            >${formattedValue}</text>
        `;
    }).join('');
    
    // Renderizar paths separados para cada grupo
    const pathsHtml = groupPaths.map(pathData => `
        <path 
            d="${pathData}"
            stroke="${color}"
            stroke-width="2"
            fill="none"
            opacity="${opacity}"
        />
    `).join('');
    
    return `
        <g>
            ${pathsHtml}
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
    primaryDimension: ChartColumn,
    secondaryDimensions: ChartColumn[],
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
    const defaultColor = measureConfig.color || '#3b82f6';
    
    const barsHtml = chartData.map((item, itemIdx) => {
        const value = item.values[measureIdx] || 0;
        const barX = calculateBarX(itemIdx, leftMargin, barWidth, barSpacing);
        
        // Calcular cor dinamicamente baseado em coloração condicional ou dimensão
        const barColor = calculateBarColor(
            item,
            measureIdx,
            value,
            measureConfig,
            primaryDimension,
            secondaryDimensions,
            defaultColor
        );
        
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
        
        // Para rotação, usar 'normal' no formatValue e aplicar rotação no SVG
        const formatValueForFormatting = valueFormat === 'rotacionado' ? 'normal' : valueFormat;
        const formattedValue = shouldShowLabel ? formatValue(
            value,
            format,
            decimals,
            useThousandsSeparator,
            formatValueForFormatting as 'normal' | 'compacto',
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
                    fill="${barColor}"
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
                    ${valueFormat === 'rotacionado' ? `transform="rotate(-90 ${labelX} ${labelY})"` : ''}
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
    primaryDimension: ChartColumn;
    secondaryDimensions: ChartColumn[];
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
        primaryDimension,
        secondaryDimensions,
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
                primaryDimension,
                secondaryDimensions,
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
                primaryDimension,
                secondaryDimensions,
                valueLabelFontSize,
                forceLabels
            );
        }
    }).join('');
}

