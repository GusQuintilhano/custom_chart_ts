# Guia Rápido - Chart 01 no Muze Studio

## 📋 Passo a Passo para Usar no Muze Studio

### 1. Acessar o Muze Studio no ThoughtSpot

1. Faça login no ThoughtSpot
2. Crie uma **Answer** ou abra uma existente
3. Clique no botão **Change visualization** (ícone de gráfico)
4. Na seção **Custom** (parte inferior), clique em **Muze Studio**

### 2. Abrir o Editor de Código

1. No canto superior direito do preview do gráfico, clique no botão **Code Editor** (ícone de código)
2. O painel do editor abrirá com 3 abas: **JavaScript**, **CSS** e **HTML**

### 3. Copiar o Código HTML

**Aba HTML:**
```html
<div id="chart" style="width: 100%; height: 500px;"></div>
```

Ou copie o conteúdo completo do arquivo: `src/index.html`

### 4. Copiar o Código CSS

**Aba CSS:**
Cole o conteúdo completo do arquivo `src/styles.css`:

```css
/* Custom Styles para ifood-muze-conditional-colors */

.chart-container {
  width: 100%;
  height: 500px;
  font-family: 'Inter', sans-serif;
}

.chart-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.chart-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

/* Legendas customizadas */
.legend-item {
  display: inline-flex;
  align-items: center;
  margin-right: 1rem;
  font-size: 0.875rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 0.5rem;
}

/* Tooltip customizado */
.muze-tooltip {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-size: 0.875rem;
}

/* Melhorias de acessibilidade */
.chart-container:focus {
  outline: 2px solid #ea580c;
  outline-offset: 2px;
}
```

### 5. Copiar o Código JavaScript

**Aba JavaScript:**
Cole o conteúdo completo do arquivo `src/index.js` (148 linhas)

Ou copie diretamente:

```javascript
// JavaScript para ThoughtSpot Custom Chart: ifood-muze-conditional-colors
// Funcionalidade: Gráfico de barras com color encoding condicional baseado em benchmark dinâmico
// 
// Baseado na documentação oficial do Muze:
// https://developers.thoughtspot.com/charts/muze/Documentation/

// Cores configuráveis
const CHART_CONFIG = {
  colors: {
    aboveBenchmark: '#22c55e',  // Verde: valores acima da média
    belowBenchmark: '#ef4444',  // Vermelho: valores abaixo da média
    nearBenchmark: '#eab308'    // Amarelo: valores próximos à média (±5%)
  },
  threshold: 0.05  // 5% para considerar "próximo"
};

// Função principal de renderização
function renderCustomChart() {
  try {
    // Verificar se viz está disponível
    if (typeof viz === 'undefined' || !viz.muze || !viz.getDataFromSearchQuery) {
      throw new Error('API viz do ThoughtSpot não está disponível');
    }
    
    // Obter API do ThoughtSpot
    const { muze, getDataFromSearchQuery } = viz;
    
    // getDataFromSearchQuery() retorna um DataModel diretamente (conforme documentação)
    const dm = getDataFromSearchQuery();
    
    if (!dm) {
      throw new Error('Nenhum dado disponível da query do ThoughtSpot');
    }
    
    console.log('✅ DataModel recebido do ThoughtSpot');
    
    // Para calcular a média, precisamos obter os dados do DataModel
    // Conforme documentação, usamos .getData() que retorna {schema: [], data: []}
    const dataResult = dm.getData();
    const dataArray = dataResult.data || [];
    const schema = dataResult.schema || [];
    
    if (!dataArray || dataArray.length === 0) {
      document.getElementById('chart').innerHTML = 
        `<p style="padding: 20px; color: #6b7280;">
          Nenhum dado disponível para visualização.
        </p>`;
      return;
    }
    
    console.log('📊 Total de registros:', dataArray.length);
    console.log('📋 Schema:', schema);
    
    // Identificar dimensão e medida do schema
    const dimensionField = schema.find(f => f.type === 'dimension');
    const measureField = schema.find(f => f.type === 'measure');
    
    if (!dimensionField || !measureField) {
      throw new Error(`Não foi possível identificar dimension ou measure no schema. 
        Dimension: ${dimensionField?.name || 'não encontrada'}, 
        Measure: ${measureField?.name || 'não encontrada'}`);
    }
    
    const dimensionCol = dimensionField.name;
    const measureCol = measureField.name;
    
    console.log(`📐 Dimension: ${dimensionCol}, Measure: ${measureCol}`);
    
    // Calcular benchmark (média) usando os dados
    const mean = dataArray.reduce((sum, item) => {
      const val = parseFloat(item[measureCol]) || 0;
      return sum + val;
    }, 0) / dataArray.length;
    
    console.log(`📊 Benchmark (Média): ${mean.toFixed(2)}`);
    
    // Criar função de cor condicional baseada no benchmark
    // Conforme documentação, .color() aceita função que recebe o valor da dimensão
    const getColorForValue = (dimensionValue, measureValue) => {
      if (!measureValue || isNaN(measureValue)) {
        return '#94a3b8'; // Cinza para valores inválidos
      }
      
      const value = parseFloat(measureValue);
      const distance = value - mean;
      const percentDistance = Math.abs(distance / mean);
      
      if (percentDistance <= CHART_CONFIG.threshold) {
        // Próximo da média (±5%)
        return CHART_CONFIG.colors.nearBenchmark;
      } else if (value > mean) {
        // Acima da média
        return CHART_CONFIG.colors.aboveBenchmark;
      } else {
        // Abaixo da média
        return CHART_CONFIG.colors.belowBenchmark;
      }
    };
    
    // Criar um campo calculado para a cor usando transform do DataModel
    // Ou usar função direta no color encoding
    // Conforme documentação, podemos usar função em .color()
    
    // Criar mapa de cores por valor da dimensão
    const colorMap = new Map();
    dataArray.forEach(item => {
      const dimValue = item[dimensionCol];
      const measureValue = item[measureCol];
      colorMap.set(dimValue, getColorForValue(dimValue, measureValue));
    });
    
    // Função para retornar cor baseada na dimensão
    const colorFunction = (d) => {
      return colorMap.get(d) || '#94a3b8';
    };
    
    // Renderizar gráfico com Muze seguindo padrão da documentação
    // Conforme documentação: muze.canvas().data(dm).rows([...]).columns([...]).color(...).mount("#chart")
    muze
      .canvas()
      .data(dm)  // Passar DataModel diretamente
      .rows([measureCol])  // Y-axis: medida
      .columns([dimensionCol])  // X-axis: dimensão
      .color(colorFunction)  // Color encoding condicional
      .layers([{
        mark: 'bar'  // Garantir que seja um gráfico de barras
      }])
      .mount("#chart");
    
    console.log('✅ Gráfico renderizado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao renderizar gráfico:', error);
    document.getElementById('chart').innerHTML = 
      `<div style="padding: 20px; color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">
        <h4 style="margin: 0 0 10px 0;">❌ Erro ao renderizar gráfico</h4>
        <p style="margin: 0 0 10px 0;">${error.message}</p>
        <details style="margin-top: 10px;">
          <summary style="cursor: pointer; color: #3b82f6;">Ver detalhes técnicos</summary>
          <pre style="font-size: 11px; background: white; padding: 10px; margin-top: 5px; overflow: auto; max-height: 200px;">${error.stack || error.toString()}</pre>
        </details>
      </div>`;
  }
}

// Executar renderização
renderCustomChart();
```

### 6. Testar o Gráfico

1. Após colar os códigos, clique no botão **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)
2. O gráfico deve aparecer no preview à esquerda
3. Verifique o console do navegador (F12) para ver os logs:
   - ✅ DataModel recebido do ThoughtSpot
   - 📊 Total de registros
   - 📐 Dimension e Measure identificados
   - 📊 Benchmark (Média) calculado
   - ✅ Gráfico renderizado com sucesso

### 7. Salvar

1. Clique no botão **Save** para salvar o chart
2. Se a Answer já estiver fixada em um Liveboard, clique em **Pin** para publicar

## 🎨 Funcionalidade do Chart

O gráfico automaticamente:
- ✅ Calcula a média de todos os valores (benchmark)
- ✅ Aplica cores condicionais:
  - 🟢 **Verde** (`#22c55e`): Valores acima da média
  - 🔴 **Vermelho** (`#ef4444`): Valores abaixo da média
  - 🟡 **Amarelo** (`#eab308`): Valores próximos à média (±5%)
- ✅ Detecta automaticamente dimensão e medida do schema
- ✅ Renderiza gráfico de barras usando Muze

## 🔍 Troubleshooting

### Erro: "API viz do ThoughtSpot não está disponível"
- Certifique-se de que está usando o código dentro do Muze Studio do ThoughtSpot
- Não funciona em ambiente local sem o ThoughtSpot

### Erro: "Nenhum dado disponível"
- Verifique se a busca (query) retorna dados
- Certifique-se de ter pelo menos uma coluna string (dimension) e uma coluna number (measure)

### Cores não aparecem corretamente
- Abra o console do navegador (F12) e verifique os logs
- Confirme que os valores numéricos são válidos
- Verifique se o benchmark foi calculado corretamente

### Gráfico não renderiza
- Verifique o console para erros
- Certifique-se de que o container `#chart` existe no HTML
- Verifique se o Muze está carregado corretamente

## 📝 Notas Importantes

- O chart detecta automaticamente qual coluna é **dimension** (string) e qual é **measure** (number)
- O benchmark é calculado dinamicamente a cada renderização
- As cores são aplicadas baseadas na comparação com a média
- O threshold de 5% pode ser ajustado na constante `CHART_CONFIG.threshold`

