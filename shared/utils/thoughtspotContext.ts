/**
 * Utilitários para extrair informações do contexto do ThoughtSpot
 * 
 * IMPORTANTE: Baseado na documentação do ThoughtSpot Chart SDK, o CustomChartContext
 * não expõe diretamente informações de ORG, MODEL, USER. Estas informações podem estar
 * disponíveis através de:
 * 1. Audit logs do ThoughtSpot (orgId, userName, userGUID)
 * 2. Session API do ThoughtSpot
 * 3. Headers HTTP no servidor (se o ThoughtSpot enviar via proxy)
 * 
 * Esta função inspeciona o contexto disponível e registra o que está presente para debug.
 */

import type { CustomChartContext, ChartModel } from '@thoughtspot/ts-chart-sdk';

/**
 * Informações do contexto do ThoughtSpot extraídas
 * 
 * IMPORTANTE: Coletamos TODAS as informações disponíveis para logs completos.
 * Mesmo que algumas propriedades não estejam garantidas pelo SDK, tentamos
 * extrair o máximo possível para ter visibilidade completa do uso.
 */
export interface ThoughtSpotContextInfo {
    org?: string;
    model?: string;
    user?: string;
    userId?: string;
    // Informações adicionais que podem estar disponíveis
    orgId?: string;
    tenantId?: string;
    modelId?: string;
    worksheetId?: string;
    userName?: string;
    userEmail?: string;
    userGuid?: string;
    // Metadados adicionais do contexto (para debug e análise)
    contextMetadata?: Record<string, unknown>;
}

/**
 * Inspecta o contexto disponível e registra para debug (apenas se DEBUG_LOGGING estiver habilitado)
 * 
 * NOTA: Esta função inspeciona o que está disponível sem assumir propriedades específicas.
 * Use com ANALYTICS_DEBUG=true ou window.DEBUG_LOGGING=true para ver o que está disponível.
 */
function inspectContextForDebug(
    ctx?: CustomChartContext | null,
    chartModel?: ChartModel | null
): void {
    // Apenas inspecionar se debug estiver habilitado
    const debugEnabled = typeof window !== 'undefined' 
        ? window.DEBUG_LOGGING === true
        : process.env.ANALYTICS_DEBUG === 'true';
    
    if (!debugEnabled) {
        return;
    }

    try {
        const ctxAny = ctx as any;
        const modelAny = chartModel as any;

        console.log('[ThoughtSpot Context Debug] Inspecting available properties:');
        console.log('  ctx keys:', ctx ? Object.keys(ctxAny).slice(0, 20) : 'N/A');
        console.log('  chartModel keys:', chartModel ? Object.keys(modelAny).slice(0, 20) : 'N/A');
        
        // Listar métodos conhecidos do ctx (documentados no SDK)
        if (ctx) {
            const knownMethods = ['getChartModel', 'emitEvent'];
            console.log('  ctx known methods:', knownMethods);
        }
    } catch (error) {
        console.warn('[ThoughtSpot Context Debug] Error inspecting context:', error);
    }
}

/**
 * Extrai informações do contexto do ThoughtSpot
 * 
 * ATENÇÃO: Esta função tenta acessar propriedades que podem não existir.
 * Baseado na documentação oficial do ThoughtSpot Chart SDK, o CustomChartContext
 * não garante que essas propriedades estejam disponíveis.
 * 
 * Recomendação: Use headers HTTP no servidor ou audit logs para obter essas informações.
 * 
 * Esta função retorna um objeto vazio por padrão, mas tenta encontrar informações
 * se estiverem disponíveis (sem garantir que existam).
 */
export function extractThoughtSpotContext(
    ctx?: CustomChartContext | null,
    chartModel?: ChartModel | null
): ThoughtSpotContextInfo {
    const info: ThoughtSpotContextInfo = {};

    // Inspectar para debug se habilitado
    inspectContextForDebug(ctx, chartModel);

    try {
        // Tentar acessar do contexto (ctx) - SEM GARANTIA DE QUE EXISTAM
        if (ctx) {
            const ctxAny = ctx as any;

            // Tentar extrair ORG - coletar TODAS as variações possíveis
            info.org = ctxAny.org || 
                     ctxAny.organization || 
                     ctxAny.organizationId || 
                     ctxAny.organizationName ||
                     ctxAny.orgId ||
                     ctxAny.orgName ||
                     ctxAny.tenantId ||
                     ctxAny.tenant?.id ||
                     ctxAny.tenant?.name ||
                     ctxAny.tenantName ||
                     undefined;
            
            // Também salvar como orgId se diferente
            info.orgId = ctxAny.orgId || 
                        ctxAny.organizationId || 
                        ctxAny.tenantId ||
                        ctxAny.tenant?.id ||
                        info.org ||
                        undefined;

            // Tentar extrair MODEL - coletar TODAS as variações possíveis
            info.model = ctxAny.model || 
                        ctxAny.modelId || 
                        ctxAny.modelName ||
                        ctxAny.chartModelId ||
                        ctxAny.chartModelName ||
                        ctxAny.worksheetId ||
                        ctxAny.worksheetName ||
                        ctxAny.worksheet?.id ||
                        ctxAny.worksheet?.name ||
                        ctxAny.worksheet?.title ||
                        ctxAny.viewId ||
                        ctxAny.viewName ||
                        undefined;
            
            // Também salvar como modelId se diferente
            info.modelId = ctxAny.modelId || 
                         ctxAny.chartModelId ||
                         ctxAny.worksheetId ||
                         ctxAny.viewId ||
                         info.model ||
                         undefined;
            
            info.worksheetId = ctxAny.worksheetId || 
                              ctxAny.worksheet?.id ||
                              info.modelId ||
                              undefined;

            // Tentar extrair USER/USUARIO - coletar TODAS as variações possíveis
            info.user = ctxAny.user?.username ||
                       ctxAny.user?.name ||
                       ctxAny.user?.displayName ||
                       ctxAny.user?.email ||
                       ctxAny.username ||
                       ctxAny.userName ||
                       ctxAny.userDisplayName ||
                       ctxAny.userInfo?.username ||
                       ctxAny.userInfo?.name ||
                       ctxAny.userInfo?.displayName ||
                       ctxAny.userInfo?.email ||
                       ctxAny.currentUser?.username ||
                       ctxAny.currentUser?.name ||
                       ctxAny.currentUser?.email ||
                       undefined;
            
            // Também salvar variações
            info.userName = ctxAny.userName ||
                           ctxAny.user?.username ||
                           ctxAny.userInfo?.username ||
                           ctxAny.currentUser?.username ||
                           info.user ||
                           undefined;
            
            info.userEmail = ctxAny.user?.email ||
                            ctxAny.userInfo?.email ||
                            ctxAny.currentUser?.email ||
                            undefined;

            // Tentar extrair USERID - coletar TODAS as variações possíveis
            info.userId = ctxAny.userId ||
                         ctxAny.user?.id ||
                         ctxAny.user?.userId ||
                         ctxAny.user?.guid ||
                         ctxAny.userInfo?.userId ||
                         ctxAny.userInfo?.id ||
                         ctxAny.userInfo?.guid ||
                         ctxAny.currentUser?.id ||
                         ctxAny.currentUser?.userId ||
                         ctxAny.currentUser?.guid ||
                         undefined;
            
            // Também salvar userGuid se disponível
            info.userGuid = ctxAny.user?.guid ||
                           ctxAny.userInfo?.guid ||
                           ctxAny.currentUser?.guid ||
                           ctxAny.userGUID ||
                           undefined;
            
            // Coletar metadados adicionais do contexto (para análise futura)
            const metadata: Record<string, unknown> = {};
            const metadataKeys = [
                'sessionId', 'requestId', 'embedId', 'viewId',
                'environment', 'version', 'apiVersion', 'sdkVersion',
                'locale', 'timezone', 'theme', 'mode'
            ];
            
            for (const key of metadataKeys) {
                if (ctxAny[key] !== undefined) {
                    metadata[key] = ctxAny[key];
                }
            }
            
            if (Object.keys(metadata).length > 0) {
                info.contextMetadata = metadata;
            }
        }

        // Se não encontrou no contexto, tentar no chartModel - SEM GARANTIA
        // Coletar TODAS as informações possíveis do chartModel também
        if (chartModel) {
            const modelAny = chartModel as any;

            // Preencher apenas se não encontrou no contexto (mas coletar todas as variações)
            if (!info.org) {
                info.org = modelAny.org || 
                          modelAny.organization || 
                          modelAny.organizationId || 
                          modelAny.organizationName ||
                          modelAny.orgId ||
                          modelAny.orgName ||
                          modelAny.tenantId ||
                          modelAny.tenant?.id ||
                          modelAny.tenant?.name ||
                          modelAny.tenantName ||
                          undefined;
                
                if (!info.orgId && info.org) {
                    info.orgId = info.org;
                }
            }

            if (!info.model) {
                info.model = modelAny.model || 
                            modelAny.modelId || 
                            modelAny.modelName ||
                            modelAny.chartModelId ||
                            modelAny.chartModelName ||
                            modelAny.worksheetId ||
                            modelAny.worksheetName ||
                            modelAny.worksheet?.id ||
                            modelAny.worksheet?.name ||
                            modelAny.worksheet?.title ||
                            modelAny.viewId ||
                            modelAny.viewName ||
                            undefined;
                
                if (!info.modelId && info.model) {
                    info.modelId = info.model;
                }
                
                if (!info.worksheetId && modelAny.worksheetId) {
                    info.worksheetId = modelAny.worksheetId;
                }
            }

            if (!info.user) {
                info.user = modelAny.user?.username ||
                           modelAny.user?.name ||
                           modelAny.user?.displayName ||
                           modelAny.user?.email ||
                           modelAny.username ||
                           modelAny.userName ||
                           modelAny.userDisplayName ||
                           modelAny.userInfo?.username ||
                           modelAny.userInfo?.name ||
                           modelAny.userInfo?.displayName ||
                           modelAny.userInfo?.email ||
                           undefined;
                
                if (!info.userName && info.user) {
                    info.userName = info.user;
                }
                
                if (!info.userEmail && modelAny.user?.email) {
                    info.userEmail = modelAny.user.email;
                }
            }

            if (!info.userId) {
                info.userId = modelAny.userId ||
                             modelAny.user?.id ||
                             modelAny.user?.userId ||
                             modelAny.user?.guid ||
                             modelAny.userInfo?.userId ||
                             modelAny.userInfo?.id ||
                             modelAny.userInfo?.guid ||
                             undefined;
                
                if (!info.userGuid && modelAny.user?.guid) {
                    info.userGuid = modelAny.user.guid;
                }
            }
            
            // Coletar metadados adicionais do chartModel também
            if (!info.contextMetadata) {
                info.contextMetadata = {};
            }
            
            const modelMetadataKeys = [
                'queryId', 'queryName', 'dataSource', 'dataSourceType',
                'columnCount', 'rowCount', 'totalRowCount',
                'visualProps', 'chartType', 'chartSubType'
            ];
            
            for (const key of modelMetadataKeys) {
                if (modelAny[key] !== undefined && !info.contextMetadata[key]) {
                    info.contextMetadata[key] = modelAny[key];
                }
            }
        }

        // Limpar valores undefined/null para não poluir os logs
        Object.keys(info).forEach(key => {
            if (info[key as keyof ThoughtSpotContextInfo] === undefined || 
                info[key as keyof ThoughtSpotContextInfo] === null) {
                delete info[key as keyof ThoughtSpotContextInfo];
            }
        });

    } catch (error) {
        // Silenciosamente falha - não queremos que a extração de contexto quebre o gráfico
        // Apenas log em modo debug
        const debugEnabled = typeof window !== 'undefined' 
            ? window.DEBUG_LOGGING === true
            : process.env.ANALYTICS_DEBUG === 'true';
        
        if (debugEnabled) {
            console.warn('[ThoughtSpot Context] Erro ao extrair contexto:', error);
        }
    }

    return info;
}
