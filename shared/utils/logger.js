/**
 * Sistema de logging condicional
 * Logs apenas em modo desenvolvimento ou quando explicitamente habilitado
 *
 * Em produção, os logs de debug são automaticamente removidos/desabilitados
 * Para habilitar em produção, defina window.DEBUG_LOGGING = true no console
 */
// Verifica se está em modo desenvolvimento via window
// Para habilitar logs em produção, defina window.DEBUG_LOGGING = true no console do navegador
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEBUG_ENABLED = typeof window !== 'undefined' && window.DEBUG_LOGGING === true;
/**
 * Logger condicional - apenas loga em desenvolvimento
 */
export const logger = {
    /**
     * Log de debug (apenas em desenvolvimento)
     */
    debug: (...args) => {
        if (DEBUG_ENABLED) {
            console.log(...args);
        }
    },
    /**
     * Log de informação (apenas em desenvolvimento)
     */
    info: (...args) => {
        if (DEBUG_ENABLED) {
            console.info(...args);
        }
    },
    /**
     * Log de aviso (sempre ativo, mas menos verboso)
     */
    warn: (...args) => {
        console.warn(...args);
    },
    /**
     * Log de erro (sempre ativo)
     */
    error: (...args) => {
        console.error(...args);
    },
};
