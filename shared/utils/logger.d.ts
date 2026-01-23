/**
 * Sistema de logging condicional
 * Logs apenas em modo desenvolvimento ou quando explicitamente habilitado
 *
 * Em produção, os logs de debug são automaticamente removidos/desabilitados
 * Para habilitar em produção, defina window.DEBUG_LOGGING = true no console
 */
/**
 * Logger condicional - apenas loga em desenvolvimento
 */
export declare const logger: {
    /**
     * Log de debug (apenas em desenvolvimento)
     */
    debug: (...args: unknown[]) => void;
    /**
     * Log de informação (apenas em desenvolvimento)
     */
    info: (...args: unknown[]) => void;
    /**
     * Log de aviso (sempre ativo, mas menos verboso)
     */
    warn: (...args: unknown[]) => void;
    /**
     * Log de erro (sempre ativo)
     */
    error: (...args: unknown[]) => void;
};
