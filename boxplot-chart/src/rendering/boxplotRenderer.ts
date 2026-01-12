/**
 * Renderização completa do Boxplot Chart
 */

import type { BoxplotData, BoxplotRenderConfig } from '../types/boxplotTypes';
import type { BoxplotOptions } from '../utils/boxplotOptions';
import { renderBoxplotBox } from './boxplotBox';
import { renderBoxplotWhiskers } from './boxplotWhiskers';
import { renderBoxplotMedian, renderBoxplotMean } from './boxplotMedian';
import { renderOutliers } from './outliers';
import { formatValue } from '@shared/utils/formatters';
import type { GridLinesConfig } from '../types/boxplotTypes';
import { generateSvgTitle } from '../utils/tooltipUtils';

/**
 * Renderiza linhas de grade de fundo
 */
function renderGridLines(
    config: BoxplotRenderConfig,
    options: BoxplotOptions,
    globalMin: number,
    globalMax: number
): string {
    if (!options.gridLines?.show) {
        return '';
    }

    const gridLines = options.gridLines as GridLinesConfig;
    const { plotAreaWidth, plotAreaHeight, topMargin, leftMargin } = config;
    const { orientation, yScale } = options;

    const color = gridLines.color || '#e5e7eb';
    const strokeWidth = gridLines.strokeWidth || 1;
    const strokeDash = gridLines.strokeDasharray || 'none';
    const dashAttr = strokeDash !== 'none' ? `stroke-dasharray="${strokeDash}"` : '';

    const numLines = 5; // Número de linhas de grade
    const lines: string[] = [];

    if (orientation === 'vertical') {
        // Linhas horizontais para orientação vertical
        for (let i = 0; i <= numLines; i++) {
            const value = globalMin + (globalMax - globalMin) * (i / numLines);
            const y = valueToYCoordinate(value, globalMin, globalMax, topMargin, plotAreaHeight, yScale);
            
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
    } else {
        // Linhas verticais para orientação horizontal
        for (let i = 0; i <= numLines; i++) {
            const value = globalMin + (globalMax - globalMin) * (i / numLines);
            const x = valueToXCoordinate(value, globalMin, globalMax, leftMargin, plotAreaWidth, yScale);
            
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
    }

    return `<g class="grid-lines">${lines.join('')}</g>`;
}

export function renderBoxplot(
    boxplotData: BoxplotData,
    config: BoxplotRenderConfig,
    options: BoxplotOptions
): string {
    const { groups } = boxplotData;
    const { 
        orientation, 
        boxStyle,
        medianStyle,
        whiskerStyle,
        outlierStyle,
        showMean,
        showNotch,
        yScale,
        labelFontSize,
        valueLabelFontSize,
        gridLines,
    } = options;

    const { plotAreaWidth, plotAreaHeight, topMargin, leftMargin, bottomMargin, groupSpacing } = config;

    // Calcular range global para coordenadas
    const globalMin = boxplotData.globalStats.whiskerLower;
    const globalMax = boxplotData.globalStats.whiskerUpper;

    // Renderizar linhas de grade primeiro (vão para trás)
    const gridLinesHtml = renderGridLines(config, options, globalMin, globalMax);

    // Calcular posição base (centro da área de plotagem)
    const baseCenterX = leftMargin + plotAreaWidth / 2;
    const baseCenterY = topMargin + plotAreaHeight / 2;

    // Renderizar cada grupo
    const boxesHtml = groups.map((group, index) => {
        // Para vertical: distribuir grupos horizontalmente
        // Para horizontal: distribuir grupos verticalmente
        const centerX = orientation === 'vertical'
            ? leftMargin + (index + 0.5) * (plotAreaWidth / groups.length)
            : baseCenterX;
        
        const centerY = orientation === 'vertical'
            ? baseCenterY
            : topMargin + (index + 0.5) * (plotAreaHeight / groups.length);

        // Renderizar elementos do boxplot usando as novas configurações
        const boxHtml = renderBoxplotBox(group.stats, centerX, centerY, config, orientation, boxStyle, globalMin, globalMax, showNotch, group.values.length, yScale);
        const whiskersHtml = renderBoxplotWhiskers(group.stats, centerX, centerY, config, orientation, whiskerStyle, globalMin, globalMax, yScale);
        const medianHtml = renderBoxplotMedian(group.stats, centerX, centerY, config, orientation, medianStyle, config.boxWidth, globalMin, globalMax, yScale);
        
        // Renderizar média se habilitado
        const meanHtml = showMean && group.stats.mean !== undefined
            ? renderBoxplotMean(group.stats, centerX, centerY, config, orientation, medianStyle.color, 3, config.boxWidth, globalMin, globalMax, yScale)
            : '';
        
        const outliersHtml = renderOutliers(group.stats, centerX, centerY, config, orientation, outlierStyle, globalMin, globalMax);

        // Label da dimensão
        const labelY = orientation === 'vertical' 
            ? topMargin + plotAreaHeight + labelFontSize + 5
            : centerY;
        const labelX = orientation === 'vertical'
            ? centerX
            : leftMargin - 10;

        const labelHtml = orientation === 'vertical'
            ? `<text x="${centerX}" y="${labelY}" text-anchor="middle" font-size="${labelFontSize}" fill="#374151">${group.dimensionValue}</text>`
            : `<text x="${labelX}" y="${centerY + 5}" text-anchor="end" font-size="${labelFontSize}" fill="#374151">${group.dimensionValue}</text>`;

        // Gerar tooltip para o grupo
        const tooltipTitle = generateSvgTitle(
            group.dimensionValue,
            group.stats,
            group.values.length
        );
        
        return `
            <g data-group-index="${index}">
                ${tooltipTitle}
                ${boxHtml}
                ${whiskersHtml}
                ${medianHtml}
                ${meanHtml}
                ${outliersHtml}
                ${labelHtml}
            </g>
        `;
    }).join('');

    return gridLinesHtml + boxesHtml;
}

export function renderYAxis(
    min: number,
    max: number,
    config: BoxplotRenderConfig,
    options: BoxplotOptions
): string {
    if (!options.showYAxis) return '';

    const { topMargin, leftMargin, plotAreaHeight } = config;
    const yAxisColor = '#374151';
    const axisStrokeWidth = 1.5;

    // Linha do eixo Y
    const axisLine = `
        <line
            x1="${leftMargin}"
            y1="${topMargin}"
            x2="${leftMargin}"
            y2="${topMargin + plotAreaHeight}"
            stroke="${yAxisColor}"
            stroke-width="${axisStrokeWidth}"
        />
    `;

    // Ticks e labels (simplificado - pode ser expandido)
    const ticks = [];
    const numTicks = 5;
    const scale = options.yScale || 'linear';
    for (let i = 0; i <= numTicks; i++) {
        const value = min + (max - min) * (i / numTicks);
        const y = valueToYCoordinate(value, min, max, topMargin, plotAreaHeight, scale);
        
        ticks.push(`
            <line
                x1="${leftMargin - 5}"
                y1="${y}"
                x2="${leftMargin}"
                y2="${y}"
                stroke="${yAxisColor}"
                stroke-width="${axisStrokeWidth}"
            />
            <text
                x="${leftMargin - 10}"
                y="${y + 5}"
                text-anchor="end"
                font-size="10"
                fill="${yAxisColor}"
            >${formatValue(value, 'decimal', 1, false)}</text>
        `);
    }

    return axisLine + ticks.join('');
}

