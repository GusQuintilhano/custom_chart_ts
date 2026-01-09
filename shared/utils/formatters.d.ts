/**
 * Utilitários para formatação de valores e dimensões
 */
/**
 * Formata um valor numérico de acordo com o tipo especificado
 * @param value Valor numérico a ser formatado
 * @param formatType Tipo de formatação (decimal, porcentagem, moeda, cientifico, inteiro)
 * @param decimals Número de casas decimais (padrão: 2)
 * @param useThousandsSeparator Se deve usar separador de milhares (padrão: false)
 * @param valueFormat Formato do valor ('normal' | 'compacto')
 * @param prefix Prefixo antes do valor
 * @param suffix Sufixo depois do valor
 * @param showZero Se deve mostrar valores zero (se false e value === 0, retorna string vazia)
 * @returns String formatada
 */
export declare function formatValue(value: number, formatType: string, decimals?: number, useThousandsSeparator?: boolean, valueFormat?: 'normal' | 'compacto', prefix?: string, suffix?: string, showZero?: boolean): string;
/**
 * Formata uma dimensão (data/hora) de acordo com o tipo especificado
 * @param value Valor da dimensão (pode ser string, número ou objeto ThoughtSpot)
 * @param formatType Tipo de formatação (auto, date, time, datetime, etc.)
 * @returns String formatada
 */
export declare function formatDimension(value: unknown, formatType?: string): string;
