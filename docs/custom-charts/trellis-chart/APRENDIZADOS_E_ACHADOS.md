# Aprendizados e Achados - Trellis Chart (Chart SDK)

Este documento consolida todos os aprendizados, descobertas, problemas encontrados e soluções durante a construção do Trellis Chart (anteriormente Chart 07) usando ThoughtSpot Chart SDK.

## 📋 Índice

1. [Visão Geral do Projeto](#visão-geral)
2. [Arquitetura e Diferenças](#arquitetura)
3. [Fluxo do Chart SDK](#fluxo)
4. [Problemas Encontrados e Soluções](#problemas)
5. [Aprendizados Técnicos](#aprendizados)
6. [Limitações e Bugs Conhecidos](#limitações)
7. [Evolução do Código](#evolução)

---

## 🎯 Visão Geral do Projeto

### Objetivo
Criar um gráfico que exiba múltiplas medidas em formato "crosschart" (uma medida abaixo da outra), onde cada medida tem seu próprio eixo Y individualizado, suportando múltiplas dimensões no eixo X.

### Tecnologias
- **ThoughtSpot Chart SDK** (`@thoughtspot/ts-chart-sdk`)
- **TypeScript**
- **Vite** (build tool)
- **Railway** (hospedagem)
- **SVG nativo** (renderização, sem Muze conforme solicitado)

### Status Atual
✅ **Implementação Completa**
- Código funcional e renderizando corretamente
- Suporte a múltiplas dimensões e medidas
- Configurações visuais por medida (cor e formato de número)
- Eixos Y individualizados
- Deploy funcionando no Railway

---

## 🏗️ Arquitetura e Diferenças

### Chart SDK vs Custom Chart Tradicional

| Aspecto | Custom Charts (01-06) | Chart SDK (07) |
|---------|----------------------|----------------|
| **Empacotamento** | Arquivo .zip | Deploy web |
| **Hospedagem** | ThoughtSpot | Railway |
| **Manifest** | Obrigatório | Não necessário |
| **Atualização** | Re-upload do .zip | Deploy automático |
| **Build** | Local (build.sh) | Railway (automático) |
| **API** | `viz.getDataFromSearchQuery()` | `getChartContext()` |
| **Complexidade** | Mais simples | Mais complexo |

### Por Que Chart SDK?
- Atualizações sem re-upload
- Versionamento automático
- Melhor para desenvolvimento iterativo
- Suporte a configurações visuais dinâmicas

---

## 🔄 Fluxo do Chart SDK

### Fluxo Completo de Execução

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
   └─> Renderiza o gráfico usando SVG
   └─> Emite evento RenderComplete
```

### Diferença Entre ChartConfig e Query

**ChartConfig** (`getDefaultChartConfig`)
- **Propósito:** Define estrutura lógica do gráfico
- **Formato:** Hierárquico, organizado em `dimensions`
- **Exemplo:**
```typescript
{
  key: 'column',
  dimensions: [
    { key: 'x', columns: [dimensionCols] },
    { key: 'y', columns: [measureCols] }
  ]
}
```

**Query** (`getQueriesFromChartConfig`)
- **Propósito:** Instrução simples para buscar dados
- **Formato:** Lista plana de colunas
- **Exemplo:**
```typescript
{
  queryColumns: [dimensionCol1, measureCol1, measureCol2]
}
```

**Por que os dois?**
- ChartConfig organiza logicamente (para o gráfico entender)
- Query simplifica para busca no banco (para o SQL executar)

---

## 🔧 Problemas Encontrados e Soluções

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

**Análise:**
- ✅ Ocorre DEPOIS que nossa Query é gerada corretamente
- ✅ Ocorre em código INTERNO do ThoughtSpot
- ✅ Nossa implementação está 100% correta conforme documentação

**Tentativas Realizadas:**
1. Simplificar ChartConfig (1 dimensão + 1 medida)
2. Filtrar colunas especiais (MEASURE_NAMES, MEASURE_VALUES)
3. Adicionar `visualPropEditorDefinition` (retornando `{ elements: [] }`)
4. Seguir padrão do exemplo do Bar Chart do repositório
5. Usar `key: 'x'` e `key: 'y'` como no exemplo oficial
6. Múltiplas tentativas de diferentes estruturas

**Descoberta Importante:**
- Adicionar `visualPropEditorDefinition` retornando `{ elements: [] }` resolveu temporariamente
- O erro estava relacionado à falta desta função (opcional na documentação, mas necessária na prática)

**Status:** ✅ Resolvido (adicionando `visualPropEditorDefinition`)

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
1. Adicionar `allowedHosts` no `vite.config.ts`:
```typescript
preview: {
  allowedHosts: [
    'ts-custom-charts-production.up.railway.app',
    '.railway.app',
    'localhost'
  ]
}
```
2. Adicionar `--host 0.0.0.0` no comando start do `package.json`

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

### 6. Eixos Y não individualizados

**Problema:** Todas as medidas compartilhavam o mesmo eixo Y.

**Solução:**
- Calcular min/max individual para cada medida
- Criar eixo Y separado para cada linha de medida
- Usar escala específica ao renderizar barras de cada medida

**Status:** ✅ Resolvido

---

### 7. Múltiplas dimensões não dividiam o eixo X

**Problema:** Ao adicionar segunda dimensão, as barras ficavam sobrepostas.

**Solução:**
- Combinar labels de todas as dimensões em uma única string
- Usar formato: "Dimensão 1 - Dimensão 2"
- Tratar cada combinação única como um ponto separado no eixo X

**Status:** ✅ Resolvido

---

### 8. Opções de configuração não apareciam

**Problema:** Configurações de cor e formato por medida não apareciam no painel.

**Causa Inicial:** Tentativa de usar `columnsVizPropDefinition` (configurações por coluna só aparecem ao clicar na coluna).

**Solução:**
- Usar `elements` diretamente com seções por medida
- Cada seção contém colorpicker e dropdown
- Valores acessados via `visualProps[`measure_${measure.id}`]`

**Status:** ✅ Resolvido

---

## 📚 Aprendizados Técnicos

### 1. Estrutura de Dados do ThoughtSpot

**DataPointsArray:**
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

**Acesso aos valores:**
```typescript
const dataArr = data[0].data;
const columnIndexMap = new Map<string, number>();
dataArr.columns.forEach((colId, idx) => {
  columnIndexMap.set(colId, idx);
});

// Para acessar valor de uma coluna em uma linha:
const colIndex = columnIndexMap.get(column.id);
const value = row[colIndex]?.v?.n ?? row[colIndex]?.v;
```

### 2. ChartConfig - Estrutura Correta

**Padrão oficial (Bar Chart example):**
```typescript
{
  key: 'column',
  dimensions: [
    {
      key: 'x',
      columns: attributeColumns  // Todas as dimensões
    },
    {
      key: 'y',
      columns: measureColumns.slice(0, 2)  // Múltiplas medidas suportadas
    }
  ]
}
```

**Observações importantes:**
- Todas as colunas (dimensões E medidas) vão dentro de `dimensions`
- Medidas também vão em `dimensions` (não em estrutura separada)
- Suporta múltiplas medidas no mesmo `dimensions[x].columns`

### 3. Query Generation

**Padrão oficial usando lodash:**
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

**O que faz:**
- Percorre todas as `dimensions` do config
- Extrai todas as `columns` de cada dimension
- Cria lista plana de colunas para a Query

### 4. Visual Properties

**Estrutura básica:**
```typescript
visualPropEditorDefinition: (
  currentVisualProps: ChartModel,
  ctx: CustomChartContext,
): VisualPropEditorDefinition => {
  return {
    elements: [
      {
        type: 'section',
        key: 'configSection',
        label: 'Configurações',
        children: [
          {
            type: 'colorpicker',
            key: 'color',
            label: 'Cor',
            defaultValue: '#3b82f6',
          },
          {
            type: 'dropdown',
            key: 'format',
            label: 'Formato',
            defaultValue: 'decimal',
            values: ['decimal', 'percentage', 'currency'],
          }
        ]
      }
    ]
  };
}
```

**Acesso aos valores:**
```typescript
const visualProps = chartModel.visualProps || {};
const color = visualProps['configSection']?.color || defaultValue;
```

### 5. Renderização SVG

**Estrutura básica:**
```typescript
const chartWidth = chartData.length * 60 + 150;
const chartHeight = 500;
const leftMargin = 120;
const bottomMargin = 60;

chartElement.innerHTML = `
  <svg width="100%" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}">
    <!-- Eixos Y -->
    <!-- Eixo X -->
    <!-- Barras -->
    <!-- Labels -->
  </svg>
`;
```

**Coordenadas SVG:**
- Y aumenta para baixo (valor máximo = menor coordenada Y)
- Sempre calcular `barY = Math.min(valueY, baseY)` para garantir altura positiva

### 6. Eventos do Chart SDK

**Eventos importantes:**
- `ChartToTSEvent.RenderComplete` - DEVE ser emitido após renderizar
- `ChartToTSEvent.RenderError` - Emitir em caso de erro

**Importante:**
```typescript
// Sempre emitir ao final do renderChart:
ctx.emitEvent(ChartToTSEvent.RenderComplete, []);
```

---

## ⚠️ Limitações e Bugs Conhecidos

### 1. Bug do ThoughtSpot (RESOLVIDO)

**Erro original:** `Cannot destructure property 'elements' of 'e' as it is undefined`

**Resolução:** Adicionar `visualPropEditorDefinition` retornando `{ elements: [] }` ou elementos válidos.

**Status:** ✅ Resolvido

### 2. Documentação vs Realidade

**Problema:** `visualPropEditorDefinition` é opcional na documentação, mas na prática é necessário.

**Impacto:** Sem esta função, o ThoughtSpot pode falhar ao processar o ChartConfig.

**Recomendação:** Sempre incluir `visualPropEditorDefinition`, mesmo que vazio.

### 3. Avisos de Preload

**Mensagem:**
```
The resource <URL> was preloaded but not used within a few seconds...
```

**Status:** ⚠️ Normal e não crítico
- São avisos do ThoughtSpot sobre seus próprios recursos
- Não afetam funcionamento do chart
- Podem ser ignorados

---

## 🔄 Evolução do Código

### Versão Inicial (Simplificada)
- 1 dimensão + 1 medida
- Renderização básica com Muze

### Versão Intermediária
- Múltiplas medidas
- Remoção do Muze (conforme solicitado)
- Renderização SVG nativa

### Versão Atual (Completa)
- ✅ Múltiplas dimensões e medidas
- ✅ Eixos Y individualizados
- ✅ Configurações visuais por medida
- ✅ Formatação de números customizável
- ✅ Cores customizáveis por medida
- ✅ Layout "crosschart" (medidas uma abaixo da outra)

### Principais Mudanças

**1. Remoção do Muze:**
```typescript
// ANTES: Usava Muze via CDN
loadMuze().then(() => { /* render com Muze */ });

// DEPOIS: SVG nativo
chartElement.innerHTML = `<svg>...</svg>`;
```

**2. Suporte a Múltiplas Dimensões:**
```typescript
// Combinar labels:
const combinedLabel = dimensions.map(d => label).join(' - ');
```

**3. Eixos Y Individualizados:**
```typescript
const measureRanges = measures.map(measure => ({
  min: Math.min(...values),
  max: Math.max(...values)
}));
```

**4. Visual Properties:**
```typescript
// Configurações por medida:
visualProps[`measure_${measure.id}`] = {
  color: '#3b82f6',
  format: 'decimal'
};
```

---

## 📝 Comandos Úteis

### Desenvolvimento Local
```bash
npm install
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
```

### Deploy no Railway
```bash
railway status       # Ver status
railway logs         # Ver logs
railway up           # Fazer deploy
railway open         # Abrir dashboard
```

### Debug no ThoughtSpot
1. Abrir DevTools (F12)
2. Filtrar console por `[DEBUG]`
3. Verificar sequência de logs
4. Verificar estrutura de dados recebidos

---

## 🎯 Referências Importantes

### Documentação Oficial
- [ThoughtSpot Chart SDK Documentation](https://developers.thoughtspot.com/docs/chart-sdk-overview)
- [Chart SDK GitHub Repository](https://github.com/thoughtspot/ts-chart-sdk)
- [Chart SDK API Reference](https://ts-chart-sdk-docs.vercel.app/)

### Exemplos Oficiais
- [Gantt Chart Example](https://github.com/thoughtspot/ts-chart-sdk/blob/main/README.md)
- [Bar Chart Example](https://github.com/thoughtspot/ts-chart-sdk/tree/main/example/custom-bar-chart)

### URLs do Projeto
- **URL de Produção:** `https://ts-custom-charts-production.up.railway.app`
- **Repositório:** (interno iFood)

---

## ✅ Checklist Final

### Implementação
- [x] Código implementado e funcionando
- [x] Suporte a múltiplas dimensões
- [x] Suporte a múltiplas medidas
- [x] Eixos Y individualizados
- [x] Configurações visuais por medida
- [x] Renderização SVG nativa (sem Muze)

### Deploy
- [x] Railway configurado
- [x] Build funcionando
- [x] CSP configurado no ThoughtSpot
- [x] Chart SDK registrado no ThoughtSpot

### Documentação
- [x] README.md atualizado
- [x] Aprendizados documentados
- [x] Troubleshooting documentado

---

---

### Limitação: Nova Medida Não Aparece Imediatamente

**Problema:**
Quando uma nova medida é adicionada ao gráfico, ela pode aparecer com valor 0 e não ser atualizada mesmo após 30 segundos de retry.

**Causa Raiz:**
O ThoughtSpot não está chamando `getDefaultChartConfig` novamente quando uma nova medida é adicionada. Ele usa um `ChartConfig` em cache que não inclui a nova medida, fazendo com que:
- A nova medida não seja incluída na query gerada por `getQueriesFromChartConfig`
- A nova medida nunca apareça nos dados retornados
- O sistema de retry não consiga encontrar os dados porque eles nunca foram solicitados na query

**Evidências nos Logs:**
- `visualPropEditorDefinition` mostra 7 medidas (incluindo a nova)
- `getQueriesFromChartConfig` recebe um `chartConfig` com apenas 6 medidas (desatualizado)
- `getDefaultChartConfig` não é chamado quando a nova medida é adicionada
- A query gerada tem apenas 8 colunas (2 dimensões + 6 medidas antigas)

**Solução:**
Mudar qualquer configuração do gráfico (ex: "Mostrar Eixo Y", depois desmarcar) para forçar o ThoughtSpot a re-executar tudo, incluindo chamar `getDefaultChartConfig` novamente com todas as medidas.

**Workaround Implementado:**
- Sistema de retry que tenta por 30 segundos (30 tentativas a cada 1 segundo)
- Mensagens claras explicando o problema e a solução quando o retry falha
- Logs detalhados para diagnóstico

**Hipótese Testada e Refutada - Uso de `elements`:**
Testamos a hipótese de que o problema estava relacionado ao uso de `elements` no `visualPropEditorDefinition`. Implementamos:
1. Dependência explícita das colunas em `columnsVizPropDefinition` (já estava implementado)
2. Seção `_column_dependency` nos `elements` que muda quando as colunas mudam (número de medidas/dimensões)

**Resultado do Teste:**
Mesmo com essas mudanças, os logs confirmam que:
- ✅ `visualPropEditorDefinition` detecta corretamente 7 medidas (incluindo a nova)
- ✅ `columnsVizPropDefinition` contém todas as 7 medidas
- ✅ `_column_dependency` mostra 7 medidas
- ❌ `getDefaultChartConfig` **NÃO é chamado** quando a nova medida é adicionada
- ❌ `getQueriesFromChartConfig` recebe um `chartConfig` cacheado com apenas 6 medidas

**Conclusão:**
O problema **NÃO está relacionado ao uso de `elements`**. É uma limitação fundamental do ThoughtSpot que usa cache do `ChartConfig` e não detecta mudanças nas colunas para re-executar `getDefaultChartConfig`, independentemente da estrutura do `visualPropEditorDefinition`.

**Tentativa de Solução Automática:**
Implementamos uma tentativa de forçar atualização usando o evento `UpdateVisualProps`:
- Quando detectamos medidas faltando, emitimos `UpdateVisualProps` com um contador incrementado
- Isso pode fazer o ThoughtSpot detectar uma mudança e re-executar `getDefaultChartConfig`
- Tentamos novamente a cada 5 tentativas durante o retry (por até 30 segundos)
- Ver `SOLUCAO_FORCAR_ATUALIZACAO.md` para detalhes

**Análise de Chart Existente (VitaraHCFunnelChart):**
Analisamos um chart profissional pronto (VitaraHCFunnelChart) para verificar se há alguma técnica especial:
- ✅ Usa a mesma estrutura básica: `getDefaultChartConfig`, `getQueriesFromChartConfig`, `chartConfigEditorDefinition`
- ✅ Filtra todas as medidas/dimensões diretamente no `getDefaultChartConfig` (como fazemos)
- ✅ Não possui mecanismo automático para detectar mudanças de colunas
- ✅ Também depende de interação do usuário (via `chartConfigEditorDefinition`) para atualizar o ChartConfig

**Conclusão Final:**
O problema é uma **limitação fundamental do ThoughtSpot Chart SDK**. Não há solução automática viável dentro do SDK. O único workaround conhecido é:
1. **Solução Manual:** O usuário deve mudar qualquer configuração (ex: toggle "Mostrar Eixo Y") para forçar o ThoughtSpot a re-executar `getDefaultChartConfig`
2. **Mensagens Claras:** Manter logs e avisos explicando o problema quando detectado

**Status:** ⚠️ Limitação do ThoughtSpot - Não há solução automática viável

---

**Última atualização:** 2025-12-04  
**Status:** ✅ Implementação Completa e Funcional (com limitação conhecida)

