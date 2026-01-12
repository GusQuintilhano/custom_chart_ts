/**
 * Configurações do Boxplot Chart (ChartConfig)
 */

import { ChartConfig, ChartModel, ColumnType, Query } from '@thoughtspot/ts-chart-sdk';
import { logger } from '@shared/utils/logger';

/**
 * Gera o ChartConfig padrão para Boxplot
 * Boxplot requer: 1 medida + múltiplas dimensões
 */
export function getDefaultChartConfig(chartModel: ChartModel): ChartConfig[] {
    logger.debug('===== getDefaultChartConfig (Boxplot) CHAMADO =====');
    
    const cols = chartModel.columns;

    const measureColumns = cols.filter(
        (col) => col.type === ColumnType.MEASURE,
    );

    const attributeColumns = cols.filter(
        (col) => col.type === ColumnType.ATTRIBUTE,
    );

    logger.debug('Medidas encontradas:', measureColumns.length);
    logger.debug('Dimensões encontradas:', attributeColumns.length);

    // Boxplot requer pelo menos 1 medida e 1 dimensão
    if (attributeColumns.length === 0 || measureColumns.length === 0) {
        logger.debug('Sem colunas válidas, retornando []');
        return [];
    }

    // Usar primeira medida e todas as dimensões (primeira para Eixo X, demais opcionalmente para detalhe)
    const axisConfig: ChartConfig = {
        key: 'column',
        dimensions: [
            {
                key: 'x',
                columns: attributeColumns.length > 0 ? [attributeColumns[0]] : [], // Primeira dimensão para Eixo X
            },
            {
                key: 'detail',
                columns: attributeColumns.length > 1 ? attributeColumns.slice(1) : [], // Demais dimensões para detalhe (opcional)
            },
            {
                key: 'y',
                columns: [measureColumns[0]], // Primeira medida
            },
        ],
    };

    logger.debug('ChartConfig gerado com 1 medida e', attributeColumns.length, 'dimensões');
    return [axisConfig];
}

/**
 * Gera queries baseadas no ChartConfig
 */
export function getQueriesFromChartConfig(chartConfig: ChartConfig[]): Array<Query> {
    logger.debug('getQueriesFromChartConfig (Boxplot) chamado');

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

    logger.debug('Queries geradas:', queries.length);
    return queries;
}

