/**
 * Utilitários para formatação de valores e dimensões
 */

/**
 * Formata um valor numérico de acordo com o tipo especificado
 * @param value Valor numérico a ser formatado
 * @param formatType Tipo de formatação (percentage, currency, scientific, integer, decimal)
 * @param decimals Número de casas decimais (padrão: 2)
 * @returns String formatada
 */
export function formatValue(value: number, formatType: string, decimals: number = 2): string {
    switch (formatType) {
        case 'percentage':
        case 'porcentagem':
            return `${(value * 100).toFixed(decimals)}%`;
        case 'currency':
        case 'moeda':
            return `R$ ${value.toFixed(decimals)}`;
        case 'scientific':
        case 'científico':
            return value.toExponential(decimals);
        case 'integer':
        case 'inteiro':
            return Math.round(value).toString();
        case 'decimal':
        default:
            return value.toFixed(decimals);
    }
}

/**
 * Formata uma dimensão (data/hora) de acordo com o tipo especificado
 * @param value Valor da dimensão (pode ser string, número ou objeto ThoughtSpot)
 * @param formatType Tipo de formatação (auto, date, time, datetime, etc.)
 * @returns String formatada
 */
export function formatDimension(value: unknown, formatType: string = 'auto'): string {
    if (value === null || value === undefined) return '';
    
    const effectiveFormatType = formatType || 'auto';
    
    // Se for objeto com propriedade v (valor do ThoughtSpot)
    let rawValue = value;
    if (value && typeof value === 'object' && 'v' in value) {
        const thoughtSpotValue = value as { v?: { s?: string; n?: number } | number | string };
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
        } else if (effectiveFormatType === 'auto') {
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

