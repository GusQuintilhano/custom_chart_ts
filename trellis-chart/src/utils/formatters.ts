/**
 * Utilitários para formatação de valores e dimensões
 */

/**
 * Adiciona separador de milhares a um número
 * @param numStr String do número a ser formatado
 * @returns String com separadores de milhares
 */
function addThousandsSeparator(numStr: string): string {
    const parts = numStr.split('.');
    // Adicionar ponto a cada 3 dígitos da parte inteira
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    // Se houver parte decimal, usar vírgula como separador
    return parts.length > 1 ? parts.join(',') : parts[0];
}

/**
 * Formata um valor numérico de acordo com o tipo especificado
 * @param value Valor numérico a ser formatado
 * @param formatType Tipo de formatação (decimal, porcentagem, moeda, cientifico, inteiro)
 * @param decimals Número de casas decimais (padrão: 2)
 * @param useThousandsSeparator Se deve usar separador de milhares (padrão: false)
 * @returns String formatada
 */
export function formatValue(
    value: number, 
    formatType: string, 
    decimals: number = 2, 
    useThousandsSeparator: boolean = false
): string {
    let formatted: string;
    
    switch (formatType) {
        case 'percentage':
        case 'porcentagem':
            formatted = (value * 100).toFixed(decimals);
            // Para porcentagem, aplicar separador apenas na parte numérica
            if (useThousandsSeparator) {
                formatted = addThousandsSeparator(formatted);
            }
            return `${formatted}%`;
        case 'currency':
        case 'moeda':
            formatted = value.toFixed(decimals);
            if (useThousandsSeparator) {
                formatted = addThousandsSeparator(formatted);
            }
            return `R$ ${formatted}`;
        case 'scientific':
        case 'cientifico':
            // Formato científico não usa separador de milhares
            return value.toExponential(decimals);
        case 'integer':
        case 'inteiro':
            formatted = Math.round(value).toString();
            if (useThousandsSeparator) {
                formatted = addThousandsSeparator(formatted);
            }
            return formatted;
        case 'decimal':
        default:
            formatted = value.toFixed(decimals);
            if (useThousandsSeparator) {
                formatted = addThousandsSeparator(formatted);
            }
            return formatted;
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

