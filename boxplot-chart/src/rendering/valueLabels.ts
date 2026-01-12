/**
 * Renderização de labels de valores (quartis) no boxplot
 */

import type { BoxplotStatistics } from '@shared/utils/statistical';
import type { BoxplotRenderConfig, BoxplotOrientation, ValueLabelsConfig } from '../types/boxplotTypes';
import { valueToYCoordinate, valueToXCoordinate } from '../utils/boxplotCalculations';
import { formatValue } from '@shared/utils/formatters';

/**
 * Renderiza labels de valores para um boxplot
 */
export function renderValueLabels(
    stats: BoxplotStatistics,
    centerX: number,
    centerY: number,
    config: BoxplotRenderConfig,
    orientation: BoxplotOrientation,
    valueLabelsConfig: ValueLabelsConfig,
    boxWidth: number,
    globalMin: number,
    globalMax: number,
    scale: 'linear' | 'log' = 'linear'
): string {
    if (!valueLabelsConfig.show) {
        return '';
    }

    const { plotAreaHeight, plotAreaWidth, topMargin, leftMargin } = config;
    const { position, color, fontSize, format, decimals, showMin, showQ1, showMedian, showMean, showQ3, showMax } = valueLabelsConfig;

    const labels: string[] = [];
    const offset = boxWidth / 2 + 5; // Offset para posicionar labels fora da caixa

    // Função helper para formatar valor
    const formatValueText = (value: number): string => {
        if (format === 'integer') {
            return formatValue(value, 'inteiro', 0, false);
        } else if (format === 'auto') {
            return formatValue(value, 'decimal', decimals, false);
        } else {
            return formatValue(value, 'decimal', decimals, false);
        }
    };

    if (orientation === 'vertical') {
        const globalRange = globalMax - globalMin;
        if (scale === 'linear' && globalRange <= 0) {
            return '';
        }

        // Calcular posições Y
        const minY = valueToYCoordinate(stats.min, globalMin, globalMax, topMargin, plotAreaHeight, scale);
        const q1Y = valueToYCoordinate(stats.q1, globalMin, globalMax, topMargin, plotAreaHeight, scale);
        const medianY = valueToYCoordinate(stats.q2, globalMin, globalMax, topMargin, plotAreaHeight, scale);
        const meanY = stats.mean !== undefined ? valueToYCoordinate(stats.mean, globalMin, globalMax, topMargin, plotAreaHeight, scale) : null;
        const q3Y = valueToYCoordinate(stats.q3, globalMin, globalMax, topMargin, plotAreaHeight, scale);
        const maxY = valueToYCoordinate(stats.max, globalMin, globalMax, topMargin, plotAreaHeight, scale);

        // Posições X
        const xInside = centerX;
        const xOutside = position === 'inside' ? centerX : centerX + offset;
        const xBothLeft = centerX - offset;
        const xBothRight = centerX + offset;

        if (position === 'inside' || position === 'both') {
            // Labels dentro da caixa
            if (showMin && (position === 'inside' || position === 'both')) {
                labels.push(`<text x="${xInside}" y="${minY}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.min)}</text>`);
            }
            if (showQ1 && (position === 'inside' || position === 'both')) {
                labels.push(`<text x="${xInside}" y="${q1Y}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.q1)}</text>`);
            }
            if (showMedian && (position === 'inside' || position === 'both')) {
                labels.push(`<text x="${xInside}" y="${medianY}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.q2)}</text>`);
            }
            if (showMean && meanY !== null && (position === 'inside' || position === 'both')) {
                labels.push(`<text x="${xInside}" y="${meanY}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.mean!)}</text>`);
            }
            if (showQ3 && (position === 'inside' || position === 'both')) {
                labels.push(`<text x="${xInside}" y="${q3Y}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.q3)}</text>`);
            }
            if (showMax && (position === 'inside' || position === 'both')) {
                labels.push(`<text x="${xInside}" y="${maxY}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.max)}</text>`);
            }
        }

        if (position === 'outside' || position === 'both') {
            // Labels fora da caixa
            if (showMin) {
                labels.push(`<text x="${position === 'both' ? xBothRight : xOutside}" y="${minY}" text-anchor="start" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.min)}</text>`);
            }
            if (showQ1) {
                labels.push(`<text x="${position === 'both' ? xBothRight : xOutside}" y="${q1Y}" text-anchor="start" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.q1)}</text>`);
            }
            if (showMedian) {
                labels.push(`<text x="${position === 'both' ? xBothRight : xOutside}" y="${medianY}" text-anchor="start" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.q2)}</text>`);
            }
            if (showMean && meanY !== null) {
                labels.push(`<text x="${position === 'both' ? xBothRight : xOutside}" y="${meanY}" text-anchor="start" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.mean!)}</text>`);
            }
            if (showQ3) {
                labels.push(`<text x="${position === 'both' ? xBothRight : xOutside}" y="${q3Y}" text-anchor="start" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.q3)}</text>`);
            }
            if (showMax) {
                labels.push(`<text x="${position === 'both' ? xBothRight : xOutside}" y="${maxY}" text-anchor="start" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.max)}</text>`);
            }
        }
    } else {
        // Horizontal
        const globalRange = globalMax - globalMin;
        if (scale === 'linear' && globalRange <= 0) {
            return '';
        }

        // Calcular posições X
        const minX = valueToXCoordinate(stats.min, globalMin, globalMax, leftMargin, plotAreaWidth, scale);
        const q1X = valueToXCoordinate(stats.q1, globalMin, globalMax, leftMargin, plotAreaWidth, scale);
        const medianX = valueToXCoordinate(stats.q2, globalMin, globalMax, leftMargin, plotAreaWidth, scale);
        const meanX = stats.mean !== undefined ? valueToXCoordinate(stats.mean, globalMin, globalMax, leftMargin, plotAreaWidth, scale) : null;
        const q3X = valueToXCoordinate(stats.q3, globalMin, globalMax, leftMargin, plotAreaWidth, scale);
        const maxX = valueToXCoordinate(stats.max, globalMin, globalMax, leftMargin, plotAreaWidth, scale);

        // Posições Y
        const yInside = centerY;
        const yOutside = position === 'inside' ? centerY : centerY + offset;
        const yBothTop = centerY - offset;
        const yBothBottom = centerY + offset;

        if (position === 'inside' || position === 'both') {
            // Labels dentro da caixa
            if (showMin) {
                labels.push(`<text x="${minX}" y="${yInside}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.min)}</text>`);
            }
            if (showQ1) {
                labels.push(`<text x="${q1X}" y="${yInside}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.q1)}</text>`);
            }
            if (showMedian) {
                labels.push(`<text x="${medianX}" y="${yInside}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.q2)}</text>`);
            }
            if (showMean && meanX !== null) {
                labels.push(`<text x="${meanX}" y="${yInside}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.mean!)}</text>`);
            }
            if (showQ3) {
                labels.push(`<text x="${q3X}" y="${yInside}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.q3)}</text>`);
            }
            if (showMax) {
                labels.push(`<text x="${maxX}" y="${yInside}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.max)}</text>`);
            }
        }

        if (position === 'outside' || position === 'both') {
            // Labels fora da caixa
            if (showMin) {
                labels.push(`<text x="${minX}" y="${position === 'both' ? yBothBottom : yOutside}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.min)}</text>`);
            }
            if (showQ1) {
                labels.push(`<text x="${q1X}" y="${position === 'both' ? yBothBottom : yOutside}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.q1)}</text>`);
            }
            if (showMedian) {
                labels.push(`<text x="${medianX}" y="${position === 'both' ? yBothBottom : yOutside}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.q2)}</text>`);
            }
            if (showMean && meanX !== null) {
                labels.push(`<text x="${meanX}" y="${position === 'both' ? yBothBottom : yOutside}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.mean!)}</text>`);
            }
            if (showQ3) {
                labels.push(`<text x="${q3X}" y="${position === 'both' ? yBothBottom : yOutside}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.q3)}</text>`);
            }
            if (showMax) {
                labels.push(`<text x="${maxX}" y="${position === 'both' ? yBothBottom : yOutside}" text-anchor="middle" font-size="${fontSize}" fill="${color}" dominant-baseline="middle">${formatValueText(stats.max)}</text>`);
            }
        }
    }

    return labels.join('');
}
