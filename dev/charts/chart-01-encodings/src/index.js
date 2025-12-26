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
    
    // Debug: verificar estrutura dos dados
    console.log('🔍 Primeiro item do dataArray:', dataArray[0]);
    console.log('🔍 Tipo do primeiro item:', Array.isArray(dataArray[0]) ? 'array' : typeof dataArray[0]);
    
    // Identificar dimensão e medida do schema
    const dimensionField = schema.find(f => f.type === 'dimension');
    const measureField = schema.find(f => f.type === 'measure');
    
    if (!dimensionField || !measureField) {
      throw new Error(`Não foi possível identificar dimension ou measure no schema. 
        Dimension: ${dimensionField?.name || 'não encontrada'}, 
        Measure: ${measureField?.name || 'não encontrada'}`);
    }
    
    let dimensionCol = dimensionField.name;
    let measureCol = measureField.name;
    
    console.log(`📐 Dimension: ${dimensionCol}, Measure: ${measureCol}`);
    
    // Extrair valores da medida do dataArray
    // Os dados podem estar em formato de array de arrays ou array de objetos
    let measureValues = [];
    
    if (Array.isArray(dataArray[0])) {
      // Dados em formato array de arrays - encontrar índice da coluna measure
      const measureIndex = schema.findIndex(f => f.name === measureCol && f.type === 'measure');
      console.log(`🔍 Measure está no índice: ${measureIndex}`);
      
      if (measureIndex >= 0) {
        measureValues = dataArray.map(row => parseFloat(row[measureIndex]) || 0);
      } else {
        throw new Error(`Não foi possível encontrar o índice da coluna ${measureCol}`);
      }
    } else {
      // Dados em formato array de objetos
      // Verificar todos os possíveis nomes de chave
      const firstRow = dataArray[0] || {};
      const availableKeys = Object.keys(firstRow);
      console.log('🔍 Keys disponíveis:', availableKeys);
      
      // Encontrar a chave correta (pode ter espaços ou variações no nome)
      const measureKey = availableKeys.find(k => 
        k === measureCol || 
        k.toLowerCase() === measureCol.toLowerCase() ||
        k.toLowerCase().replace(/\s+/g, '_') === measureCol.toLowerCase().replace(/\s+/g, '_')
      );
      
      if (measureKey) {
        console.log(`✅ Usando chave: ${measureKey} para acessar ${measureCol}`);
        measureValues = dataArray.map(row => parseFloat(row[measureKey]) || 0);
      } else {
        // Tentar usar o nome exato do schema
        console.log(`⚠️ Tentando usar nome exato: ${measureCol}`);
        measureValues = dataArray.map(row => {
          const val = row[measureCol];
          return parseFloat(val) || 0;
        });
      }
    }
    
    console.log('🔍 Primeiros 10 valores extraídos:', measureValues.slice(0, 10));
    
    // Calcular média
    if (measureValues.length === 0) {
      throw new Error(`Não foi possível extrair valores da coluna ${measureCol}`);
    }
    
    const sum = measureValues.reduce((acc, val) => acc + val, 0);
    const mean = sum / measureValues.length;
    
    console.log(`📊 Benchmark (Média calculada): ${mean.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    
    // Debug: verificar classificação dos primeiros valores
    console.log('📊 Amostra de valores e classificação esperada:');
    const sampleSize = Math.min(10, measureValues.length);
    for (let i = 0; i < sampleSize; i++) {
      const val = measureValues[i];
      const diff = val - mean;
      const pct = mean > 0 ? (Math.abs(diff) / mean * 100).toFixed(1) : 0;
      let cat = '';
      if (mean > 0) {
        const percentDistance = Math.abs(diff / mean);
        if (percentDistance <= CHART_CONFIG.threshold && percentDistance >= 0) {
          cat = 'near';
        } else if (val > mean) {
          cat = 'above';
        } else {
          cat = 'below';
        }
      }
      console.log(`  Valor ${i}: ${val.toLocaleString('pt-BR')} → ${cat} (${diff > 0 ? '+' : ''}${pct}%)`);
    }
    
    // Criar campo calculado no DataModel com a categoria de cor
    // Usando calculateVariable conforme documentação do Muze
    const colorCategoryField = '_color_category';
    
    // Criar DataModel com campo calculado que identifica a categoria de cor
    // IMPORTANTE: A função recebe os valores dos campos na ordem especificada
    const dmWithColor = dm.calculateVariable(
      {
        name: colorCategoryField,
        type: 'dimension',
      },
      [measureCol],  // Campo usado para calcular
      (measureValue) => {
        const value = parseFloat(measureValue) || 0;
        
        // Debug para primeiros valores
        if (Math.random() < 0.1) { // Log apenas ocasionalmente para não poluir
          console.log(`🔍 Classificando valor ${value} vs média ${mean.toFixed(2)}`);
        }
        
        const distance = value - mean;
        const percentDistance = mean > 0 ? Math.abs(distance / mean) : 0;
        
        // Verificar se está próximo da média (±5%)
        if (percentDistance <= CHART_CONFIG.threshold && percentDistance >= 0) {
          return 'near';  // Próximo da média (±5%)
        } else if (value > mean) {
          return 'above';  // Acima da média
        } else if (value < mean) {
          return 'below';  // Abaixo da média
        } else {
          // Exatamente igual à média
          return 'near';
        }
      }
    );
    
    // Verificar os valores calculados
    const colorData = dmWithColor.getData().data;
    const colorCounts = {};
    colorData.forEach(item => {
      const cat = item[colorCategoryField];
      colorCounts[cat] = (colorCounts[cat] || 0) + 1;
    });
    console.log('📊 Distribuição de cores:', colorCounts);
    console.log('✅ Campo calculado de cor criado');
    
    // Renderizar gráfico com Muze seguindo padrão da documentação
    // Usar o campo calculado para color encoding com range de cores
    muze
      .canvas()
      .data(dmWithColor)  // DataModel com campo de cor calculado
      .rows([measureCol])  // Y-axis: medida
      .columns([dimensionCol])  // X-axis: dimensão
      .color({
        field: colorCategoryField,
        // Array de cores que será mapeado automaticamente aos valores únicos do campo
        range: [
          CHART_CONFIG.colors.belowBenchmark,  // below
          CHART_CONFIG.colors.nearBenchmark,   // near  
          CHART_CONFIG.colors.aboveBenchmark   // above
        ]
      })
      .layers([{
        mark: 'bar'  // Gráfico de barras
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
