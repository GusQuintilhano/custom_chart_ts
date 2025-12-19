/**
 * Custom Chart: ifood-muze-ranked-bars
 * 
 * Funcionalidade: Gráfico de barras com rank e linha de percentual acumulado
 * - Cálculo de rank baseado em ordenação por medida
 * - Cálculo de percentual acumulado (cumulative percentage)
 * - Visualização combinada: barras (valores) + linha (percentual acumulado)
 * 
 * Baseado na documentação oficial do Muze:
 * https://developers.thoughtspot.com/charts/muze/Documentation/
 */

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
    
    // Obter dados para processamento
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
    
    // Extrair valores corretamente (aplicando aprendizados do Chart 01 e 02)
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
    
    // Calcular total para percentual acumulado
    const total = measureValues.reduce((sum, val) => sum + val, 0);
    console.log(`📊 Total calculado: ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    
    // Ordenar dados por medida (descendente) para calcular rank
    const dataWithIndex = dimensionValues.map((dim, idx) => ({
      [dimensionCol]: dim,
      [measureCol]: measureValues[idx],
      _originalIndex: idx
    }));
    
    // Ordenar por medida (descendente)
    const sortedData = [...dataWithIndex].sort((a, b) => b[measureCol] - a[measureCol]);
    
    // Criar mapas para rank e percentual acumulado
    const rankMap = new Map();
    const cumulativeMap = new Map();
    let cumulativeSum = 0;
    
    sortedData.forEach((item, index) => {
      const dimValue = item[dimensionCol];
      const measureValue = item[measureCol];
      
      // Rank: posição na ordenação (1-based)
      const rank = index + 1;
      rankMap.set(dimValue, rank);
      
      // Percentual acumulado
      cumulativeSum += measureValue;
      const cumulativePercent = total > 0 ? (cumulativeSum / total) * 100 : 0;
      cumulativeMap.set(dimValue, cumulativePercent);
    });
    
    console.log(`📊 Rank e percentual acumulado calculados para ${sortedData.length} itens`);
    console.log(`📊 Primeiros 5 itens por rank:`, sortedData.slice(0, 5).map(item => ({
      [dimensionCol]: item[dimensionCol],
      [measureCol]: item[measureCol],
      rank: rankMap.get(item[dimensionCol]),
      cumulativePercent: cumulativeMap.get(item[dimensionCol]).toFixed(2) + '%'
    })));
    console.log(`📊 Últimos 5 itens por rank:`, sortedData.slice(-5).map(item => ({
      [dimensionCol]: item[dimensionCol],
      [measureCol]: item[measureCol],
      rank: rankMap.get(item[dimensionCol]),
      cumulativePercent: cumulativeMap.get(item[dimensionCol]).toFixed(2) + '%'
    })));
    
    // Criar campos calculados no DataModel
    const rankField = '_rank';
    const cumulativePercentField = '_cumulative_percent';
    
    // Campo 1: Rank
    const dmWithRank = dm.calculateVariable(
      {
        name: rankField,
        type: 'dimension',
      },
      [dimensionCol],
      (dimensionValue) => {
        return rankMap.get(dimensionValue) || 0;
      }
    );
    
    // Campo 2: Percentual acumulado
    const dmWithBoth = dmWithRank.calculateVariable(
      {
        name: cumulativePercentField,
        type: 'measure',
      },
      [dimensionCol],
      (dimensionValue) => {
        return cumulativeMap.get(dimensionValue) || 0;
      }
    );
    
    console.log('✅ Campos calculados criados: _rank e _cumulative_percent');
    
    // Ordenar DataModel por rank (para que o gráfico mostre em ordem crescente de rank)
    // Isso garante que a linha de percentual acumulado cresça da esquerda para direita
    const dmOrdered = dmWithBoth.sort([rankField], 'asc');
    
    console.log('✅ DataModel ordenado por rank');
    
    // Renderizar gráfico com múltiplas layers
    // Layer 1: Barras com valores (ordenadas por rank)
    // Layer 2: Linha com percentual acumulado
    muze
      .canvas()
      .data(dmOrdered)  // DataModel ordenado por rank
      .columns([dimensionCol])  // X-axis: dimensão
      .rows([
        [measureCol],           // Y-axis 1: valores (barras)
        [cumulativePercentField] // Y-axis 2: percentual acumulado (linha)
      ])
      .layers([
        {
          mark: 'bar',  // Layer 1: Barras com valores
          encoding: {
            y: measureCol,
            color: {
              value: () => '#3b82f6'  // Azul para barras
            }
          }
        },
        {
          mark: 'line',  // Layer 2: Linha com percentual acumulado
          encoding: {
            y: cumulativePercentField,
            color: {
              value: () => '#ef4444'  // Vermelho para linha
            }
          }
        }
      ])
      .config({
        axes: {
          x: {
            fields: {
              [dimensionCol]: {
                // Garantir que o eixo X esteja ordenado pela ordem do rank
                domain: sortedData.map(item => item[dimensionCol])
              }
            }
          },
          y: {
            tickFormat: (dataInfo, contextInfo) => {
              // Formatar eixo Y direito como percentual
              if (contextInfo.context.config().field === cumulativePercentField) {
                return `${dataInfo.formattedValue}%`;
              }
              return dataInfo.formattedValue;
            },
          },
        },
      })
      .mount("#chart");
    
    console.log('✅ Gráfico com rank e percentual acumulado renderizado');
    
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
