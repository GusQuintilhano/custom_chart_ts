/**
 * Renderização da caixa do boxplot (Q1 a Q3)
 */

import type { BoxplotStatistics } from '@shared/utils/statistical';
import type { BoxplotRenderConfig, BoxStyle, BoxplotOrientation } from '../types/boxplotTypes';
import { calculateNotchLimits } from '../utils/notchCalculations';

/**
 * Gera path SVG para caixa com notch (cintura) em orientação vertical
 */
function generateNotchedBoxPathVertical(
    boxLeft: number,
    boxTop: number,
    boxWidth: number,
    q1Y: number,
    q3Y: number,
    medianY: number,
    notchLowerY: number,
    notchUpperY: number,
    notchWidth: number
): string {
    const boxRight = boxLeft + boxWidth;
    const centerX = (boxLeft + boxRight) / 2;
    const notchLeft = centerX - notchWidth / 2;
    const notchRight = centerX + notchWidth / 2;
    
    // Path: cria caixa com cintura (notch) contínua na mediana
    // Desenha em sentido horário começando do topo esquerdo
    const path = [
        `M ${boxLeft} ${q1Y}`, // Move to top-left
        `L ${boxRight} ${q1Y}`, // Line to top-right (topo completo)
        `L ${boxRight} ${notchUpperY}`, // Line down to notch top-right (mantém largura)
        `L ${notchRight} ${medianY}`, // Line to notch right at median (entra no notch, estreita)
        `L ${notchRight} ${notchLowerY}`, // Line down to notch bottom-right (mantém largura do notch)
        `L ${boxRight} ${notchLowerY}`, // Line to box right at notch bottom (expande)
        `L ${boxRight} ${q3Y}`, // Line down to bottom-right (fundo completo)
        `L ${boxLeft} ${q3Y}`, // Line to bottom-left (fundo completo)
        `L ${boxLeft} ${notchLowerY}`, // Line up to notch bottom-left (mantém largura)
        `L ${notchLeft} ${notchLowerY}`, // Line to notch left at notch bottom (estreita)
        `L ${notchLeft} ${medianY}`, // Line up to notch left at median (mantém largura do notch)
        `L ${notchLeft} ${notchUpperY}`, // Line up to notch top-left (mantém largura do notch)
        `L ${boxLeft} ${notchUpperY}`, // Line to box left at notch top (expande)
        `Z` // Close path (volta ao início)
    ].join(' ');
    
    return path;
}

/**
 * Gera path SVG para caixa com notch (cintura) em orientação horizontal
 */
function generateNotchedBoxPathHorizontal(
    boxLeft: number,
    boxTop: number,
    boxHeight: number,
    q1X: number,
    q3X: number,
    medianX: number,
    notchLowerX: number,
    notchUpperX: number,
    notchWidth: number
): string {
    const boxBottom = boxTop + boxHeight;
    const centerY = (boxTop + boxBottom) / 2;
    const notchTop = centerY - notchWidth / 2;
    const notchBottom = centerY + notchWidth / 2;
    
    // Path: cria caixa com cintura (notch) contínua na mediana (horizontal)
    // Desenha em sentido horário começando da esquerda superior
    const path = [
        `M ${q1X} ${boxTop}`, // Move to left-top
        `L ${q1X} ${boxBottom}`, // Line down to left-bottom (esquerda completa)
        `L ${notchLowerX} ${boxBottom}`, // Line right to notch bottom-left (mantém altura)
        `L ${notchLowerX} ${notchBottom}`, // Line to notch bottom-left (estreita)
        `L ${medianX} ${notchBottom}`, // Line to median at notch bottom (mantém altura do notch)
        `L ${notchUpperX} ${notchBottom}`, // Line to notch bottom-right (mantém altura do notch)
        `L ${notchUpperX} ${boxBottom}`, // Line to box bottom at notch right (expande)
        `L ${q3X} ${boxBottom}`, // Line right to bottom-right (direita completa)
        `L ${q3X} ${boxTop}`, // Line up to top-right (direita completa)
        `L ${notchUpperX} ${boxTop}`, // Line left to notch top-right (mantém altura)
        `L ${notchUpperX} ${notchTop}`, // Line to notch top-right (estreita)
        `L ${medianX} ${notchTop}`, // Line to median at notch top (mantém altura do notch)
        `L ${notchLowerX} ${notchTop}`, // Line to notch top-left (mantém altura do notch)
        `L ${notchLowerX} ${boxTop}`, // Line to box top at notch left (expande)
        `Z` // Close path (volta ao início)
    ].join(' ');
    
    return path;
}

export function renderBoxplotBox(
    stats: BoxplotStatistics,
    centerX: number,
    centerY: number,
    config: BoxplotRenderConfig,
    orientation: BoxplotOrientation,
    boxStyle: BoxStyle,
    globalMin: number,
    globalMax: number,
    showNotch?: boolean,
    sampleSize?: number
): string {
    const { boxWidth, plotAreaHeight, plotAreaWidth, topMargin, leftMargin } = config;
    const globalRange = globalMax - globalMin;

    // Usar configurações do boxStyle
    const fill = boxStyle.fill;
    const stroke = boxStyle.stroke;
    const strokeWidth = boxStyle.strokeWidth;
    const opacity = boxStyle.opacity;
    const borderRadius = boxStyle.borderRadius || 0;

    if (orientation === 'vertical') {
        // Proteger contra divisão por zero
        if (globalRange <= 0) {
            return ''; // Retornar vazio se não há range válido
        }
        
        // Usar coordenadas absolutas para consistência com mediana e whiskers
        const q1Y = topMargin + plotAreaHeight - ((stats.q1 - globalMin) / globalRange) * plotAreaHeight;
        const q3Y = topMargin + plotAreaHeight - ((stats.q3 - globalMin) / globalRange) * plotAreaHeight;
        const medianY = topMargin + plotAreaHeight - ((stats.q2 - globalMin) / globalRange) * plotAreaHeight;
        const boxHeight = Math.abs(q3Y - q1Y);
        const boxTop = Math.min(q1Y, q3Y);
        const boxLeft = centerX - boxWidth / 2;

        // Se notch está habilitado e temos sample size
        if (showNotch && sampleSize && sampleSize > 0) {
            const notchLimits = calculateNotchLimits(stats, sampleSize);
            const notchLowerY = topMargin + plotAreaHeight - ((notchLimits.lower - globalMin) / globalRange) * plotAreaHeight;
            const notchUpperY = topMargin + plotAreaHeight - ((notchLimits.upper - globalMin) / globalRange) * plotAreaHeight;
            
            // Largura do notch: geralmente 50-70% da largura da caixa
            const notchWidth = boxWidth * 0.6;
            
            const pathData = generateNotchedBoxPathVertical(
                boxLeft, boxTop, boxWidth,
                q1Y, q3Y, medianY,
                notchLowerY, notchUpperY, notchWidth
            );
            
            return `
                <path
                    d="${pathData}"
                    fill="${fill}"
                    fill-opacity="${opacity}"
                    stroke="${stroke}"
                    stroke-width="${strokeWidth}"
                />
            `;
        }

        // Se borderRadius > 0, usar rounded rectangle
        if (borderRadius > 0) {
            return `
                <rect
                    x="${boxLeft}"
                    y="${boxTop}"
                    width="${boxWidth}"
                    height="${boxHeight}"
                    rx="${Math.min(borderRadius, boxWidth / 2, boxHeight / 2)}"
                    ry="${Math.min(borderRadius, boxWidth / 2, boxHeight / 2)}"
                    fill="${fill}"
                    fill-opacity="${opacity}"
                    stroke="${stroke}"
                    stroke-width="${strokeWidth}"
                />
            `;
        }

        return `
            <rect
                x="${boxLeft}"
                y="${boxTop}"
                width="${boxWidth}"
                height="${boxHeight}"
                fill="${fill}"
                fill-opacity="${opacity}"
                stroke="${stroke}"
                stroke-width="${strokeWidth}"
            />
        `;
    } else {
        // Horizontal
        // Proteger contra divisão por zero
        if (globalRange <= 0) {
            return ''; // Retornar vazio se não há range válido
        }
        
        const q1X = leftMargin + ((stats.q1 - globalMin) / globalRange) * plotAreaWidth;
        const q3X = leftMargin + ((stats.q3 - globalMin) / globalRange) * plotAreaWidth;
        const medianX = leftMargin + ((stats.q2 - globalMin) / globalRange) * plotAreaWidth;
        const boxLength = Math.abs(q3X - q1X);
        const boxLeft = Math.min(q1X, q3X);
        const boxHeight = boxWidth;
        const boxTop = centerY - boxHeight / 2;

        // Se notch está habilitado e temos sample size
        if (showNotch && sampleSize && sampleSize > 0) {
            const notchLimits = calculateNotchLimits(stats, sampleSize);
            const notchLowerX = leftMargin + ((notchLimits.lower - globalMin) / globalRange) * plotAreaWidth;
            const notchUpperX = leftMargin + ((notchLimits.upper - globalMin) / globalRange) * plotAreaWidth;
            
            // Largura do notch: geralmente 50-70% da altura da caixa
            const notchWidth = boxHeight * 0.6;
            
            const pathData = generateNotchedBoxPathHorizontal(
                boxLeft, boxTop, boxHeight,
                q1X, q3X, medianX,
                notchLowerX, notchUpperX, notchWidth
            );
            
            return `
                <path
                    d="${pathData}"
                    fill="${fill}"
                    fill-opacity="${opacity}"
                    stroke="${stroke}"
                    stroke-width="${strokeWidth}"
                />
            `;
        }

        if (borderRadius > 0) {
            return `
                <rect
                    x="${boxLeft}"
                    y="${boxTop}"
                    width="${boxLength}"
                    height="${boxHeight}"
                    rx="${Math.min(borderRadius, boxLength / 2, boxHeight / 2)}"
                    ry="${Math.min(borderRadius, boxLength / 2, boxHeight / 2)}"
                    fill="${fill}"
                    fill-opacity="${opacity}"
                    stroke="${stroke}"
                    stroke-width="${strokeWidth}"
                />
            `;
        }

        return `
            <rect
                x="${boxLeft}"
                y="${boxTop}"
                width="${boxLength}"
                height="${boxHeight}"
                fill="${fill}"
                fill-opacity="${opacity}"
                stroke="${stroke}"
                stroke-width="${strokeWidth}"
            />
        `;
    }
}

