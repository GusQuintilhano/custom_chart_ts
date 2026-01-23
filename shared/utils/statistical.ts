/**
 * Utilitários para cálculos estatísticos (usado principalmente em Boxplot)
 */

/**
 * Calcula os quartis (Q1, Q2/mediana, Q3) de um array de números
 * @param data Array de números ordenados ou não ordenados
 * @returns Objeto com quartis calculados
 */
export function calculateQuartiles(data: number[]): { q1: number; q2: number; q3: number } {
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
function calculatePercentile(sorted: number[], percentile: number): number {
    if (sorted.length === 0) return 0;
    if (sorted.length === 1) return sorted[0];

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
export function calculateIQR(q1: number, q3: number): number {
    return q3 - q1;
}

/**
 * Calcula os limites dos bigodes (whiskers) do boxplot
 * @param q1 Quartil 1
 * @param q3 Quartil 3
 * @param iqr Interquartile Range
 * @returns Limites inferior e superior dos bigodes
 */
export function calculateWhiskers(
    q1: number,
    q3: number,
    iqr: number
): { lower: number; upper: number } {
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
export function identifyOutliers(
    data: number[],
    lower: number,
    upper: number
): number[] {
    return data.filter(value => value < lower || value > upper);
}

/**
 * Estatísticas completas para boxplot
 */
export interface BoxplotStatistics {
    q1: number;
    q2: number; // Mediana
    q3: number;
    iqr: number;
    min: number; // Valor mínimo (dentro dos bigodes)
    max: number; // Valor máximo (dentro dos bigodes)
    whiskerLower: number;
    whiskerUpper: number;
    outliers: number[];
    mean?: number; // Média (opcional)
}

/**
 * Tipo de método de cálculo dos quartis
 */
export type CalculationMethod = 'auto' | 'tukey' | 'exclusive' | 'inclusive';

/**
 * Tipo de bigode (whisker)
 */
export type WhiskerType = 'data_extremes' | 'iqr_1_5' | 'iqr_3' | 'percentile_5_95' | 'min_max';

/**
 * Calcula quartis usando diferentes métodos
 * @param sorted Array ordenado de números
 * @param method Método de cálculo
 * @returns Quartis calculados
 */
function calculateQuartilesByMethod(sorted: number[], method: CalculationMethod): { q1: number; q2: number; q3: number } {
    if (sorted.length === 0) {
        return { q1: 0, q2: 0, q3: 0 };
    }

    const n = sorted.length;
    const mid = Math.floor(n / 2);

    switch (method) {
        case 'tukey':
        case 'auto': // Usar Tukey como padrão
            // Método de Tukey (método mais comum): usar a mediana da metade inferior/superior
            const lowerHalf = sorted.slice(0, mid);
            const upperHalf = n % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);
            
            const q1 = calculatePercentile(lowerHalf, 50); // Mediana da metade inferior
            const q2 = calculatePercentile(sorted, 50); // Mediana geral
            const q3 = calculatePercentile(upperHalf, 50); // Mediana da metade superior
            
            return { q1, q2, q3 };

        case 'inclusive':
            // Método inclusivo: inclui a mediana em ambas as metades
            const lowerHalfInc = sorted.slice(0, mid + 1);
            const upperHalfInc = sorted.slice(mid);
            
            const q1Inc = calculatePercentile(lowerHalfInc, 50);
            const q2Inc = calculatePercentile(sorted, 50);
            const q3Inc = calculatePercentile(upperHalfInc, 50);
            
            return { q1: q1Inc, q2: q2Inc, q3: q3Inc };

        case 'exclusive':
            // Método exclusivo: exclui a mediana das metades
            const lowerHalfExc = sorted.slice(0, mid);
            const upperHalfExc = n % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);
            
            const q1Exc = calculatePercentile(lowerHalfExc, 50);
            const q2Exc = calculatePercentile(sorted, 50);
            const q3Exc = calculatePercentile(upperHalfExc, 50);
            
            return { q1: q1Exc, q2: q2Exc, q3: q3Exc };

        default:
            // Fallback para método padrão
            return calculateQuartiles(sorted);
    }
}

/**
 * Calcula limites dos bigodes usando diferentes métodos
 * @param data Array de números (ordenado)
 * @param q1 Quartil 1
 * @param q3 Quartil 3
 * @param iqr Interquartile Range
 * @param whiskerType Tipo de cálculo do bigode
 * @returns Limites inferior e superior dos bigodes
 */
function calculateWhiskersByType(
    data: number[],
    q1: number,
    q3: number,
    iqr: number,
    whiskerType: WhiskerType
): { lower: number; upper: number } {
    if (data.length === 0) {
        return { lower: 0, upper: 0 };
    }

    const sorted = [...data].sort((a, b) => a - b);
    const dataMin = sorted[0];
    const dataMax = sorted[sorted.length - 1];

    switch (whiskerType) {
        case 'iqr_1_5':
            // Método padrão: Q1 - 1.5*IQR e Q3 + 1.5*IQR
            return {
                lower: q1 - 1.5 * iqr,
                upper: q3 + 1.5 * iqr,
            };

        case 'iqr_3':
            // Método mais conservador: Q1 - 3*IQR e Q3 + 3*IQR
            return {
                lower: q1 - 3 * iqr,
                upper: q3 + 3 * iqr,
            };

        case 'data_extremes':
            // Usar extremos dos dados
            return {
                lower: dataMin,
                upper: dataMax,
            };

        case 'percentile_5_95':
            // Usar percentis 5 e 95
            return {
                lower: calculatePercentile(sorted, 5),
                upper: calculatePercentile(sorted, 95),
            };

        case 'min_max':
            // Min e Max dos dados (sem outliers)
            // Filtrar outliers usando IQR 1.5 primeiro
            const { lower: tempLower, upper: tempUpper } = calculateWhiskers(q1, q3, iqr);
            const filtered = sorted.filter(v => v >= tempLower && v <= tempUpper);
            return {
                lower: filtered.length > 0 ? filtered[0] : dataMin,
                upper: filtered.length > 0 ? filtered[filtered.length - 1] : dataMax,
            };

        default:
            // Fallback para método padrão
            return calculateWhiskers(q1, q3, iqr);
    }
}

/**
 * Calcula todas as estatísticas necessárias para um boxplot
 * @param data Array de números
 * @param includeMean Se deve calcular a média também
 * @param calculationMethod Método de cálculo dos quartis (default: 'auto')
 * @param whiskerType Tipo de cálculo dos bigodes (default: 'iqr_1_5')
 * @returns Estatísticas completas do boxplot
 */
export function calculateBoxplotStats(
    data: number[],
    includeMean: boolean = false,
    calculationMethod: CalculationMethod = 'auto',
    whiskerType: WhiskerType = 'iqr_1_5'
): BoxplotStatistics {
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

    const sorted = [...data].sort((a, b) => a - b);
    const { q1, q2, q3 } = calculateQuartilesByMethod(sorted, calculationMethod);
    const iqr = calculateIQR(q1, q3);
    const { lower: whiskerLower, upper: whiskerUpper } = calculateWhiskersByType(sorted, q1, q3, iqr, whiskerType);

    // Valores mínimo e máximo dentro dos bigodes (não outliers)
    const valuesWithinWhiskers = sorted.filter(
        value => value >= whiskerLower && value <= whiskerUpper
    );
    const min = valuesWithinWhiskers.length > 0 ? Math.min(...valuesWithinWhiskers) : whiskerLower;
    const max = valuesWithinWhiskers.length > 0 ? Math.max(...valuesWithinWhiskers) : whiskerUpper;

    const outliers = identifyOutliers(sorted, whiskerLower, whiskerUpper);

    const stats: BoxplotStatistics = {
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

