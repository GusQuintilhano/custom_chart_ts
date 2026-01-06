/**
 * Módulo de inicialização do Chart SDK
 */

import { getChartContext, type CustomChartContext, ChartToTSEvent } from '@thoughtspot/ts-chart-sdk';
import { logger } from '@shared/utils/logger';
import { initializeChartSDK as initShared } from '@shared/config/init';
import { getDefaultChartConfig, getQueriesFromChartConfig } from './chartConfig';
import { createVisualPropEditorDefinition, createChartConfigEditorDefinition } from './visualPropEditor';

export interface RenderChartFunction {
    (context: CustomChartContext): Promise<void>;
}

/**
 * Inicializa o Chart SDK e configura o contexto (wrapper para usar shared)
 */
export async function initializeChartSDK(renderChart: RenderChartFunction): Promise<CustomChartContext> {
    return initShared(renderChart, {
        getDefaultChartConfig,
        getQueriesFromChartConfig,
    }, {
        visualPropEditorDefinition: createVisualPropEditorDefinition,
        chartConfigEditorDefinition: createChartConfigEditorDefinition,
    });
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

