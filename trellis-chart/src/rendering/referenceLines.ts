/**
 * Funções para renderização de linhas de referência (baseline/threshold)
 */

import type { MeasureConfig, MeasureRange } from '../types/chartTypes';
import { valueToY, calculateMeasureRowTop } from '@shared/utils/calculations';
import { formatValue } from '@shared/utils/formatters';

export interface RenderReferenceLinesParams {
    measureConfigs: MeasureConfig[];
    measureRanges: MeasureRange[];
    measureColsCount: number;
    topMargin: number;
    measureRowHeight: number;
    spacingBetweenMeasures: number;
    leftMargin: number;
    plotAreaWidth: number;
    valueLabelFontSize: number;
}

/**
 * Converte estilo de linha para stroke-dasharray do SVG
 */
function getStrokeDashArray(style: 'sólida' | 'tracejada' | 'pontilhada'): string {
    switch (style) {
        case 'tracejada':
            return '5,5';
        case 'pontilhada':
            return '2,2';
        case 'sólida':
        default:
            return 'none';
    }
}

/**
 * Renderiza linhas de referência para todas as medidas
 */
export function renderReferenceLines(params: RenderReferenceLinesParams): string {
    const {
        measureConfigs,
        measureRanges,
        measureColsCount,
        topMargin,
        measureRowHeight,
        spacingBetweenMeasures,
        leftMargin,
        plotAreaWidth,
        valueLabelFontSize,
    } = params;

    let html = '';

    measureConfigs.forEach((measureConfig, measureIdx) => {
        const referenceLine = measureConfig.referenceLine;
        
        // Debug: log detalhado
        console.log(`[ReferenceLine] Measure ${measureIdx}:`, {
            hasReferenceLine: !!referenceLine,
            enabled: referenceLine?.enabled,
            value: referenceLine?.value,
            color: referenceLine?.color,
            style: referenceLine?.style,
        });
        
        if (!referenceLine || !referenceLine.enabled) {
            console.log(`[ReferenceLine] Measure ${measureIdx}: Skipping - no referenceLine or not enabled`);
            return;
        }

        const range = measureRanges[measureIdx];
        let minValue = range.effectiveMin ?? range.min;
        let maxValue = range.effectiveMax ?? range.max;

        // Ajustar o range para incluir o valor da linha de referência, se estiver fora
        // Isso garante que a linha sempre apareça dentro da área visível
        if (referenceLine.value < minValue) {
            minValue = referenceLine.value;
        }
        if (referenceLine.value > maxValue) {
            maxValue = referenceLine.value;
        }

        const measureRowTop = calculateMeasureRowTop(
            measureIdx,
            topMargin,
            measureRowHeight,
            spacingBetweenMeasures
        );

        // Calcular posição Y da linha de referência
        const referenceY = valueToY(
            referenceLine.value,
            minValue,
            maxValue,
            measureRowTop,
            measureRowHeight
        );

        const lineX1 = leftMargin;
        const lineX2 = leftMargin + plotAreaWidth;
        const color = referenceLine.color || '#ef4444';
        const strokeDashArray = getStrokeDashArray(referenceLine.style || 'sólida');

        // Debug: log da linha que será renderizada
        console.log(`[ReferenceLine] Measure ${measureIdx}: Rendering line`, {
            value: referenceLine.value,
            minValue,
            maxValue,
            referenceY,
            lineX1,
            lineX2,
            color,
            strokeDashArray,
            inRange: referenceLine.value >= minValue && referenceLine.value <= maxValue,
        });

        // Renderizar linha
        html += `
            <line 
                x1="${lineX1}" 
                y1="${referenceY}" 
                x2="${lineX2}" 
                y2="${referenceY}" 
                stroke="${color}" 
                stroke-width="2"
                stroke-dasharray="${strokeDashArray}"
            />
        `;

        // Renderizar label se habilitado
        if (referenceLine.showLabel) {
            const format = measureConfig.format || 'decimal';
            const decimals = measureConfig.decimals ?? 2;
            const useThousandsSeparator = measureConfig.useThousandsSeparator ?? true;
            const valueFormat = measureConfig.valueFormat || 'normal';
            const valuePrefix = measureConfig.valuePrefix || '';
            const valueSuffix = measureConfig.valueSuffix || '';

            const formattedValue = formatValue(
                referenceLine.value,
                format,
                decimals,
                useThousandsSeparator,
                valueFormat,
                valuePrefix,
                valueSuffix,
                true
            );

            // Posicionar label no início da linha (esquerda)
            html += `
                <text 
                    x="${lineX1 + 5}" 
                    y="${referenceY - 5}" 
                    text-anchor="start"
                    font-size="${valueLabelFontSize}"
                    fill="${color}"
                    font-weight="600"
                >${formattedValue}</text>
            `;
        }
    });

    return html;
}

