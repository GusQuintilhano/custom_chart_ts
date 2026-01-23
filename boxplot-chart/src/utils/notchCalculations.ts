/**
 * Utilitários para cálculo de Notch (Intervalo de Confiança) no Boxplot
 */

import type { BoxplotStatistics } from '@shared/utils/statistical';

/**
 * Calcula o intervalo de confiança (notch) da mediana
 * Fórmula padrão: CI = ± 1.58 * IQR / sqrt(n)
 * @param stats Estatísticas do boxplot
 * @param sampleSize Tamanho da amostra
 * @returns Intervalo de confiança (valor a subtrair/adicionar da mediana)
 */
export function calculateNotchInterval(
    stats: BoxplotStatistics,
    sampleSize: number
): number {
    if (sampleSize <= 0 || stats.iqr <= 0) {
        return 0;
    }
    
    // Fórmula padrão do notch (usado no R/ggplot2)
    // CI = 1.58 * IQR / sqrt(n)
    const notchHalfWidth = 1.58 * stats.iqr / Math.sqrt(sampleSize);
    
    return notchHalfWidth;
}

/**
 * Calcula os limites do notch (superior e inferior)
 * @param stats Estatísticas do boxplot
 * @param sampleSize Tamanho da amostra
 * @returns Limites superior e inferior do notch
 */
export function calculateNotchLimits(
    stats: BoxplotStatistics,
    sampleSize: number
): { lower: number; upper: number } {
    const notchHalfWidth = calculateNotchInterval(stats, sampleSize);
    
    return {
        lower: stats.q2 - notchHalfWidth, // Mediana - CI
        upper: stats.q2 + notchHalfWidth, // Mediana + CI
    };
}
