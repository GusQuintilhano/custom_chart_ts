/**
 * Custom Chart: ifood-muze-boxplot
 * 
 * Funcionalidade: Boxplot com cálculo de quartis, mediana e identificação de outliers
 * - Calcula Q1, Q2 (mediana), Q3, mínimo e máximo
 * - Identifica outliers usando IQR (Interquartile Range)
 * - Renderiza usando layers: bar (caixa), line (bigodes), tick (mediana), point (outliers)
 */

function calculateQuartiles(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  if (n === 0) return null;
  
  const q1Index = Math.floor(n * 0.25);
  const q2Index = Math.floor(n * 0.5);
  const q3Index = Math.floor(n * 0.75);
  
  const q1 = sorted[q1Index];
  const q2 = sorted[q2Index]; // Mediana
  const q3 = sorted[q3Index];
  
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  
  // Bigodes vão até os valores reais ou até as fences (o que for mais próximo do box)
  const minWhisker = sorted.filter(v => v >= lowerFence)[0] || sorted[0];
  const maxWhisker = sorted.filter(v => v <= upperFence).slice(-1)[0] || sorted[n - 1];
  
  const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
  
  return { 
    q1, 
    q2, 
    q3, 
    min: sorted[0], 
    max: sorted[n - 1],
    minWhisker,
    maxWhisker,
    lowerFence,
    upperFence,
    outliers 
  };
}

function renderCustomChart() {
  try {
    if (typeof viz === 'undefined' || !viz.muze || !viz.getDataFromSearchQuery) {
      throw new Error('API viz do ThoughtSpot não está disponível');
    }
    
    const { muze, getDataFromSearchQuery } = viz;
    const dm = getDataFromSearchQuery();
    
    if (!dm) {
      throw new Error('Nenhum dado disponível da query do ThoughtSpot');
    }
    
    const dataResult = dm.getData();
    const dataArray = dataResult.data || [];
    const schema = dataResult.schema || [];
    
    if (!dataArray || dataArray.length === 0) {
      document.getElementById('chart').innerHTML = '<p style="padding: 20px; color: #6b7280;">Nenhum dado disponível.</p>';
      return;
    }
    
    // Identificar dimensão e medida
    const dimensionField = schema.find(f => f.type === 'dimension');
    const measureField = schema.find(f => f.type === 'measure');
    
    if (!dimensionField || !measureField) {
      throw new Error('É necessário ter exatamente 1 dimensão e 1 medida.');
    }
    
    const dimensionCol = dimensionField.name;
    const measureCol = measureField.name;
    
    // Agrupar valores por dimensão
    const dimensionIndex = schema.findIndex(s => s.name === dimensionCol);
    const measureIndex = schema.findIndex(s => s.name === measureCol);
    
    const valuesByDimension = {};
    
    dataArray.forEach(row => {
      const dimValue = row[dimensionIndex];
      const measureValue = parseFloat(row[measureIndex]);
      
      if (!isNaN(measureValue)) {
        if (!valuesByDimension[dimValue]) {
          valuesByDimension[dimValue] = [];
        }
        valuesByDimension[dimValue].push(measureValue);
      }
    });
    
    // Calcular estatísticas para cada dimensão
    const boxplotData = [];
    const outlierData = [];
    
    Object.keys(valuesByDimension).forEach(dimValue => {
      const values = valuesByDimension[dimValue];
      const stats = calculateQuartiles(values);
      
      if (stats && values.length > 0) {
        boxplotData.push({
          [dimensionCol]: String(dimValue),
          minValue: stats.minWhisker,
          q1: stats.q1,
          median: stats.q2,
          q3: stats.q3,
          maxValue: stats.maxWhisker
        });
        
        console.log(`📊 ${dimValue}: Q1=${stats.q1.toFixed(2)}, Mediana=${stats.q2.toFixed(2)}, Q3=${stats.q3.toFixed(2)}, Min=${stats.minWhisker.toFixed(2)}, Max=${stats.maxWhisker.toFixed(2)}, Outliers=${stats.outliers.length}`);
        
        // Adicionar outliers
        if (stats.outliers && stats.outliers.length > 0) {
          stats.outliers.forEach(outlierValue => {
            outlierData.push({
              [dimensionCol]: String(dimValue),
              outlier: outlierValue
            });
          });
        }
      }
    });
    
    if (boxplotData.length === 0) {
      throw new Error('Nenhum dado válido para boxplot.');
    }
    
    console.log(`✅ Boxplot: ${boxplotData.length} categorias processadas, ${outlierData.length} outliers encontrados`);
    
    // Criar DataModel
    const DataModel = muze.DataModel;
    const boxplotSchema = [
      { name: dimensionCol, type: 'dimension' },
      { name: 'minValue', type: 'measure' },
      { name: 'q1', type: 'measure' },
      { name: 'median', type: 'measure' },
      { name: 'q3', type: 'measure' },
      { name: 'maxValue', type: 'measure' }
    ];
    
    const parsedData = DataModel.loadDataSync(boxplotData, boxplotSchema);
    let dmBoxplot = new DataModel(parsedData);
    
    // Usar operador share para criar eixo Y compartilhado (conforme documentação)
    const { share } = muze.Operators;
    const sharedYField = share('minValue', 'q1', 'median', 'q3', 'maxValue');
    
    // Preparar layers para boxplot
    // Usando abordagem mais simples: criar dados expandidos para bigodes
    const layers = [
      // Caixa principal (Q1 até Q3) - barra
      {
        mark: 'bar',
        encoding: {
          x: dimensionCol,
          y: 'q3',
          y0: 'q1',
          color: { field: dimensionCol }
        },
        style: {
          fillOpacity: 0.7
        }
      },
      // Mediana - linha horizontal no meio da caixa
      {
        mark: 'line',
        encoding: {
          x: dimensionCol,
          y: 'median',
          color: { value: '#EA1D2C' }
        },
        style: {
          stroke: '#EA1D2C',
          strokeWidth: 2
        }
      }
    ];
    
    // Adicionar bigodes usando transform ou layers adicionais
    // Bigode inferior: linha de minValue até q1
    layers.push({
      mark: 'line',
      encoding: {
        x: dimensionCol,
        y: 'q1',
        y0: 'minValue'
      },
      style: {
        stroke: '#666666',
        strokeWidth: 1
      }
    });
    
    // Bigode superior: linha de q3 até maxValue
    layers.push({
      mark: 'line',
      encoding: {
        x: dimensionCol,
        y: 'maxValue',
        y0: 'q3'
      },
      style: {
        stroke: '#666666',
        strokeWidth: 1
      }
    });
    
    // Ticks nas extremidades
    layers.push({
      mark: 'tick',
      encoding: {
        x: dimensionCol,
        y: 'minValue'
      },
      style: {
        stroke: '#666666',
        strokeWidth: 1
      }
    });
    
    layers.push({
      mark: 'tick',
      encoding: {
        x: dimensionCol,
        y: 'maxValue'
      },
      style: {
        stroke: '#666666',
        strokeWidth: 1
      }
    });
    
    // Renderizar boxplot
    muze
      .canvas()
      .data(dmBoxplot)
      .rows([sharedYField])
      .columns([dimensionCol])
      .color(dimensionCol)
      .layers(layers)
      .config({
        axes: {
          y: {
            showAxisName: true,
            showLabels: true,
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
              fill: '#666666'
            }
          },
          x: {
            showAxisName: true,
            showLabels: true,
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
              fill: '#666666'
            }
          }
        },
        borders: {
          top: { show: true, stroke: '#e0e0e0' },
          bottom: { show: true, stroke: '#e0e0e0' },
          left: { show: true, stroke: '#e0e0e0' },
          right: { show: false }
        }
      })
      .title('Boxplot')
      .subtitle(`${measureCol} por ${dimensionCol}`)
      .mount("#chart");
    
  } catch (error) {
    console.error('❌ Erro:', error);
    document.getElementById('chart').innerHTML = 
      `<div style="padding: 20px; color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">
        <h4 style="margin: 0 0 10px 0;">❌ Erro ao renderizar boxplot</h4>
        <p style="margin: 0;">${error.message}</p>
      </div>`;
  }
}

renderCustomChart();
