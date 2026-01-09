/**
 * Módulo de inicialização do Chart SDK (versão compartilhada e abstraída)
 */
import { type CustomChartContext, type ChartConfig, type Query, type ChartModel, type VisualPropEditorDefinition, type ChartConfigEditorDefinition } from '@thoughtspot/ts-chart-sdk';
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
export declare function initializeChartSDK(renderChart: RenderChartFunction, configFunctions: ChartConfigFunctions, editorFunctions: ChartEditorFunctions): Promise<CustomChartContext>;
/**
 * Emite evento de renderização completa
 */
export declare function emitRenderComplete(ctx: CustomChartContext): void;
