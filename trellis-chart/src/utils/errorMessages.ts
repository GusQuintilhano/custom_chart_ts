/**
 * Mensagens de erro padronizadas
 */

export const ERROR_MESSAGES = {
    NO_DATA: '<div style="padding: 20px; text-align: center; color: #6b7280;"><p>Nenhum dado disponível para renderizar.</p></div>',
    INVALID_DATA: (data: unknown) => `<div style="padding: 20px; color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;"><h4 style="margin: 0 0 10px 0;">Estrutura de dados inválida</h4><p style="margin: 0;">Dados não estão no formato esperado.</p><details style="margin-top: 10px;"><summary style="cursor: pointer;">Ver estrutura recebida</summary><pre style="font-size: 11px;">${JSON.stringify(data, null, 2)}</pre></details></div>`,
    INSUFFICIENT_DATA: '<div style="padding: 20px; color: #f59e0b; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px;"><h4 style="margin: 0 0 10px 0;">Dados insuficientes</h4><p style="margin: 0;">É necessário pelo menos 1 dimensão e 1 medida.</p></div>',
    PROCESSING_ERROR: '<div style="padding: 20px; color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;"><h4 style="margin: 0 0 10px 0;">Erro ao processar dados</h4><p style="margin: 0;">Nenhum dado válido foi encontrado.</p></div>',
    CHART_NOT_FOUND: 'Elemento #chart não encontrado',
} as const;

