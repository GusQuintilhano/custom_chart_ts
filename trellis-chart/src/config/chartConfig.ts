/**
 * Configurações do gráfico (ChartConfig)
 */

import { ChartConfig, ChartModel, ColumnType, Query } from '@thoughtspot/ts-chart-sdk';
import { logger } from '@shared/utils/logger';

/**
 * Gera o ChartConfig padrão baseado nas colunas do modelo
 */
export function getDefaultChartConfig(chartModel: ChartModel): ChartConfig[] {
    logger.debug('===== getDefaultChartConfig CHAMADO =====');
    logger.debug('chartModel.columns.length:', chartModel.columns?.length);
    
    const cols = chartModel.columns;

    const measureColumns = cols.filter(
        (col) => col.type === ColumnType.MEASURE,
    );

    const attributeColumns = cols.filter(
        (col) => col.type === ColumnType.ATTRIBUTE,
    );

        logger.debug('Medidas encontradas no chartModel:', measureColumns.length);
        logger.debug('Nomes das medidas:', measureColumns.map(m => ({ id: m.id, name: m.name })));
        logger.debug('Dimensões encontradas:', attributeColumns.length);
        logger.debug('Nomes das dimensões:', attributeColumns.map(d => ({ id: d.id, name: d.name })));

    if (attributeColumns.length === 0 || measureColumns.length === 0) {
        logger.debug('Sem colunas válidas, retornando []');
        return [];
    }

    // Incluir TODAS as dimensões para suportar múltiplas dimensões (ex: Data e Turno)
    // IMPORTANTE: Incluir TODAS as medidas para que a query busque dados de todas elas
    const axisConfig: ChartConfig = {
        key: 'column',
        dimensions: [
            {
                key: 'x',
                columns: attributeColumns, // Incluir todas as dimensões
            },
            {
                key: 'y',
                columns: measureColumns, // Incluir TODAS as medidas - isso é crítico!
            },
        ],
    };
    
    logger.debug('ChartConfig gerado com', measureColumns.length, 'medidas e', attributeColumns.length, 'dimensões');
    logger.debug('===== FIM getDefaultChartConfig =====');
    return [axisConfig];
}

/**
 * Gera queries baseadas no ChartConfig
 */
export function getQueriesFromChartConfig(chartConfig: ChartConfig[]): Array<Query> {
    logger.debug('getQueriesFromChartConfig chamado');
    logger.debug('chartConfig recebido:', JSON.stringify(chartConfig, null, 2));
    
    // Contar medidas no chartConfig para detectar possíveis problemas
    const measuresInConfig = chartConfig.flatMap(config => 
        config.dimensions.find(d => d.key === 'y')?.columns || []
    );
    logger.debug(`📤 [DEBUG] Medidas no chartConfig: ${measuresInConfig.length}`, 
        measuresInConfig.map(m => ({ id: m.id, name: m.name })));
    
    // ⚠️ AVISO CRÍTICO: Se getQueriesFromChartConfig está sendo chamado mas getDefaultChartConfig
    // não foi chamado recentemente quando uma nova medida foi adicionada, o chartConfig estará
    // desatualizado (em cache) e a nova medida não será incluída na query.
    // Isso é uma limitação do ThoughtSpot que usa cache do ChartConfig.
    // SOLUÇÃO: O usuário deve mudar qualquer configuração do gráfico (ex: toggles) para forçar
    // o ThoughtSpot a re-executar getDefaultChartConfig.
    
    // map all the columns in the config to the query array
    const queries = chartConfig.map(
        (config: ChartConfig): Query =>
            config.dimensions.reduce(
                (acc: Query, dimension) => ({
                    queryColumns: [
                        ...acc.queryColumns,
                        ...dimension.columns,
                    ],
                }),
                {
                    queryColumns: [],
                } as Query,
            ),
    );
    
    logger.debug('📤 [DEBUG] Queries geradas:', JSON.stringify(queries, null, 2));
    logger.debug('📤 [DEBUG] Total de queries:', queries.length);
    queries.forEach((q, idx) => {
        logger.debug(`📤 [DEBUG] Query ${idx} tem ${q.queryColumns?.length || 0} colunas`);
        const measureCols = q.queryColumns.filter(col => col.type === ColumnType.MEASURE);
        logger.debug(`📤 [DEBUG] Query ${idx} - Medidas incluídas: ${measureCols.length}`, 
            measureCols.map(m => ({ id: m.id, name: m.name })));
    });
    
    return queries;
}

