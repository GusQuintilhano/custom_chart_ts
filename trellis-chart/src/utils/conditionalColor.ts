/**
 * Utilitários para cálculo de cores condicionais
 */

import type { ChartDataPoint, MeasureConfig, ConditionalColorConfig } from '../types/chartTypes';
import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';

/**
 * Avalia uma condição numérica
 */
function evaluateCondition(value: number, operator: '>' | '<' | '>=' | '<=' | '==' | '!=', threshold: number): boolean {
    switch (operator) {
        case '>':
            return value > threshold;
        case '<':
            return value < threshold;
        case '>=':
            return value >= threshold;
        case '<=':
            return value <= threshold;
        case '==':
            return Math.abs(value - threshold) < 0.0001; // Comparação com tolerância para números de ponto flutuante
        case '!=':
            return Math.abs(value - threshold) >= 0.0001;
        default:
            return false;
    }
}

/**
 * Obtém o valor de uma dimensão de um ponto de dados
 */
function getDimensionValue(
    dataPoint: ChartDataPoint,
    dimensionId: string,
    primaryDimension: ChartColumn,
    secondaryDimensions: ChartColumn[]
): string | undefined {
    // Verificar se é a dimensão primária
    if (primaryDimension.id === dimensionId) {
        return dataPoint.primaryLabel;
    }
    
    // Verificar se é uma dimensão secundária
    const secondaryIndex = secondaryDimensions.findIndex(d => d.id === dimensionId);
    if (secondaryIndex >= 0 && secondaryIndex < dataPoint.secondaryLabels.length) {
        return dataPoint.secondaryLabels[secondaryIndex];
    }
    
    return undefined;
}

/**
 * Gera uma cor baseada em um valor de dimensão (usando hash simples)
 */
function generateColorFromDimensionValue(value: string): string {
    // Cores padrão para diferentes valores
    const defaultColors = [
        '#3b82f6', // azul
        '#10b981', // verde
        '#f59e0b', // laranja
        '#ef4444', // vermelho
        '#8b5cf6', // roxo
        '#f97316', // laranja escuro
        '#06b6d4', // ciano
        '#84cc16', // verde limão
    ];
    
    // Hash simples baseado no valor da string
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return defaultColors[Math.abs(hash) % defaultColors.length];
}

/**
 * Calcula a cor de uma barra baseado na configuração de coloração condicional
 */
export function calculateBarColor(
    dataPoint: ChartDataPoint,
    measureIdx: number,
    value: number,
    measureConfig: MeasureConfig,
    primaryDimension: ChartColumn,
    secondaryDimensions: ChartColumn[],
    defaultColor: string
): string {
    const conditionalColor = measureConfig.conditionalColor;
    
    // Se não há configuração de coloração condicional, usar cor padrão
    if (!conditionalColor || !conditionalColor.enabled) {
        return measureConfig.color || defaultColor;
    }
    
    if (conditionalColor.type === 'conditional') {
        // Coloração condicional baseada em valor
        const condition = conditionalColor.condition;
        if (!condition) {
            return measureConfig.color || defaultColor;
        }
        
        const conditionMet = evaluateCondition(value, condition.operator, condition.value);
        return conditionMet 
            ? condition.trueColor 
            : (condition.falseColor || measureConfig.color || defaultColor);
    } else if (conditionalColor.type === 'dimension') {
        // Coloração baseada em dimensão
        const dimensionId = conditionalColor.dimensionId;
        if (!dimensionId) {
            return measureConfig.color || defaultColor;
        }
        
        const dimensionValue = getDimensionValue(dataPoint, dimensionId, primaryDimension, secondaryDimensions);
        if (!dimensionValue) {
            return measureConfig.color || defaultColor;
        }
        
        // Se há mapeamento de cores definido, usar ele
        if (conditionalColor.dimensionColorMap && conditionalColor.dimensionColorMap[dimensionValue]) {
            return conditionalColor.dimensionColorMap[dimensionValue];
        }
        
        // Caso contrário, gerar cor baseada no valor da dimensão
        return generateColorFromDimensionValue(dimensionValue);
    }
    
    // Fallback para cor padrão
    return measureConfig.color || defaultColor;
}

