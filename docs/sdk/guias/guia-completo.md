# Guia Completo - ThoughtSpot Chart SDK

## 📚 Documentação Consolidada

Este guia consolida **todas as informações** sobre como criar, desenvolver e implantar charts usando o **ThoughtSpot Chart SDK**.

---

## 🎯 O que é o Chart SDK?

O **ThoughtSpot Chart SDK** permite criar charts customizados em JavaScript/TypeScript usando bibliotecas de visualização (como Highcharts, D3.js, ou SVG nativo) e hospedá-los externamente para uso no ThoughtSpot.

### Vantagens do Chart SDK

- ✅ Atualizações sem re-upload
- ✅ Versionamento automático
- ✅ Melhor para desenvolvimento iterativo
- ✅ Suporte a configurações visuais dinâmicas
- ✅ Mais flexibilidade na renderização

---

## 🚀 Início Rápido

### 1. Configurar Ambiente

```bash
# Criar projeto Vite
npm create vite@latest meu-chart -- --template vanilla-ts

# Instalar dependências
cd meu-chart
npm install

# Instalar Chart SDK
npm install --save @thoughtspot/ts-chart-sdk

# Instalar biblioteca de visualização (opcional)
npm install --save highcharts lodash
# ou
npm install --save d3
```

### 2. Estrutura Básica do Projeto

```
meu-chart/
├── src/
│   └── index.ts          # Código principal do chart
├── index.html            # HTML base
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### 3. Implementar Chart Básico

Veja o template completo em: [`../aprendizados/APRENDIZADOS_COMPLETOS.md`](../aprendizados/APRENDIZADOS_COMPLETOS.md)

---

## 📋 Passo a Passo: Criar um Chart SDK

### Passo 1: Inicializar Chart Context

```typescript
import { getChartContext, ChartModel, ChartConfig, Query } from '@thoughtspot/ts-chart-sdk';
import _ from 'lodash';

const init = async () => {
    const ctx = await getChartContext({
        getDefaultChartConfig: (chartModel: ChartModel): ChartConfig[] => {
            // Define estrutura lógica do gráfico
            const columns = chartModel.columns;
            const dimensionColumns = columns.filter(col => col.type === 'ATTRIBUTE');
            const measureColumns = columns.filter(col => col.type === 'MEASURE');
            
            return [{
                key: 'default',
                dimensions: [
                    { key: 'x', columns: dimensionColumns },
                    { key: 'y', columns: measureColumns }
                ]
            }];
        },
        
        getQueriesFromChartConfig: (chartConfig: ChartConfig[]): Query[] => {
            return chartConfig.map((config: ChartConfig): Query =>
                _.reduce(
                    config.dimensions,
                    (acc: Query, dimension) => ({
                        queryColumns: [...acc.queryColumns, ...dimension.columns],
                    }),
                    { queryColumns: [] } as Query,
                ),
            );
        },
        
        renderChart: (context) => {
            // Renderizar gráfico
            renderChartInternal(context);
            context.emitEvent(ChartToTSEvent.RenderComplete, []);
        },
    });
    
    renderChart(ctx);
};

init();
```

### Passo 2: Processar Dados

```typescript
const processData = (data: any[]) => {
    const dataArr = data[0].data;
    
    // Criar mapa de índices
    const columnIndexMap = new Map<string, number>();
    dataArr.columns.forEach((colId, idx) => {
        columnIndexMap.set(colId, idx);
    });
    
    // Processar linhas
    return dataArr.dataValue.map(row => {
        // Acessar valores usando o mapa
        // ...
    });
};
```

### Passo 3: Renderizar Gráfico

```typescript
const renderChartInternal = (context: any) => {
    const chartModel = context.getChartModel();
    const data = chartModel.data;
    const visualProps = chartModel.visualProps || {};
    
    // Processar dados
    const processedData = processData(data);
    
    // Renderizar (SVG, Highcharts, D3, etc.)
    const chartElement = document.getElementById('chart-container');
    chartElement.innerHTML = `<svg>...</svg>`;
};
```

---

## 🚀 Deploy

### Opção 1: Railway

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

**Configuração Vite:**
```typescript
// vite.config.ts
preview: {
  allowedHosts: ['.railway.app', 'localhost']
}
```

```json
// package.json
"start": "vite preview --host 0.0.0.0"
```

### Opção 2: Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Configuração CSP no ThoughtSpot

**Via Admin UI:**
1. Admin > Security > Content Security Policy
2. Adicionar domínio ao `frame-src`:
   - `*.railway.app` (para Railway)
   - `*.vercel.app` (para Vercel)

**Via TS CLI:**
```bash
tscli --adv csp add-override --source 'frame-src' --url <your-chart-url>
```

---

## 📝 Registrar Chart no ThoughtSpot

1. Admin > Chart customization > Custom charts
2. Click **Add chart**
3. Preencher:
   - **Name**: Nome do chart
   - **Application URL**: URL do deploy (ex: `https://meu-chart.railway.app`)
   - **Icon URL**: (opcional) URL do ícone
   - **Description**: Descrição do chart
4. Click **Add chart**

---

## 🧪 Testar Localmente

### Usando Playground

1. Acesse: https://byoc-playground.vercel.app/
2. Configure:
   - **App Url**: `http://localhost:5173` (ou porta do seu dev server)
   - **Chart Model**: Selecione um modelo de teste
3. Teste o chart com dados mockados

### Debug

1. Abrir DevTools (F12)
2. Filtrar console por `[DEBUG]`
3. Verificar sequência de logs:
   - `getDefaultChartConfig` sendo chamado
   - `getQueriesFromChartConfig` recebendo ChartConfig
   - `renderChart` sendo executado
   - `RenderComplete` sendo emitido

---

## ⚠️ Problemas Comuns

### Erro: "No target provided to sendMessage"
- **Solução**: Remover lógica extra antes do `getChartContext`
- Seguir EXATAMENTE o padrão da documentação

### Erro: "Cannot destructure property 'elements'"
- **Solução**: Adicionar `visualPropEditorDefinition` (mesmo que vazio)
```typescript
visualPropEditorDefinition: () => ({ elements: [] })
```

### Chart em "loading infinito"
- **Solução**: Sempre emitir `RenderComplete` ao final do `renderChart`
```typescript
context.emitEvent(ChartToTSEvent.RenderComplete, []);
```

### Erro 403 Forbidden no Railway
- **Solução**: Adicionar `allowedHosts` no `vite.config.ts` e `--host 0.0.0.0` no start

### Erro CSP
- **Solução**: Adicionar domínio ao `frame-src` no CSP do ThoughtSpot

---

## 📚 Documentação Completa

Para informações detalhadas, consulte:

- **[Aprendizados Completos](../aprendizados/APRENDIZADOS_COMPLETOS.md)** ⭐ - Todas as lições fundamentais
- **[Documentação Técnica Oficial](../referencia/DOCUMENTACAO_TECNICA_OFICIAL.md)** - Referência técnica
- **[Exemplo: Trellis Chart](../exemplos/trellis-chart/)** - Exemplo completo funcional

---

## ✅ Checklist para Novo Chart

### Implementação
- [ ] `getChartContext` inicializado corretamente
- [ ] `getDefaultChartConfig` retorna ChartConfig válido
- [ ] `getQueriesFromChartConfig` converte corretamente
- [ ] `visualPropEditorDefinition` implementado
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

## 🔗 Links Úteis

- [Chart SDK GitHub](https://github.com/thoughtspot/ts-chart-sdk)
- [Chart SDK API Reference](https://ts-chart-sdk-docs.vercel.app/)
- [Playground](https://byoc-playground.vercel.app/)
- [Documentação ThoughtSpot](https://developers.thoughtspot.com/docs/chart-sdk-overview)

---

**Última atualização:** 2025-01-03



