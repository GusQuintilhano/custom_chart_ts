/**
 * Módulo de inicialização do Chart SDK
 */

import { getChartContext, type CustomChartContext, ChartToTSEvent } from '@thoughtspot/ts-chart-sdk';
import { logger } from '../utils/logger';
import { getDefaultChartConfig, getQueriesFromChartConfig } from './chartConfig';
import { createVisualPropEditorDefinition, createChartConfigEditorDefinition } from './visualPropEditor';

export interface RenderChartFunction {
    (context: CustomChartContext): Promise<void>;
}

/**
 * Inicializa o Chart SDK e configura o contexto
 */
export async function initializeChartSDK(renderChart: RenderChartFunction): Promise<CustomChartContext> {
    try {
        const ctx = await getChartContext({
            getDefaultChartConfig: getDefaultChartConfig,
            getQueriesFromChartConfig: getQueriesFromChartConfig,
            visualPropEditorDefinition: createVisualPropEditorDefinition,
            chartConfigEditorDefinition: createChartConfigEditorDefinition,
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

