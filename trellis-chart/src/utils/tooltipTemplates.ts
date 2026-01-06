/**
 * Templates pré-definidos para tooltips personalizados
 */

export type TemplateId = 
    | 'default'
    | 'valor_medida_dimensao1_dimensao2'
    | 'medida_valor_dimensao1'
    | 'dimensao1_medida_valor'
    | 'dimensao2_dimensao1_medida_valor'
    | 'valor_medida'
    | 'medida_valor';

/**
 * Retorna o template formatado baseado no ID do template
 */
/**
 * Mapeamento de IDs de template para nomes legíveis (para exibição no dropdown)
 */
export const TEMPLATE_LABELS: Record<TemplateId, string> = {
    'default': 'Padrão',
    'valor_medida_dimensao1_dimensao2': 'Tivemos {valor} de {medida} na {dimensao1} no horário do {dimensao2}',
    'medida_valor_dimensao1': '{medida}: {valor} na {dimensao1}',
    'dimensao1_medida_valor': '{dimensao1} - {medida}: {valor}',
    'dimensao2_dimensao1_medida_valor': '{dimensao2} - {dimensao1}: {medida} {valor}',
    'valor_medida': '{valor} de {medida}',
    'medida_valor': '{medida}: {valor}',
};

/**
 * Retorna o template formatado baseado no ID do template
 */
export function getTemplateById(templateId: TemplateId): string {
    const templates: Record<TemplateId, string> = {
        'default': '', // Usa formatação padrão
        'valor_medida_dimensao1_dimensao2': 'Tivemos {valor} de {medida} na {dimensao1} no horário do {dimensao2}.',
        'medida_valor_dimensao1': '{medida}: {valor} na {dimensao1}',
        'dimensao1_medida_valor': '{dimensao1} - {medida}: {valor}',
        'dimensao2_dimensao1_medida_valor': '{dimensao2} - {dimensao1}: {medida} {valor}',
        'valor_medida': '{valor} de {medida}',
        'medida_valor': '{medida}: {valor}',
    };
    
    return templates[templateId] || '';
}

