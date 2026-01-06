/**
 * Módulo de inicialização do Chart SDK (versão compartilhada e abstraída)
 */

import { 
    getChartContext, 
    type CustomChartContext, 
    ChartToTSEvent,
    type ChartConfig,
    type Query,
    type ChartModel,
    type VisualPropEditorDefinition,
    type ChartConfigEditorDefinition
} from '@thoughtspot/ts-chart-sdk';
import { logger } from '../utils/logger';

export interface RenderChartFunction {
    (context: CustomChartContext): Promise<void>;
}

export interface ChartConfigFunctions {
    getDefaultChartConfig: (chartModel: ChartModel) => ChartConfig[];
    getQueriesFromChartConfig: (chartConfig: ChartConfig[]) => Query[];
}

export interface ChartEditorFunctions {
    visualPropEditorDefinition: (chartModel: ChartModel, ctx: CustomChartContext) => VisualPropEditorDefinition;
    chartConfigEditorDefinition?: () => ChartConfigEditorDefinition[];
}

/**
 * Inicializa o Chart SDK e configura o contexto (versão genérica para múltiplos gráficos)
 */
export async function initializeChartSDK(
    renderChart: RenderChartFunction,
    configFunctions: ChartConfigFunctions,
    editorFunctions: ChartEditorFunctions
): Promise<CustomChartContext> {
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
    } catch (error) {
        logger.error('Erro no init:', error);
        throw error;
    }
}

/**
 * Emite evento de renderização completa
 */
export function emitRenderComplete(ctx: CustomChartContext): void {
    try {
        ctx.emitEvent(ChartToTSEvent.RenderComplete);
    } catch (error) {
        logger.warn('Erro ao emitir RenderComplete:', error);
    }
}

