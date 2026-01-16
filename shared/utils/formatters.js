/**
 * Utilitários para formatação de valores e dimensões
 */
/**
 * Adiciona separador de milhares a um número
 * @param numStr String do número a ser formatado
 * @returns String com separadores de milhares
 */
function addThousandsSeparator(numStr) {
    const parts = numStr.split('.');
    // Adicionar ponto a cada 3 dígitos da parte inteira
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    // Se houver parte decimal, usar vírgula como separador
    return parts.length > 1 ? parts.join(',') : parts[0];
}
/**
 * Formata um número no formato compacto (1.5K, 1.2M, etc.)
 */
function formatCompact(value, decimals = 1) {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absValue >= 1000000000) {
        return `${sign}${(absValue / 1000000000).toFixed(decimals)}B`;
    }
    if (absValue >= 1000000) {
        return `${sign}${(absValue / 1000000).toFixed(decimals)}M`;
    }
    if (absValue >= 1000) {
        return `${sign}${(absValue / 1000).toFixed(decimals)}K`;
    }
    return value.toFixed(decimals);
}
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
export function formatValue(value, formatType, decimals = 2, useThousandsSeparator = false, valueFormat = 'normal', prefix = '', suffix = '', showZero = true) {
    // Se não deve mostrar zero e o valor é zero, retornar vazio
    if (!showZero && value === 0) {
        return '';
    }
    let formatted;
    // Se formato compacto, aplicar antes do tipo
    if (valueFormat === 'compacto' && formatType !== 'percentage' && formatType !== 'porcentagem') {
        formatted = formatCompact(value, decimals);
        // Para moeda, adicionar prefixo R$ antes do valor compacto
        if (formatType === 'currency' || formatType === 'moeda') {
            return `${prefix}R$ ${formatted}${suffix}`;
        }
        return `${prefix}${formatted}${suffix}`;
    }
    switch (formatType) {
        case 'percentage':
        case 'porcentagem':
            formatted = (value * 100).toFixed(decimals);
            // Para porcentagem, aplicar separador apenas na parte numérica
            if (useThousandsSeparator) {
                formatted = addThousandsSeparator(formatted);
            }
            return `${prefix}${formatted}%${suffix}`;
        case 'currency':
        case 'moeda':
            formatted = value.toFixed(decimals);
            if (useThousandsSeparator) {
                formatted = addThousandsSeparator(formatted);
            }
            return `${prefix}R$ ${formatted}${suffix}`;
        case 'scientific':
        case 'cientifico':
            // Formato científico não usa separador de milhares
            return `${prefix}${value.toExponential(decimals)}${suffix}`;
        case 'integer':
        case 'inteiro':
            formatted = Math.round(value).toString();
            if (useThousandsSeparator) {
                formatted = addThousandsSeparator(formatted);
            }
            return `${prefix}${formatted}${suffix}`;
        case 'decimal':
        default:
            formatted = value.toFixed(decimals);
            if (useThousandsSeparator) {
                formatted = addThousandsSeparator(formatted);
            }
            return `${prefix}${formatted}${suffix}`;
    }
}
/**
 * Formata uma dimensão (data/hora) de acordo com o tipo especificado
 * @param value Valor da dimensão (pode ser string, número ou objeto ThoughtSpot)
 * @param formatType Tipo de formatação (auto, date, time, datetime, etc.)
 * @returns String formatada
 */
export function formatDimension(value, formatType = 'auto') {
    if (value === null || value === undefined)
        return '';
    const effectiveFormatType = formatType || 'auto';
    // Se for objeto com propriedade v (valor do ThoughtSpot)
    let rawValue = value;
    if (value && typeof value === 'object' && 'v' in value) {
        const thoughtSpotValue = value;
        rawValue = (typeof thoughtSpotValue.v === 'object' && thoughtSpotValue.v !== null)
            ? (thoughtSpotValue.v.s || thoughtSpotValue.v.n || thoughtSpotValue.v)
            : (thoughtSpotValue.v || value);
    }
    // Se for string, retorna como está (a menos que seja número como string)
    if (typeof rawValue === 'string') {
        // Tenta parsear se parecer um timestamp
        const numValue = Number(rawValue);
        if (!isNaN(numValue) && rawValue.length > 8 && effectiveFormatType !== 'auto') {
            rawValue = numValue;
        }
        else if (effectiveFormatType === 'auto') {
            return rawValue;
        }
    }
    // Se for timestamp (número)
    if (typeof rawValue === 'number') {
        // Timestamps do ThoughtSpot podem vir em segundos ou milissegundos
        // Se for muito grande (> 10^12), provavelmente está em milissegundos
        const timestamp = rawValue > 1000000000000 ? rawValue : rawValue * 1000;
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            return String(rawValue);
        }
        switch (effectiveFormatType.toLowerCase()) {
            case 'dd/mm/yyyy':
            case 'dd/MM/yyyy':
                return date.toLocaleDateString('pt-BR');
            case 'dd-mm-yyyy':
            case 'dd-MM-yyyy':
                return date.toLocaleDateString('pt-BR').replace(/\//g, '-');
            case 'yyyy-mm-dd':
            case 'yyyy-MM-dd':
                return date.toISOString().split('T')[0];
            case 'dd/mm/yyyy hh:mm':
            case 'dd/MM/yyyy HH:mm':
                return date.toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
            case 'dd/mm/yyyy hh:mm:ss':
            case 'dd/MM/yyyy HH:mm:ss':
                return date.toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
            case 'dia':
                return date.toLocaleDateString('pt-BR', { weekday: 'long' });
            case 'mês':
                return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            case 'mes/ano':
            case 'MM/yyyy':
                // Formato conciso: 01/2024
                const month = date.getMonth() + 1; // getMonth() retorna 0-11
                const year = date.getFullYear();
                const monthStr = month.toString().padStart(2, '0');
                return `${monthStr}/${year}`;
            case 'ano':
                return date.toLocaleDateString('pt-BR', { year: 'numeric' });
            case 'date':
            case 'data':
                return date.toLocaleDateString('pt-BR');
            case 'time':
            case 'hora':
                return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            case 'datetime':
            case 'datahora':
                return date.toLocaleString('pt-BR');
            case 'auto':
            default:
                return date.toLocaleString('pt-BR');
        }
    }
    return String(rawValue);
}
