# Aprendizados Completos - ThoughtSpot Chart SDK

## 📚 Documentação Consolidada

Este documento consolida **todos os aprendizados** obtidos durante o desenvolvimento do Trellis Chart usando ThoughtSpot Chart SDK. Combina a documentação oficial, lições fundamentais, problemas encontrados e soluções aplicadas.

---

## 🎯 Visão Geral

### O que é o ThoughtSpot Chart SDK?

O **ThoughtSpot Chart SDK** permite criar charts customizados em JavaScript/TypeScript usando bibliotecas de visualização (como Highcharts, D3.js, ou SVG nativo) e hospedá-los externamente para uso no ThoughtSpot.

### Diferenças: Chart SDK vs Custom Charts Tradicionais

| Aspecto | Custom Charts (01-06) | Chart SDK (Trellis Chart) |
|---------|----------------------|---------------------------|
| **Empacotamento** | Arquivo .zip | Deploy web |
| **Hospedagem** | ThoughtSpot | Externo (Railway, Vercel, etc.) |
| **Manifest** | Obrigatório | Não necessário |
| **Atualização** | Re-upload do .zip | Deploy automático |
| **Build** | Local (build.sh) | Automático (Railway/Vercel) |
| **API** | `viz.getDataFromSearchQuery()` | `getChartContext()` |
| **Complexidade** | Mais simples | Mais complexo |
| **Configurações** | Limitadas | Dinâmicas via `visualPropEditorDefinition` |

### Por Que Usar Chart SDK?

- ✅ Atualizações sem re-upload
- ✅ Versionamento automático
- ✅ Melhor para desenvolvimento iterativo
- ✅ Suporte a configurações visuais dinâmicas
- ✅ Mais flexibilidade na renderização

---

## 🔑 Lições Fundamentais

### 1. **Inicialização do Chart Context**

O `ChartContext` é o objeto principal que orquestra as APIs do ThoughtSpot para renderizar charts. É o ponto central de todas as interações.

#### ✅ Padrão Correto

```typescript
import { getChartContext, ChartModel, ChartConfig, Query } from '@thoughtspot/ts-chart-sdk';

const init = async () => {
    const ctx = await getChartContext({
        getDefaultChartConfig: (chartModel: ChartModel): ChartConfig[] => {
            // Define estrutura lógica do gráfico
            const columns = chartModel.columns;
            
            // Validação básica
            if (columns.length < 2) {
                return [];
            }
            
            // Separar dimensões e medidas
            const dimensionColumns = columns.filter(col => col.type === 'ATTRIBUTE');
            const measureColumns = columns.filter(col => col.type === 'MEASURE');
            
            const chartConfig: ChartConfig = {
                key: 'default',
                dimensions: [
                    {
                        key: 'x',
                        columns: dimensionColumns
                    },
                    {
                        key: 'y',
                        columns: measureColumns
                    }
                ]
            };
            
            return [chartConfig];
        },
        
        getQueriesFromChartConfig: (chartConfig: ChartConfig[]): Query[] => {
            // Converte ChartConfig em Query para buscar dados
            return chartConfig.map((config: ChartConfig): Query =>
                _.reduce(
                    config.dimensions,
                    (acc: Query, dimension) => ({
                        queryColumns: [
                            ...acc.queryColumns,
                            ...dimension.columns,
                        ],
                    }),
                    { queryColumns: [] } as Query,
                ),
            );
        },
        
        renderChart: (context) => {
            // Renderiza o gráfico
            // DEVE emitir RenderComplete ao final
            ctx.emitEvent(ChartToTSEvent.RenderComplete, []);
        },
    });
    
    // Para carga inicial, chamar renderChart explicitamente
    renderChart(ctx);
};

init();
```

#### ⚠️ Funções Obrigatórias

1. **`getDefaultChartConfig`**: Define estrutura lógica do gráfico
2. **`getQueriesFromChartConfig`**: Converte config em query para buscar dados
3. **`renderChart`**: Renderiza o gráfico e emite eventos

#### ❌ Erros Comuns

```typescript
// NÃO fazer: Lógica extra antes do getChartContext
document.addEventListener('DOMContentLoaded', () => {
    // Isso pode causar "No target provided to sendMessage"
});

// NÃO fazer: Esquecer de emitir RenderComplete
renderChart: (context) => {
    // Renderiza gráfico mas não emite evento
    // Chart fica em loading infinito
}
```

---

### 2. **Estrutura de Dados do ThoughtSpot**

#### DataPointsArray

O ThoughtSpot retorna dados no formato `DataPointsArray`:

```typescript
{
    columns: ['col-id-1', 'col-id-2'],  // IDs das colunas
    dataValue: [
        [value1, value2],  // Linha 1
        [value1, value2],  // Linha 2
        ...
    ]
}
```

#### ✅ Acesso Correto aos Dados

```typescript
const chartModel = ctx.getChartModel();
const data = chartModel.data; // Array de DataPointsArray

// Para cada query, temos um DataPointsArray
const dataArr = data[0].data;

// Criar mapa de índices
const columnIndexMap = new Map<string, number>();
dataArr.columns.forEach((colId, idx) => {
    columnIndexMap.set(colId, idx);
});

// Acessar valor de uma coluna em uma linha
const row = dataArr.dataValue[0];
const colIndex = columnIndexMap.get(column.id);
const value = row[colIndex]?.v?.n ?? row[colIndex]?.v;
```

#### ⚠️ Tipos de Valores

- **Números**: `row[colIndex]?.v?.n`
- **Strings**: `row[colIndex]?.v`
- **Datas**: `row[colIndex]?.v` (string ISO ou timestamp)

---

### 3. **ChartConfig vs Query**

#### ChartConfig (Estrutura Lógica)

**Propósito:** Define estrutura lógica do gráfico (como organizar as colunas)

```typescript
{
    key: 'default',
    dimensions: [
        {
            key: 'x',           // Eixo X
            columns: [dimensionCols]
        },
        {
            key: 'y',           // Eixo Y
            columns: [measureCols]
        }
    ]
}
```

**Observações:**
- Todas as colunas (dimensões E medidas) vão dentro de `dimensions`
- Medidas também vão em `dimensions` (não em estrutura separada)
- Suporta múltiplas medidas no mesmo `dimensions[x].columns`

#### Query (Instrução de Busca)

**Propósito:** Instrução simples para buscar dados do banco

```typescript
{
    queryColumns: [dimensionCol1, measureCol1, measureCol2]
}
```

**Por que os dois?**
- ChartConfig organiza logicamente (para o gráfico entender)
- Query simplifica para busca no banco (para o SQL executar)

#### ✅ Geração de Query (Padrão Oficial)

```typescript
getQueriesFromChartConfig: (chartConfig: ChartConfig[]): Query[] => {
    return chartConfig.map((config: ChartConfig): Query =>
        _.reduce(
            config.dimensions,
            (acc: Query, dimension) => ({
                queryColumns: [
                    ...acc.queryColumns,
                    ...dimension.columns,
                ],
            }),
            { queryColumns: [] } as Query,
        ),
    );
}
```

---

### 4. **Visual Properties (Configurações)**

#### Estrutura Básica

```typescript
visualPropEditorDefinition: (
    currentVisualProps: ChartModel,
    ctx: CustomChartContext,
): VisualPropEditorDefinition => {
    return {
        // Configurações globais (aba Settings)
        elements: [
            {
                type: 'section',
                key: 'chart_options',
                label: 'Opções do Gráfico',
                children: [
                    {
                        type: 'toggle',
                        key: 'showYAxis',
                        label: 'Mostrar Eixo Y',
                        defaultValue: true,
                    }
                ]
            }
        ],
        
        // Configurações por coluna (aba Configure)
        columnsVizPropDefinition: [
            {
                type: ColumnType.MEASURE,
                columnSettingsDefinition: {
                    [measureId]: {
                        elements: [
                            {
                                type: 'colorpicker',
                                key: 'color',
                                label: 'Cor',
                                defaultValue: '#3b82f6',
                            }
                        ]
                    }
                }
            }
        ]
    };
}
```

#### ⚠️ Importante: visualPropEditorDefinition é Necessário

**Problema:** A documentação diz que é opcional, mas na prática é **necessário**.

**Erro sem ele:**
```
Cannot destructure property 'elements' of 'e' as it is undefined
```

**Solução:** Sempre incluir `visualPropEditorDefinition`, mesmo que vazio:

```typescript
visualPropEditorDefinition: () => ({
    elements: []
})
```

#### Acesso aos Valores

```typescript
const chartModel = ctx.getChartModel();
const visualProps = chartModel.visualProps || {};

// Configurações globais
const showYAxis = visualProps.chart_options?.showYAxis ?? true;

// Configurações por coluna (formato novo)
const measureColor = visualProps[measureId]?.color ?? '#3b82f6';

// Configurações por coluna (formato antigo - compatibilidade)
const measureColorOld = visualProps[`measure_${measureId}`]?.color;
const measureColor = measureColorOld ?? visualProps[measureId]?.color ?? '#3b82f6';
```

---

### 5. **Eventos do Chart SDK**

#### Eventos Importantes

```typescript
import { ChartToTSEvent } from '@thoughtspot/ts-chart-sdk';

// Renderização completa (OBRIGATÓRIO)
ctx.emitEvent(ChartToTSEvent.RenderComplete, []);

// Erro na renderização
ctx.emitEvent(ChartToTSEvent.RenderError, {
    error: 'Mensagem de erro'
});

// Atualizar propriedades visuais
ctx.emitEvent(ChartToTSEvent.UpdateVisualProps, {
    visualProps: {
        // Novas propriedades
    }
});
```

#### ⚠️ Sempre Emitir RenderComplete

```typescript
renderChart: (context) => {
    try {
        // Renderizar gráfico
        renderChartInternal(context);
        
        // OBRIGATÓRIO: Emitir ao final
        ctx.emitEvent(ChartToTSEvent.RenderComplete, []);
    } catch (error) {
        ctx.emitEvent(ChartToTSEvent.RenderError, {
            error: error.message
        });
    }
}
```

---

### 6. **Renderização SVG Nativa**

#### Estrutura Básica

```typescript
const chartElement = document.getElementById('chart-container');
const chartWidth = chartData.length * 60 + 150;
const chartHeight = 500;
const leftMargin = 120;
const bottomMargin = 60;

chartElement.innerHTML = `
    <svg width="100%" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}">
        <!-- Eixos Y -->
        ${renderYAxes()}
        
        <!-- Eixo X -->
        ${renderXAxis()}
        
        <!-- Barras/Linhas -->
        ${renderBars()}
        
        <!-- Labels -->
        ${renderLabels()}
    </svg>
`;
```

#### ⚠️ Coordenadas SVG

- **Y aumenta para baixo** (valor máximo = menor coordenada Y)
- Sempre calcular `barY = Math.min(valueY, baseY)` para garantir altura positiva
- Usar `viewBox` para responsividade

---

## 🔄 Fluxo Completo de Execução

```
1. ThoughtSpot envia ChartModel
   └─> Contém todas as colunas disponíveis na query
   ↓
2. getDefaultChartConfig(chartModel)
   └─> Define quais colunas usar e como organizá-las
   └─> Retorna ChartConfig[] (estrutura organizada)
   ↓
3. getQueriesFromChartConfig(chartConfig)
   └─> Converte ChartConfig em Query
   └─> Retorna Query[] (lista de colunas para buscar)
   ↓
4. ThoughtSpot executa a Query
   └─> Busca dados do banco usando as colunas especificadas
   └─> Retorna dados no formato DataPointsArray
   ↓
5. renderChart(context)
   └─> Recebe os dados do ThoughtSpot
   └─> Renderiza o gráfico usando SVG/Highcharts/etc
   └─> Emite evento RenderComplete
```

---

## 🐛 Problemas Encontrados e Soluções

### 1. Erro: "No target provided to sendMessage"

**Problema:** Chart SDK tentava se comunicar antes do ThoughtSpot estar pronto.

**Causa:** Código com lógica extra (DOMContentLoaded, timeouts) que não estava na documentação.

**Solução:**
- Remover toda lógica extra
- Seguir EXATAMENTE o padrão da documentação
- Inicialização direta sem listeners extras

**Status:** ✅ Resolvido

---

### 2. Erro: "Cannot destructure property 'elements' of 'e' as it is undefined"

**Problema:**
```
TypeError: Cannot destructure property 'elements' of 'e' as it is undefined.
at form-builder.util.js:195:13 (código interno do ThoughtSpot)
```

**Causa:** Falta de `visualPropEditorDefinition` (opcional na documentação, mas necessário na prática).

**Solução:**
```typescript
visualPropEditorDefinition: () => ({
    elements: []  // Pelo menos vazio
})
```

**Status:** ✅ Resolvido

---

### 3. Chart ficando em "loading infinito"

**Problema:** Chart ficava carregando indefinidamente após renderizar.

**Causa:** Falta de emissão do evento `RenderComplete`.

**Solução:**
```typescript
ctx.emitEvent(ChartToTSEvent.RenderComplete, []);
```

**Status:** ✅ Resolvido

---

### 4. Erro 403 Forbidden no Railway

**Problema:** Railway retornava 403 ao acessar a URL.

**Causa:** Vite preview bloqueando host por segurança.

**Solução:**
```typescript
// vite.config.ts
preview: {
  allowedHosts: [
    'ts-custom-charts-production.up.railway.app',
    '.railway.app',
    'localhost'
  ]
}
```

```json
// package.json
"start": "vite preview --host 0.0.0.0"
```

**Status:** ✅ Resolvido

---

### 5. Erro CSP (Content Security Policy)

**Problema:**
```
Framing 'https://...' violates CSP directive: "frame-src ..."
```

**Solução:** Adicionar `*.railway.app` ao `frame-src` no CSP do ThoughtSpot:
- Admin > Security > Content Security Policy
- Adicionar `*.railway.app` à diretiva `frame-src`

**Status:** ✅ Resolvido

---

### 6. Nova Medida Não Aparece Imediatamente

**Problema:** Quando uma nova medida é adicionada, ela pode não aparecer imediatamente.

**Causa Raiz:**
- O ThoughtSpot não chama `getDefaultChartConfig` novamente quando uma nova medida é adicionada
- Ele usa um `ChartConfig` em cache que não inclui a nova medida
- A nova medida nunca é incluída na query

**Evidências:**
- `visualPropEditorDefinition` mostra 7 medidas (incluindo a nova)
- `getQueriesFromChartConfig` recebe um `chartConfig` com apenas 6 medidas (desatualizado)
- `getDefaultChartConfig` não é chamado quando a nova medida é adicionada

**Solução Manual:**
Mudar qualquer configuração do gráfico (ex: toggle "Mostrar Eixo Y") para forçar o ThoughtSpot a re-executar tudo.

**Tentativa Automática:**
```typescript
// Quando detectamos medidas faltando:
await ctx.emitEvent(ChartToTSEvent.UpdateVisualProps, {
    visualProps: {
        ...currentVisualProps,
        _column_dependency: {
            ...columnDependency,
            _refresh_trigger: newRefreshTrigger,
        },
    } as any,
});
```

**Status:** ⚠️ Limitação do ThoughtSpot - Não há solução automática viável

---

## 📝 Template Completo de Código

### Estrutura Base

```typescript
import { 
    getChartContext, 
    ChartModel, 
    ChartConfig, 
    Query,
    ChartToTSEvent,
    VisualPropEditorDefinition,
    ColumnType
} from '@thoughtspot/ts-chart-sdk';
import _ from 'lodash';

// 1. Inicializar Chart Context
const init = async () => {
    const ctx = await getChartContext({
        // Define estrutura lógica do gráfico
        getDefaultChartConfig: (chartModel: ChartModel): ChartConfig[] => {
            const columns = chartModel.columns;
            
            // Validação
            if (columns.length < 2) {
                return [];
            }
            
            // Separar dimensões e medidas
            const dimensionColumns = columns.filter(col => col.type === 'ATTRIBUTE');
            const measureColumns = columns.filter(col => col.type === 'MEASURE');
            
            if (dimensionColumns.length === 0 || measureColumns.length === 0) {
                return [];
            }
            
            const chartConfig: ChartConfig = {
                key: 'default',
                dimensions: [
                    {
                        key: 'x',
                        columns: dimensionColumns
                    },
                    {
                        key: 'y',
                        columns: measureColumns
                    }
                ]
            };
            
            return [chartConfig];
        },
        
        // Converte ChartConfig em Query
        getQueriesFromChartConfig: (chartConfig: ChartConfig[]): Query[] => {
            return chartConfig.map((config: ChartConfig): Query =>
                _.reduce(
                    config.dimensions,
                    (acc: Query, dimension) => ({
                        queryColumns: [
                            ...acc.queryColumns,
                            ...dimension.columns,
                        ],
                    }),
                    { queryColumns: [] } as Query,
                ),
            );
        },
        
        // Define configurações visuais
        visualPropEditorDefinition: (
            currentVisualProps: ChartModel,
            ctx: CustomChartContext,
        ): VisualPropEditorDefinition => {
            const chartModel = ctx.getChartModel();
            const measureColumns = chartModel.columns.filter(col => col.type === 'MEASURE');
            
            return {
                // Configurações globais (aba Settings)
                elements: [
                    {
                        type: 'section',
                        key: 'chart_options',
                        label: 'Opções do Gráfico',
                        children: [
                            {
                                type: 'toggle',
                                key: 'showYAxis',
                                label: 'Mostrar Eixo Y',
                                defaultValue: true,
                            }
                        ]
                    }
                ],
                
                // Configurações por coluna (aba Configure)
                columnsVizPropDefinition: [
                    {
                        type: ColumnType.MEASURE,
                        columnSettingsDefinition: Object.fromEntries(
                            measureColumns.map(measure => [
                                measure.id,
                                {
                                    elements: [
                                        {
                                            type: 'colorpicker',
                                            key: 'color',
                                            label: 'Cor',
                                            defaultValue: '#3b82f6',
                                        }
                                    ]
                                }
                            ])
                        )
                    }
                ]
            };
        },
        
        // Renderiza o gráfico
        renderChart: (context) => {
            try {
                const chartModel = context.getChartModel();
                const data = chartModel.data;
                const visualProps = chartModel.visualProps || {};
                
                // Processar dados
                const processedData = processData(data);
                
                // Renderizar gráfico
                renderChartInternal(processedData, visualProps);
                
                // OBRIGATÓRIO: Emitir RenderComplete
                context.emitEvent(ChartToTSEvent.RenderComplete, []);
            } catch (error) {
                context.emitEvent(ChartToTSEvent.RenderError, {
                    error: error.message
                });
            }
        },
    });
    
    // Para carga inicial, chamar renderChart explicitamente
    renderChart(ctx);
};

// 2. Processar dados
const processData = (data: any[]) => {
    const dataArr = data[0].data;
    
    // Criar mapa de índices
    const columnIndexMap = new Map<string, number>();
    dataArr.columns.forEach((colId, idx) => {
        columnIndexMap.set(colId, idx);
    });
    
    // Processar linhas
    const processedRows = dataArr.dataValue.map(row => {
        // Acessar valores usando o mapa
        // ...
    });
    
    return processedRows;
};

// 3. Renderizar gráfico
const renderChartInternal = (data: any[], visualProps: any) => {
    const chartElement = document.getElementById('chart-container');
    
    // Renderizar SVG ou usar biblioteca (Highcharts, D3, etc.)
    // ...
};

// 4. Inicializar
init();
```

---

## 🎨 Visual Properties: elements vs columnsVizPropDefinition

### ✅ Usando apenas `elements` (Solução Simples)

**Localização:** Aba **"Settings"** (Configurações)

**Comportamento:**
- Todas as configurações estão sempre visíveis
- Configurações globais do gráfico
- Acessíveis a qualquer momento

**Vantagens:**
- ✅ Simples de implementar
- ✅ Todas as opções sempre visíveis
- ✅ Não depende de seleção de coluna

**Desvantagens:**
- ❌ Aba "Configure" fica vazia
- ❌ Não há contexto de qual coluna está sendo configurada

---

### 🎯 Usando `columnsVizPropDefinition` + `elements` (Solução Avançada)

**Localização:**
- **`elements`**: Aba **"Settings"** (sempre visível)
- **`columnsVizPropDefinition`**: Aba **"Configure"** (somente ao clicar em uma coluna)

**Comportamento:**
- Configurações globais sempre visíveis em "Settings"
- Configurações por coluna aparecem dinamicamente em "Configure" quando o usuário clica em uma coluna
- O ThoughtSpot passa `activeColumnId` para identificar qual coluna está sendo configurada

**Vantagens:**
- ✅ Aba "Configure" funciona corretamente
- ✅ Contexto claro de qual coluna está sendo configurada
- ✅ Interface mais organizada
- ✅ Segue padrão do ThoughtSpot

**Desvantagens:**
- ⚠️ Implementação mais complexa
- ⚠️ Configurações por coluna só aparecem ao clicar na coluna

---

## 🚀 Deploy

### Railway

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Configuração CSP no ThoughtSpot

1. Admin > Security > Content Security Policy
2. Adicionar domínio ao `frame-src`:
   - `*.railway.app` (para Railway)
   - `*.vercel.app` (para Vercel)

---

## ✅ Checklist para Novos Charts

### Implementação
- [ ] `getChartContext` inicializado corretamente
- [ ] `getDefaultChartConfig` retorna ChartConfig válido
- [ ] `getQueriesFromChartConfig` converte corretamente
- [ ] `visualPropEditorDefinition` implementado (mesmo que vazio)
- [ ] `renderChart` renderiza corretamente
- [ ] `RenderComplete` emitido ao final
- [ ] Tratamento de erros implementado

### Deploy
- [ ] Build funcionando
- [ ] Deploy configurado (Railway/Vercel)
- [ ] CSP configurado no ThoughtSpot
- [ ] Chart SDK registrado no ThoughtSpot

### Testes
- [ ] Chart renderiza com dados reais
- [ ] Configurações visuais funcionam
- [ ] Múltiplas dimensões funcionam
- [ ] Múltiplas medidas funcionam
- [ ] Erros são tratados graciosamente

---

## 📚 Referências

### Documentação Oficial
- [ThoughtSpot Chart SDK Documentation](https://developers.thoughtspot.com/docs/chart-sdk-overview)
- [Chart SDK GitHub Repository](https://github.com/thoughtspot/ts-chart-sdk)
- [Chart SDK API Reference](https://ts-chart-sdk-docs.vercel.app/)
- [Chart SDK README Oficial](https://github.com/thoughtspot/ts-chart-sdk/blob/main/README.md)

### Exemplos Oficiais
- [Gantt Chart Example](https://github.com/thoughtspot/ts-chart-sdk/blob/main/README.md)
- [Bar Chart Example](https://github.com/thoughtspot/ts-chart-sdk/tree/main/example/custom-bar-chart)

### Documentação Relacionada
- [Aba Configure](./ABA_CONFIGURE.md) - Como acessar e usar a aba Configure
- [columnsVizPropDefinition](./COLUMNS_VIZ_PROP_DEFINITION.md) - Guia completo sobre configurações por coluna
- [Solução Forçar Atualização](./SOLUCAO_FORCAR_ATUALIZACAO.md) - Workaround para nova medida

---

## 🔄 Histórico de Aprendizados

### 2025-01-XX - Trellis Chart
- ✅ Descoberta sobre inicialização do Chart Context
- ✅ Solução para erro "Cannot destructure property 'elements'"
- ✅ Implementação de visualPropEditorDefinition
- ✅ Renderização SVG nativa
- ✅ Suporte a múltiplas dimensões e medidas
- ✅ Eixos Y individualizados
- ✅ Configurações visuais por medida
- ⚠️ Limitação conhecida: nova medida não aparece imediatamente

---

## 👥 Contribuições

- Documentado pela equipe iFood Data Team
- Baseado em desenvolvimento real do Trellis Chart
- Consolidado de múltiplas fontes para máxima completude

