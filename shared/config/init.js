/**
 * Módulo de inicialização do Chart SDK (versão compartilhada e abstraída)
 */
import { getChartContext, ChartToTSEvent } from '@thoughtspot/ts-chart-sdk';
import { logger } from '../utils/logger';
import { analytics } from '../utils/analytics';
/**
 * Inicializa o Chart SDK e configura o contexto (versão genérica para múltiplos gráficos)
 */
export async function initializeChartSDK(renderChart, configFunctions, editorFunctions) {
    try {
        const ctx = await getChartContext({
            getDefaultChartConfig: configFunctions.getDefaultChartConfig,
            getQueriesFromChartConfig: configFunctions.getQueriesFromChartConfig,
            visualPropEditorDefinition: editorFunctions.visualPropEditorDefinition,
            chartConfigEditorDefinition: editorFunctions.chartConfigEditorDefinition,
            renderChart,
        });
        await renderChart(ctx);
        return ctx;
    }
    catch (error) {
        // Rastrear erros de inicialização (tentamos identificar o tipo de gráfico pelo contexto)
        // Como não temos acesso direto ao tipo aqui, usamos 'trellis' como padrão
        // Os gráficos individuais podem sobrescrever isso
        analytics.trackError('trellis', error instanceof Error ? error : String(error), {
            context: 'sdk_initialization',
        });
        logger.error('Erro no init:', error);
        throw error;
    }
}
/**
 * Emite evento de renderização completa
 */
export function emitRenderComplete(ctx) {
    try {
        ctx.emitEvent(ChartToTSEvent.RenderComplete);
    }
    catch (error) {
        logger.warn('Erro ao emitir RenderComplete:', error);
    }
}
