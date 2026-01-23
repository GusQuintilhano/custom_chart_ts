/**
 * Type definitions for window properties used across the application
 */

/**
 * Extensão do Window para propriedades customizadas
 */
interface Window {
    /**
     * Habilita/desabilita logging de debug
     * Para habilitar: window.DEBUG_LOGGING = true
     */
    DEBUG_LOGGING?: boolean;
    
    /**
     * Endpoint customizado para analytics (opcional)
     */
    ANALYTICS_ENDPOINT?: string;
    
    /**
     * Habilita/desabilita analytics (opcional)
     */
    ANALYTICS_ENABLED?: boolean;
    
    /**
     * Render chart function para handlers (trellis-chart)
     */
    __renderChart?: import('../config/init').RenderChartFunction;
}
