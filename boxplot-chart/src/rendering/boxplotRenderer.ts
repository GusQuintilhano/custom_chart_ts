/**
 * Renderização completa do Boxplot Chart
 */

import type { BoxplotData, BoxplotRenderConfig } from '../types/boxplotTypes';
import type { BoxplotOptions } from '../utils/boxplotOptions';
import { renderBoxplotBox } from './boxplotBox';
import { renderBoxplotWhiskers } from './boxplotWhiskers';
import { renderBoxplotMedian, renderBoxplotMean } from './boxplotMedian';
import { renderOutliers } from './outliers';
import { renderReferenceLines } from './referenceLines';
import { renderJitterPlot } from './jitterPlot';
import { renderDotPlot } from './dotPlot';
import { renderDividerLines } from './dividerLines';
import { renderValueLabels } from './valueLabels';
import { formatValue } from '@shared/utils/formatters';
import type { GridLinesConfig } from '../types/boxplotTypes';
import { generateTooltipRect } from '../utils/tooltipUtils';
import { valueToYCoordinate, valueToXCoordinate } from '../utils/boxplotCalculations';

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
        referenceLines,
        variableWidth,
        boxWidth: baseBoxWidth,
        showJitter,
        jitterOpacity,
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
    
    // Renderizar linhas divisórias entre grupos (depois das grid lines)
    const dividerLinesHtml = renderDividerLines(config, options, groups.length);
    
    // Renderizar linhas de referência (depois das grid lines e divider lines, antes dos boxplots)
    const referenceLinesHtml = renderReferenceLines(
        config,
        { referenceLines, yScale, orientation },
        boxplotData.globalStats,
        globalMin,
        globalMax
    );

    // Calcular posição base (centro da área de plotagem)
    const baseCenterX = leftMargin + plotAreaWidth / 2;
    const baseCenterY = topMargin + plotAreaHeight / 2;

    // Calcular count máximo para largura variável
    const maxCount = variableWidth 
        ? Math.max(...groups.map(g => g.values.length), 1)
        : 1;
    
    // Armazenar posições dos centros para jitter plot
    const centerPositions: Array<{ centerX: number; centerY: number }> = [];
    
    // Renderizar cada grupo
    const boxesHtml = groups.map((group, index) => {
        // Calcular largura variável se habilitado (precisa ser feito antes para calcular centerX)
        const currentBoxWidth = variableWidth && maxCount > 0
            ? baseBoxWidth * Math.sqrt(group.values.length / maxCount)
            : baseBoxWidth;
        
        // Para vertical: distribuir grupos horizontalmente dentro da área de plotagem
        // Garantir que o primeiro grupo começa após o eixo Y (leftMargin)
        // Usar distribuição uniforme baseada no espaço disponível
        const centerX = orientation === 'vertical'
            ? leftMargin + (index + 0.5) * (plotAreaWidth / groups.length)
            : baseCenterX;
        
        const centerY = orientation === 'vertical'
            ? baseCenterY
            : topMargin + (index + 0.5) * (plotAreaHeight / groups.length);
        
        // Armazenar posição do centro para jitter plot
        centerPositions.push({ centerX, centerY });

        // Verificar se amostra é insuficiente (< 3 pontos)
        const insufficientSample = group.values.length < 3;
        
        if (insufficientSample) {
            // Renderizar dot plot para amostra insuficiente
            const dotPlotHtml = renderDotPlot(group, centerX, centerY, config, orientation, globalMin, globalMax, yScale);
            
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
            
            // Calcular área do tooltip (rect invisível)
            const tooltipPadding = 30; // Espaço extra para outliers/whiskers
            const tooltipRectX = orientation === 'vertical'
                ? centerX - 50 // Largura aproximada para dot plot
                : leftMargin - tooltipPadding;
            const tooltipRectY = orientation === 'vertical'
                ? topMargin - tooltipPadding
                : centerY - 50;
            const tooltipRectWidth = orientation === 'vertical'
                ? 100
                : plotAreaWidth + tooltipPadding * 2;
            const tooltipRectHeight = orientation === 'vertical'
                ? plotAreaHeight + tooltipPadding * 2
                : 100;
            
            // Gerar tooltip para o grupo (rect invisível com title)
            const tooltipRect = generateTooltipRect(
                group.dimensionValue,
                group.stats,
                group.values.length,
                tooltipRectX,
                tooltipRectY,
                tooltipRectWidth,
                tooltipRectHeight
            );
            
            return `
                <g data-group-index="${index}">
                    ${tooltipRect}
                    ${dotPlotHtml}
                    ${labelHtml}
                </g>
            `;
        }
        
        // Calcular largura variável se habilitado
        // Fórmula: boxWidth = baseWidth * sqrt(count / maxCount)
        const currentBoxWidth = variableWidth && maxCount > 0
            ? baseBoxWidth * Math.sqrt(group.values.length / maxCount)
            : baseBoxWidth;
        
        // Criar config com largura variável para este grupo
        const groupConfig = {
            ...config,
            boxWidth: currentBoxWidth,
        };

        // Renderizar elementos do boxplot usando as novas configurações
        const boxHtml = renderBoxplotBox(group.stats, centerX, centerY, groupConfig, orientation, boxStyle, globalMin, globalMax, showNotch, group.values.length, yScale);
        const whiskersHtml = renderBoxplotWhiskers(group.stats, centerX, centerY, groupConfig, orientation, whiskerStyle, globalMin, globalMax, yScale);
        const medianHtml = renderBoxplotMedian(group.stats, centerX, centerY, groupConfig, orientation, medianStyle, currentBoxWidth, globalMin, globalMax, yScale);
        
        // Renderizar média se habilitado
        const meanHtml = showMean && group.stats.mean !== undefined
            ? renderBoxplotMean(group.stats, centerX, centerY, groupConfig, orientation, medianStyle.color, 3, currentBoxWidth, globalMin, globalMax, yScale)
            : '';
        
        const outliersHtml = renderOutliers(group.stats, centerX, centerY, config, orientation, outlierStyle, globalMin, globalMax, yScale);

        // Renderizar labels de valores (quartis)
        const valueLabelsHtml = renderValueLabels(
            group.stats,
            centerX,
            centerY,
            config,
            orientation,
            options.valueLabels,
            currentBoxWidth,
            globalMin,
            globalMax,
            yScale
        );

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

        // Calcular área do tooltip (rect invisível)
        const tooltipPadding = 40; // Espaço extra para outliers/whiskers
        const tooltipRectX = orientation === 'vertical'
            ? centerX - currentBoxWidth / 2 - tooltipPadding
            : leftMargin - tooltipPadding;
        const tooltipRectY = orientation === 'vertical'
            ? topMargin - tooltipPadding
            : centerY - currentBoxWidth / 2 - tooltipPadding;
        const tooltipRectWidth = orientation === 'vertical'
            ? currentBoxWidth + tooltipPadding * 2
            : plotAreaWidth + tooltipPadding * 2;
        const tooltipRectHeight = orientation === 'vertical'
            ? plotAreaHeight + tooltipPadding * 2
            : currentBoxWidth + tooltipPadding * 2;
        
        // Gerar tooltip para o grupo (rect invisível com title)
        const tooltipRect = generateTooltipRect(
            group.dimensionValue,
            group.stats,
            group.values.length,
            tooltipRectX,
            tooltipRectY,
            tooltipRectWidth,
            tooltipRectHeight
        );
        
        return `
            <g data-group-index="${index}">
                ${tooltipRect}
                ${boxHtml}
                ${whiskersHtml}
                ${medianHtml}
                ${meanHtml}
                ${outliersHtml}
                ${valueLabelsHtml}
                ${labelHtml}
            </g>
        `;
    }).join('');

    // Renderizar jitter plot se habilitado (antes dos boxplots, mas depois das linhas)
    const jitterHtml = showJitter
        ? renderJitterPlot(groups, config, orientation, centerPositions, globalMin, globalMax, yScale, jitterOpacity, baseBoxWidth)
        : '';

    return gridLinesHtml + dividerLinesHtml + referenceLinesHtml + jitterHtml + boxesHtml;
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

