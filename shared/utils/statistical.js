/**
 * Utilitários para cálculos estatísticos (usado principalmente em Boxplot)
 */
/**
 * Calcula os quartis (Q1, Q2/mediana, Q3) de um array de números
 * @param data Array de números ordenados ou não ordenados
 * @returns Objeto com quartis calculados
 */
export function calculateQuartiles(data) {
    if (data.length === 0) {
        return { q1: 0, q2: 0, q3: 0 };
    }
    // Ordenar dados
    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;
    // Calcular índices
    const q1Index = Math.floor(n * 0.25);
    const q2Index = Math.floor(n * 0.5);
    const q3Index = Math.floor(n * 0.75);
    // Calcular quartis (usando método de interpolação linear se necessário)
    const q1 = calculatePercentile(sorted, 25);
    const q2 = calculatePercentile(sorted, 50); // Mediana
    const q3 = calculatePercentile(sorted, 75);
    return { q1, q2, q3 };
}
/**
 * Calcula um percentil usando interpolação linear
 * @param sorted Array ordenado de números
 * @param percentile Percentil desejado (0-100)
 * @returns Valor do percentil
 */
function calculatePercentile(sorted, percentile) {
    if (sorted.length === 0)
        return 0;
    if (sorted.length === 1)
        return sorted[0];
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (lower === upper) {
        return sorted[lower];
    }
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}
/**
 * Calcula o Interquartile Range (IQR)
 * @param q1 Quartil 1
 * @param q3 Quartil 3
 * @returns IQR
 */
export function calculateIQR(q1, q3) {
    return q3 - q1;
}
/**
 * Calcula os limites dos bigodes (whiskers) do boxplot
 * @param q1 Quartil 1
 * @param q3 Quartil 3
 * @param iqr Interquartile Range
 * @returns Limites inferior e superior dos bigodes
 */
export function calculateWhiskers(q1, q3, iqr) {
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    return { lower, upper };
}
/**
 * Identifica outliers em um array de dados
 * @param data Array de números
 * @param lower Limite inferior (geralmente calculado por calculateWhiskers)
 * @param upper Limite superior (geralmente calculado por calculateWhiskers)
 * @returns Array com valores que são outliers
 */
export function identifyOutliers(data, lower, upper) {
    return data.filter(value => value < lower || value > upper);
}
/**
 * Calcula todas as estatísticas necessárias para um boxplot
 * @param data Array de números
 * @param includeMean Se deve calcular a média também
 * @returns Estatísticas completas do boxplot
 */
export function calculateBoxplotStats(data, includeMean = false) {
    if (data.length === 0) {
        return {
            q1: 0,
            q2: 0,
            q3: 0,
            iqr: 0,
            min: 0,
            max: 0,
            whiskerLower: 0,
            whiskerUpper: 0,
            outliers: [],
        };
    }
    const { q1, q2, q3 } = calculateQuartiles(data);
    const iqr = calculateIQR(q1, q3);
    const { lower: whiskerLower, upper: whiskerUpper } = calculateWhiskers(q1, q3, iqr);
    // Valores mínimo e máximo dentro dos bigodes (não outliers)
    const valuesWithinWhiskers = data.filter(value => value >= whiskerLower && value <= whiskerUpper);
    const min = valuesWithinWhiskers.length > 0 ? Math.min(...valuesWithinWhiskers) : whiskerLower;
    const max = valuesWithinWhiskers.length > 0 ? Math.max(...valuesWithinWhiskers) : whiskerUpper;
    const outliers = identifyOutliers(data, whiskerLower, whiskerUpper);
    const stats = {
        q1,
        q2,
        q3,
        iqr,
        min,
        max,
        whiskerLower,
        whiskerUpper,
        outliers,
    };
    if (includeMean) {
        const sum = data.reduce((acc, val) => acc + val, 0);
        stats.mean = sum / data.length;
    }
    return stats;
}
