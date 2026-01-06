/**
 * Handler para gerenciar medidas faltantes nos dados
 * Implementa lógica de retry e atualização quando medidas são adicionadas
 */

import { ChartToTSEvent, CustomChartContext } from '@thoughtspot/ts-chart-sdk';
import type { ChartColumn } from '@thoughtspot/ts-chart-sdk';
import type { ChartElement } from '../types/chartTypes';
import { extractDataPointsArray, createColumnIndexMap } from '../utils/dataProcessing';
import { logger } from '@shared/utils/logger';

/**
 * Configura retry logic para medidas faltantes
 */
export async function setupMissingMeasuresRetry(
    ctx: CustomChartContext,
    chartElement: ChartElement,
    missingMeasures: ChartColumn[]
): Promise<void> {
    if (missingMeasures.length === 0) {
        return;
    }

    logger.warn('Medidas não encontradas nos dados (pode ser que os dados ainda estejam carregando):', 
        missingMeasures.map(m => ({ id: m.id, name: m.name })));
    logger.warn('Essas medidas aparecerão com valor 0 até que os dados sejam carregados');
    
    // Limpar qualquer retry anterior para evitar múltiplos intervalos
    if (chartElement.__retryTimeout) {
        clearTimeout(chartElement.__retryTimeout);
        chartElement.__retryTimeout = null;
    }
    if (chartElement.__retryInterval) {
        clearInterval(chartElement.__retryInterval);
        chartElement.__retryInterval = null;
    }
    
    // Criar uma cópia dos IDs das medidas faltantes para evitar problemas de referência
    const missingMeasureIds = missingMeasures.map(m => m.id);
    
    // TENTATIVA DE FORÇAR ATUALIZAÇÃO: Quando detectamos medidas faltando, vamos tentar
    // emitir um evento UpdateVisualProps para forçar o ThoughtSpot a re-executar getDefaultChartConfig.
    const tryForceRefresh = async () => {
        try {
            const currentChartModel = ctx.getChartModel();
            const currentVisualProps = currentChartModel.visualProps || {};
            const columnDependency = (currentVisualProps as any)?._column_dependency || {};
            
            const currentRefreshTrigger = (columnDependency as any)?._refresh_trigger || 0;
            const newRefreshTrigger = currentRefreshTrigger + 1;
            
            logger.debug(`Tentando forçar atualização emitindo UpdateVisualProps...`);
            logger.debug(`Refresh trigger atual: ${currentRefreshTrigger} -> novo: ${newRefreshTrigger}`);
            logger.debug(`Medidas faltando:`, missingMeasures.map(m => m.name));
            
            await ctx.emitEvent(ChartToTSEvent.UpdateVisualProps, {
                visualProps: {
                    ...(currentVisualProps as Record<string, unknown>),
                    _column_dependency: {
                        ...(columnDependency as Record<string, unknown>),
                        _refresh_trigger: newRefreshTrigger,
                        _missing_measures_count: missingMeasures.length,
                    },
                },
            });
            
            logger.debug('UpdateVisualProps emitido com sucesso');
        } catch (error) {
            logger.warn('Erro ao tentar emitir UpdateVisualProps para forçar atualização:', error);
        }
    };
    
    // Tentar forçar atualização imediatamente quando detectamos medidas faltando
    await tryForceRefresh();
    
    // Função para verificar e re-renderizar se necessário
    const checkAndRetry = async (attemptNumber: number, renderChartFn: () => Promise<void>): Promise<boolean> => {
        logger.debug(`Tentativa ${attemptNumber}: Verificando se dados das medidas faltantes foram carregados...`);
        
        try {
            const updatedChartModel = ctx.getChartModel();
            const updatedData = updatedChartModel.data;
            
            if (!updatedData || updatedData.length === 0) {
                logger.debug(`Tentativa ${attemptNumber}: Ainda não há dados disponíveis`);
                return false;
            }
            
            const updatedDataArr = extractDataPointsArray(updatedData);
            if (!updatedDataArr) {
                logger.debug(`Tentativa ${attemptNumber}: Estrutura de dados ainda não está pronta`);
                return false;
            }
            
            const updatedColumnMap = createColumnIndexMap(updatedDataArr.columns);
            
            // Verificar se as medidas que estavam faltando agora estão presentes
            const nowAvailable = missingMeasureIds.filter(id => updatedColumnMap.has(id));
            const stillMissing = missingMeasureIds.filter(id => !updatedColumnMap.has(id));
            
            logger.debug(`Tentativa ${attemptNumber}: Colunas disponíveis:`, updatedDataArr.columns);
            logger.debug(`Tentativa ${attemptNumber}: ${nowAvailable.length} medida(s) agora disponível(is), ${stillMissing.length} ainda faltando`);
            logger.debug(`Tentativa ${attemptNumber}: IDs encontrados:`, nowAvailable);
            logger.debug(`Tentativa ${attemptNumber}: IDs ainda faltando:`, stillMissing);
            
            if (nowAvailable.length > 0) {
                const availableMeasures = missingMeasures.filter(m => nowAvailable.includes(m.id));
                logger.debug(`Dados atualizados após ${attemptNumber} tentativa(s)! Medidas encontradas:`, 
                    availableMeasures.map(m => m.name));
                logger.debug('Re-renderizando gráfico com dados atualizados...');
                
                // Limpar intervalos antes de re-renderizar
                if (chartElement.__retryTimeout) {
                    clearTimeout(chartElement.__retryTimeout);
                    chartElement.__retryTimeout = null;
                }
                if (chartElement.__retryInterval) {
                    clearInterval(chartElement.__retryInterval);
                    chartElement.__retryInterval = null;
                }
                
                // Aguardar um pouco mais antes de re-renderizar para garantir que os dados estão completos
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Re-renderizar o gráfico
                await renderChartFn();
                return true;
            }
        } catch (error) {
            logger.error(`Erro na tentativa ${attemptNumber}:`, error);
        }
        
        return false;
    };
    
    // IMPORTANTE: Quando uma nova medida é adicionada, o ThoughtSpot pode não re-executar a query imediatamente.
    // O ChartConfig pode estar desatualizado e não incluir a nova medida na query.
    // Por isso, continuamos tentando por um tempo maior para detectar quando os dados finalmente chegam.
    
    // Primeira tentativa após 1 segundo
    chartElement.__retryTimeout = setTimeout(async () => {
                    // Importação dinâmica para evitar dependência circular
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const { renderChart } = await import('../index');
                    const success = await checkAndRetry(1, async () => {
                        await renderChart(ctx);
                    });
        
        if (!success) {
            // Se ainda não funcionou, iniciar intervalos
            const maxRetries = 30; // 30 tentativas = ~30 segundos
            let retryCount = 1; // Já fizemos a primeira tentativa
            
            chartElement.__retryInterval = setInterval(async () => {
                retryCount++;
                if (retryCount > maxRetries) {
                    logger.warn(`Número máximo de tentativas (${maxRetries}) atingido. Parando retry.`);
                    logger.debug('Medidas que nunca apareceram nos dados:', 
                        missingMeasures.map(m => ({ id: m.id, name: m.name })));
                    logger.debug('POSSÍVEL CAUSA: Quando uma nova medida é adicionada, o ThoughtSpot pode não incluí-la na query imediatamente.');
                    logger.debug('SOLUÇÃO: Tente mudar alguma configuração do gráfico (ex: Mostrar Eixo Y) para forçar o ThoughtSpot a re-executar a query.');
                    if (chartElement.__retryInterval) {
                        clearInterval(chartElement.__retryInterval);
                        chartElement.__retryInterval = null;
                    }
                    return;
                }
                
                // Tentar forçar atualização a cada 5 tentativas
                if (retryCount % 5 === 0) {
                    logger.debug(`Tentativa ${retryCount}: Tentando forçar atualização novamente...`);
                    await tryForceRefresh();
                }
                
                const success = await checkAndRetry(retryCount, async () => {
                    // Importação dinâmica para evitar dependência circular
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const { renderChart } = await import('../index');
                    await renderChart(ctx);
                });
                
                if (success) {
                    if (chartElement.__retryInterval) {
                        clearInterval(chartElement.__retryInterval);
                        chartElement.__retryInterval = null;
                    }
                }
            }, 1000); // Verificar a cada 1 segundo
        }
    }, 1000);
}

