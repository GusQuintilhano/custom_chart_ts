/**
 * Utilitários para agrupamento de dados
 */

import type { ChartDataPoint } from '../types/chartTypes';
import { formatDimension } from './formatters';

/**
 * Interface para representar um grupo de dados
 */
export interface DataGroup {
    startIdx: number;
    endIdx: number;
    label: string;
}

/**
 * Agrupa dados por dimensão secundária
 * @param chartData Array de pontos de dados
 * @param secondaryDimensionIndex Índice da dimensão secundária (normalmente 0 para primeira secundária)
 * @param dateFormat Formato de data para formatação (opcional)
 * @returns Map de label do grupo para informações do grupo
 */
export function groupDataBySecondaryDimension(
    chartData: ChartDataPoint[],
    secondaryDimensionIndex: number = 0,
    dateFormat?: string
): Map<string, DataGroup> {
    const groups = new Map<string, DataGroup>();
    let currentGroupKey: string | null = null;
    
    chartData.forEach((item, idx) => {
        const secondaryLabelRaw = item.secondaryLabels[secondaryDimensionIndex] || '';
        const secondaryLabel = formatDimension(secondaryLabelRaw, dateFormat || 'auto');
        
        if (currentGroupKey !== secondaryLabel) {
            // Finalizar grupo anterior
            if (currentGroupKey !== null) {
                const previousGroup = groups.get(currentGroupKey);
                if (previousGroup) {
                    previousGroup.endIdx = idx - 1;
                }
            }
            // Iniciar novo grupo
            currentGroupKey = secondaryLabel;
            groups.set(secondaryLabel, {
                startIdx: idx,
                endIdx: idx,
                label: secondaryLabel
            });
        } else {
            // Continuar grupo atual
            const currentGroup = groups.get(secondaryLabel);
            if (currentGroup) {
                currentGroup.endIdx = idx;
            }
        }
    });
    
    // Garantir que o último grupo tenha seu endIdx configurado
    if (currentGroupKey !== null) {
        const lastGroup = groups.get(currentGroupKey);
        if (lastGroup) {
            lastGroup.endIdx = chartData.length - 1;
        }
    }
    
    return groups;
}

/**
 * Ordena grupos por índice de início (ordem de aparição)
 * @param groups Map de grupos
 * @returns Array de grupos ordenado por startIdx
 */
export function sortGroupsByStartIndex(groups: Map<string, DataGroup>): DataGroup[] {
    return Array.from(groups.values()).sort((a, b) => a.startIdx - b.startIdx);
}

