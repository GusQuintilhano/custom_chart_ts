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
import { generateTooltipText } from '../utils/tooltipUtils';
import { valueToYCoordinate, valueToXCoordinate } from '../utils/boxplotCalculations';

/**
 * Renderiza linhas de grade de fundo
 */
function renderGridLines(
    config: BoxplotRenderConfig,
    options: BoxplotOptions,
    globalMin: number,
    globalMax: number,
    actualScale: 'linear' | 'log'
): string {
    if (!options.gridLines?.show) {
        return '';
    }

    const gridLines = options.gridLines as GridLinesConfig;
    const { plotAreaWidth, plotAreaHeight, topMargin, leftMargin } = config;
    const { orientation } = options;

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
            const y = valueToYCoordinate(value, globalMin, globalMax, topMargin, plotAreaHeight, actualScale);
            
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
            const x = valueToXCoordinate(value, globalMin, globalMax, leftMargin, plotAreaWidth, actualScale);
            
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
    
    // Debug: verificar dimensões
    console.log('[BOXPLOT RENDER] plotAreaWidth:', plotAreaWidth, 'leftMargin:', leftMargin, 'numGroups:', groups.length);

    // Calcular range global para coordenadas:
    // - Se outliers estão habilitados: usar min/max absolutos de todos os dados (incluindo outliers)
    // - Se outliers estão desabilitados: usar whiskerLower/whiskerUpper (limites dos whiskers)
    const showOutliers = options.showOutliers !== false;
    let globalMin: number;
    let globalMax: number;
    
    if (showOutliers) {
        // Incluir outliers: usar valores absolutos min/max de todos os dados
        const allDataValues = groups.flatMap(g => g.values);
        if (allDataValues.length > 0) {
            globalMin = Math.min(...allDataValues);
            globalMax = Math.max(...allDataValues);
        } else {
            globalMin = boxplotData.globalStats.whiskerLower;
            globalMax = boxplotData.globalStats.whiskerUpper;
        }
    } else {
        // Sem outliers: usar limites dos whiskers
        globalMin = boxplotData.globalStats.whiskerLower;
        globalMax = boxplotData.globalStats.whiskerUpper;
    }

    // Determinar escala real: se logarítmica foi solicitada mas há valores não positivos, usar linear
    let actualScale: 'linear' | 'log' = yScale;
    if (yScale === 'log' && (globalMin <= 0 || globalMax <= 0)) {
        actualScale = 'linear';
        console.warn('[BOXPLOT] Escala logarítmica solicitada, mas há valores não positivos (min:', globalMin, 'max:', globalMax, '). Usando escala linear.');
    }
    console.log('[BOXPLOT RENDER] yScale solicitado:', yScale, 'actualScale aplicado:', actualScale, 'globalMin:', globalMin, 'globalMax:', globalMax);

    // Renderizar linhas de grade primeiro (vão para trás)
    const gridLinesHtml = renderGridLines(config, options, globalMin, globalMax, actualScale);
    
    // Renderizar linhas divisórias entre grupos (depois das grid lines)
    const dividerLinesHtml = renderDividerLines(config, options, groups.length);
    
    // Renderizar linhas de referência (depois das grid lines e divider lines, antes dos boxplots)
    const referenceLinesHtml = renderReferenceLines(
        config,
        { referenceLines, yScale: actualScale, orientation },
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
        // Usar distribuição uniforme simples começando após o eixo Y (leftMargin)
        const centerX = orientation === 'vertical'
            ? leftMargin + (index + 0.5) * (plotAreaWidth / Math.max(groups.length, 1))
            : baseCenterX;
        
        const centerY = orientation === 'vertical'
            ? baseCenterY
            : topMargin + (index + 0.5) * (plotAreaHeight / Math.max(groups.length, 1));
        
        // Armazenar posição do centro para jitter plot
        centerPositions.push({ centerX, centerY });

        // Verificar se amostra é insuficiente (< 3 pontos)
        const insufficientSample = group.values.length < 3;
        
        if (insufficientSample) {
            // Renderizar dot plot para amostra insuficiente
            const dotPlotHtml = renderDotPlot(group, centerX, centerY, config, orientation, globalMin, globalMax, actualScale);
            
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
            
            // Calcular área coberta pelo dot plot para tooltip
            const tooltipPadding = 30;
            let tooltipRectX: number, tooltipRectY: number, tooltipRectWidth: number, tooltipRectHeight: number;
            
            if (orientation === 'vertical') {
                tooltipRectX = centerX - 50 - tooltipPadding;
                tooltipRectY = topMargin - tooltipPadding;
                tooltipRectWidth = 100 + tooltipPadding * 2;
                tooltipRectHeight = plotAreaHeight + tooltipPadding * 2;
            } else {
                tooltipRectX = leftMargin - tooltipPadding;
                tooltipRectY = centerY - 50 - tooltipPadding;
                tooltipRectWidth = plotAreaWidth + tooltipPadding * 2;
                tooltipRectHeight = 100 + tooltipPadding * 2;
            }
            
            // Gerar tooltip: rect invisível com title (colocado POR ÚLTIMO para ficar acima)
            const tooltipText = generateTooltipText(
                group.dimensionValue,
                group.stats,
                group.values.length
            );
            const tooltipRect = `<rect x="${tooltipRectX}" y="${tooltipRectY}" width="${tooltipRectWidth}" height="${tooltipRectHeight}" fill="transparent" stroke="none" pointer-events="all">
                <title>${tooltipText}</title>
            </rect>`;
            
            return `
                <g data-group-index="${index}">
                    ${dotPlotHtml}
                    ${labelHtml}
                    ${tooltipRect}
                </g>
            `;
        }
        
        // Criar config com largura variável para este grupo
        const groupConfig = {
            ...config,
            boxWidth: currentBoxWidth,
        };

        // Renderizar elementos do boxplot usando as novas configurações
        const boxHtml = renderBoxplotBox(group.stats, centerX, centerY, groupConfig, orientation, boxStyle, globalMin, globalMax, showNotch, group.values.length, actualScale);
        const whiskersHtml = renderBoxplotWhiskers(group.stats, centerX, centerY, groupConfig, orientation, whiskerStyle, globalMin, globalMax, actualScale);
        const medianHtml = renderBoxplotMedian(group.stats, centerX, centerY, groupConfig, orientation, medianStyle, currentBoxWidth, globalMin, globalMax, actualScale);
        
        // Renderizar média se habilitado
        const meanHtml = showMean && group.stats.mean !== undefined
            ? renderBoxplotMean(group.stats, centerX, centerY, groupConfig, orientation, medianStyle.color, 3, currentBoxWidth, globalMin, globalMax, actualScale)
            : '';
        
        const outliersHtml = renderOutliers(group.stats, centerX, centerY, config, orientation, outlierStyle, globalMin, globalMax, actualScale);

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
            actualScale
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

        // Calcular área coberta pelo boxplot (incluindo whiskers e outliers)
        // Para tooltip: rect invisível que cobre toda a área
        const tooltipPadding = 20; // Padding para cobrir whiskers e outliers
        let tooltipRectX: number, tooltipRectY: number, tooltipRectWidth: number, tooltipRectHeight: number;
        
        if (orientation === 'vertical') {
            // Área vertical: da posição do min até max, com padding
            const minY = valueToYCoordinate(group.stats.min, globalMin, globalMax, topMargin, plotAreaHeight, actualScale);
            const maxY = valueToYCoordinate(group.stats.max, globalMin, globalMax, topMargin, plotAreaHeight, actualScale);
            tooltipRectX = centerX - currentBoxWidth / 2 - tooltipPadding;
            tooltipRectY = Math.min(minY, maxY) - tooltipPadding;
            tooltipRectWidth = currentBoxWidth + tooltipPadding * 2;
            tooltipRectHeight = Math.abs(maxY - minY) + tooltipPadding * 2;
        } else {
            // Área horizontal
            const minX = valueToXCoordinate(group.stats.min, globalMin, globalMax, leftMargin, plotAreaWidth, actualScale);
            const maxX = valueToXCoordinate(group.stats.max, globalMin, globalMax, leftMargin, plotAreaWidth, actualScale);
            tooltipRectX = Math.min(minX, maxX) - tooltipPadding;
            tooltipRectY = centerY - currentBoxWidth / 2 - tooltipPadding;
            tooltipRectWidth = Math.abs(maxX - minX) + tooltipPadding * 2;
            tooltipRectHeight = currentBoxWidth + tooltipPadding * 2;
        }
        
        // Gerar tooltip: rect invisível com title (colocado POR ÚLTIMO para ficar acima)
        const tooltipText = generateTooltipText(
            group.dimensionValue,
            group.stats,
            group.values.length
        );
        const tooltipRect = `<rect x="${tooltipRectX}" y="${tooltipRectY}" width="${tooltipRectWidth}" height="${tooltipRectHeight}" fill="transparent" stroke="none" pointer-events="all">
            <title>${tooltipText}</title>
        </rect>`;
        
        return `
            <g data-group-index="${index}">
                ${boxHtml}
                ${whiskersHtml}
                ${medianHtml}
                ${meanHtml}
                ${outliersHtml}
                ${valueLabelsHtml}
                ${labelHtml}
                ${tooltipRect}
            </g>
        `;
    }).join('');

    // Renderizar jitter plot se habilitado (antes dos boxplots, mas depois das linhas)
    const jitterHtml = showJitter
        ? renderJitterPlot(groups, config, orientation, centerPositions, globalMin, globalMax, actualScale, jitterOpacity, baseBoxWidth)
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
    const scale = options.yScale || 'linear';

    // Para escala logarítmica, garantir que min e max sejam positivos
    // Se há valores não positivos, usar apenas valores positivos ou forçar linear
    let actualMin = min;
    let actualMax = max;
    let actualScale = scale;
    
    if (scale === 'log' && (min <= 0 || max <= 0)) {
        // Se há valores não positivos, usar escala linear
        actualScale = 'linear';
        console.warn('[BOXPLOT] Valores não positivos detectados (min:', min, 'max:', max, '), usando escala linear ao invés de logarítmica');
    }

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
        const value = actualMin + (actualMax - actualMin) * (i / numTicks);
        const y = valueToYCoordinate(value, actualMin, actualMax, topMargin, plotAreaHeight, actualScale);
        
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

