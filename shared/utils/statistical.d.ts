/**
 * Utilitários para cálculos estatísticos (usado principalmente em Boxplot)
 */
/**
 * Calcula os quartis (Q1, Q2/mediana, Q3) de um array de números
 * @param data Array de números ordenados ou não ordenados
 * @returns Objeto com quartis calculados
 */
export declare function calculateQuartiles(data: number[]): {
    q1: number;
    q2: number;
    q3: number;
};
/**
 * Calcula o Interquartile Range (IQR)
 * @param q1 Quartil 1
 * @param q3 Quartil 3
 * @returns IQR
 */
export declare function calculateIQR(q1: number, q3: number): number;
/**
 * Calcula os limites dos bigodes (whiskers) do boxplot
 * @param q1 Quartil 1
 * @param q3 Quartil 3
 * @param iqr Interquartile Range
 * @returns Limites inferior e superior dos bigodes
 */
export declare function calculateWhiskers(q1: number, q3: number, iqr: number): {
    lower: number;
    upper: number;
};
/**
 * Identifica outliers em um array de dados
 * @param data Array de números
 * @param lower Limite inferior (geralmente calculado por calculateWhiskers)
 * @param upper Limite superior (geralmente calculado por calculateWhiskers)
 * @returns Array com valores que são outliers
 */
export declare function identifyOutliers(data: number[], lower: number, upper: number): number[];
/**
 * Estatísticas completas para boxplot
 */
export interface BoxplotStatistics {
    q1: number;
    q2: number;
    q3: number;
    iqr: number;
    min: number;
    max: number;
    whiskerLower: number;
    whiskerUpper: number;
    outliers: number[];
    mean?: number;
}
/**
 * Calcula todas as estatísticas necessárias para um boxplot
 * @param data Array de números
 * @param includeMean Se deve calcular a média também
 * @returns Estatísticas completas do boxplot
 */
export declare function calculateBoxplotStats(data: number[], includeMean?: boolean): BoxplotStatistics;
