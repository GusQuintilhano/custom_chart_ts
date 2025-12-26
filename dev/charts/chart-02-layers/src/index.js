/**
 * Custom Chart: ifood-muze-layered-chart
 * 
 * Funcionalidade: Composição complexa com múltiplas layers
 * - Layer 1: mark.bar() para valores principais
 * - Layer 2: mark.point() para destacar top 3 (outliers)
 * - Layer 3: mark.text() para labels dos top 3
 * 
 * Baseado na documentação oficial do Muze:
 * https://developers.thoughtspot.com/charts/muze/Documentation/
 */

const chartConfig = {
  topN: 3
};

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
    
    // Obter dados para identificar top N
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
    
    // Identificar dimensão e medida do schema
    const dimensionField = schema.find(f => f.type === 'dimension');
    const measureField = schema.find(f => f.type === 'measure');
    
    if (!dimensionField || !measureField) {
      throw new Error(`Não foi possível identificar dimension ou measure no schema.`);
    }
    
    const dimensionCol = dimensionField.name;
    const measureCol = measureField.name;
    
    console.log(`📐 Dimension: ${dimensionCol}, Measure: ${measureCol}`);
    
    // Extrair valores corretamente (aplicando aprendizados do Chart 01)
    let dimensionValues = [];
    let measureValues = [];
    
    // Verificar formato dos dados
    if (Array.isArray(dataArray[0])) {
      // Array de arrays - usar índices do schema
      const dimIndex = schema.findIndex(f => f.name === dimensionCol && f.type === 'dimension');
      const measureIndex = schema.findIndex(f => f.name === measureCol && f.type === 'measure');
      
      dimensionValues = dataArray.map(row => row[dimIndex]);
      measureValues = dataArray.map(row => parseFloat(row[measureIndex]) || 0);
    } else {
      // Array de objetos - encontrar keys corretas
      const firstRow = dataArray[0] || {};
      const availableKeys = Object.keys(firstRow);
      
      const dimKey = availableKeys.find(k => 
        k === dimensionCol || 
        k.toLowerCase() === dimensionCol.toLowerCase()
      );
      
      const measureKey = availableKeys.find(k => 
        k === measureCol || 
        k.toLowerCase() === measureCol.toLowerCase()
      );
      
      if (dimKey && measureKey) {
        dimensionValues = dataArray.map(row => row[dimKey]);
        measureValues = dataArray.map(row => parseFloat(row[measureKey]) || 0);
      } else {
        // Fallback: usar nomes do schema
        dimensionValues = dataArray.map(row => row[dimensionCol]);
        measureValues = dataArray.map(row => parseFloat(row[measureCol]) || 0);
      }
    }
    
    // Criar array de objetos para ordenação
    const dataWithValues = dimensionValues.map((dim, idx) => ({
      [dimensionCol]: dim,
      [measureCol]: measureValues[idx]
    }));
    
    // Ordenar por medida e identificar top N
    const sortedData = [...dataWithValues].sort((a, b) => b[measureCol] - a[measureCol]);
    const topNData = sortedData.slice(0, chartConfig.topN);
    const topNDimensions = new Set(topNData.map(item => item[dimensionCol]));
    
    console.log(`📊 Top ${chartConfig.topN} valores identificados:`, Array.from(topNDimensions));
    console.log(`📊 Valores do Top ${chartConfig.topN}:`, topNData.map(item => ({
      [dimensionCol]: item[dimensionCol],
      [measureCol]: item[measureCol]
    })));
    
    // Criar campo calculado no DataModel para identificar se é top N
    // Aplicando padrão do Chart 01
    const topNCategoryField = '_is_top_n';
    
    const dmWithTopN = dm.calculateVariable(
      {
        name: topNCategoryField,
        type: 'dimension',
      },
      [dimensionCol, measureCol],
      (dimensionValue, measureValue) => {
        // Verificar se a dimensão está no conjunto de top N
        return topNDimensions.has(dimensionValue) ? 'top' : 'other';
      }
    );
    
    console.log('✅ Campo calculado _is_top_n criado');
    
    // Preparar lista de valores do top N para filtro
    const topNDimensionValues = Array.from(topNDimensions);
    
    console.log('✅ DataModels separados criados para layers');
    
    // Renderizar gráfico com múltiplas layers
    // Conforme documentação, layers é um array de objetos {mark: "bar", ...}
    // Layer 1: Barras para todos os valores
    // Layer 2: Pontos para destacar top N (usando source diferente)
    // Layer 3: Texto para labels dos top N
    muze
      .canvas()
      .data(dmWithTopN)  // DataModel completo com campo calculado
      .rows([measureCol])  // Y-axis: medida
      .columns([dimensionCol])  // X-axis: dimensão
      .color({
        field: topNCategoryField,
        range: [
          '#94a3b8',  // other (cinza)
          '#ef4444'   // top (vermelho)
        ]
      })
      .transform({
        topNData: (dt) => {
          // Filtrar apenas os dados do top N usando select()
          // Criar condições para cada valor do top N
          const conditions = topNDimensionValues.map(dimValue => ({
            field: dimensionCol,
            value: dimValue,
            operator: 'eq'
          }));
          
          return dt.select({
            conditions: conditions,
            operator: 'or'  // Qualquer um dos valores do top N
          });
        }
      })
      .layers([
        {
          mark: 'bar'  // Layer 1: Barras para todos os valores
        },
        {
          mark: 'point',  // Layer 2: Pontos para destacar top N
          source: 'topNData',  // Usar fonte de dados separada (apenas top N)
          encoding: {
            size: {
              value: 80  // Tamanho fixo dos pontos
            },
            color: {
              value: () => '#ef4444'  // Cor vermelha para os pontos
            }
          }
        },
        {
          mark: 'text',  // Layer 3: Labels de texto para top N
          source: 'topNData',  // Usar fonte de dados separada (apenas top N)
          encoding: {
            text: {
              field: measureCol,
              formatter: (t) => t.rawValue.toLocaleString('pt-BR')
            },
            color: {
              value: () => '#1f2937'  // Cor do texto
            }
          },
          calculateDomain: false  // Não recalcular domínio para esta layer
        }
      ])
      .mount("#chart");
    
    console.log('✅ Gráfico com múltiplas layers renderizado');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    document.getElementById('chart').innerHTML = 
      `<div style="padding: 20px; color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">
        <h4 style="margin: 0 0 10px 0;">❌ Erro ao renderizar gráfico</h4>
        <p style="margin: 0;">${error.message}</p>
        <details style="margin-top: 10px;">
          <summary style="cursor: pointer; color: #3b82f6;">Ver detalhes técnicos</summary>
          <pre style="font-size: 11px; background: white; padding: 10px; margin-top: 5px; overflow: auto; max-height: 200px;">${error.stack || error.toString()}</pre>
        </details>
      </div>`;
  }
}

// Executar renderização
renderCustomChart();




