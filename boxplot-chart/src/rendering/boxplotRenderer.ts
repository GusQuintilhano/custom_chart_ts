/**
 * Renderização completa do Boxplot Chart
 */

import type { BoxplotData, BoxplotRenderConfig } from '../types/boxplotTypes';
import type { BoxplotOptions } from '../utils/boxplotOptions';
import { renderBoxplotBox } from './boxplotBox';
import { renderBoxplotWhiskers } from './boxplotWhiskers';
import { renderBoxplotMedian } from './boxplotMedian';
import { renderOutliers } from './outliers';
import { formatValue } from '@shared/utils/formatters';

export function renderBoxplot(
    boxplotData: BoxplotData,
    config: BoxplotRenderConfig,
    options: BoxplotOptions
): string {
    const { groups } = boxplotData;
    const { 
        orientation, 
        color, 
        opacity, 
        showOutliers, 
        whiskerWidth,
        labelFontSize,
        valueLabelFontSize,
    } = options;

    const { plotAreaWidth, plotAreaHeight, topMargin, leftMargin, bottomMargin, groupSpacing } = config;

    // Calcular range global para coordenadas
    const globalMin = boxplotData.globalStats.whiskerLower;
    const globalMax = boxplotData.globalStats.whiskerUpper;

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

        // Renderizar elementos do boxplot
        const boxHtml = renderBoxplotBox(group.stats, centerX, centerY, config, orientation, color, opacity, globalMin, globalMax);
        const whiskersHtml = renderBoxplotWhiskers(group.stats, centerX, centerY, config, orientation, color, whiskerWidth, globalMin, globalMax);
        const medianHtml = renderBoxplotMedian(group.stats, centerX, centerY, config, orientation, globalMin, globalMax, '#000000');
        const outliersHtml = renderOutliers(group.stats, centerX, centerY, config, orientation, color, showOutliers, globalMin, globalMax);

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

        return `
            <g data-group-index="${index}">
                ${boxHtml}
                ${whiskersHtml}
                ${medianHtml}
                ${outliersHtml}
                ${labelHtml}
            </g>
        `;
    }).join('');

    return boxesHtml;
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
    for (let i = 0; i <= numTicks; i++) {
        const value = min + (max - min) * (i / numTicks);
        const y = topMargin + plotAreaHeight - (i / numTicks) * plotAreaHeight;
        
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

