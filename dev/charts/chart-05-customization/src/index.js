/**
 * Custom Chart: ifood-muze-branded-chart
 * 
 * Funcionalidade: Gráfico de barras com tema customizado seguindo design system do iFood
 * - Paleta de cores iFood (vermelho #EA1D2C, amarelo, laranja, verde, rosa)
 * - Tipografia customizada (Inter, Roboto)
 * - Layout customizado (borders, headers, axes)
 * - Formatação de números e tooltips
 * 
 * Baseado na documentação oficial do Muze:
 * https://developers.thoughtspot.com/charts/muze/Documentation/
 */

// Tema customizado iFood
// Cores oficiais do iFood: vermelho vibrante (#EA1D2C) e branco
// Cores secundárias: amarelo, verde, laranja e rosa vibrantes
const IFOOD_THEME = {
  colors: {
    primary: '#EA1D2C',      // Vermelho iFood (cor principal)
    secondary: '#FFC107',    // Amarelo vibrante iFood
    accent: '#FF6B35',       // Laranja vibrante iFood
    success: '#4CAF50',      // Verde vibrante iFood
    pink: '#FF4081',         // Rosa vibrante iFood
    background: '#ffffff',   // Branco
    text: '#1a1a1a',         // Preto/Cinza escuro
    textLight: '#666666',    // Cinza médio
    border: '#e0e0e0',       // Borda cinza claro
    grid: '#f5f5f5'          // Grid cinza muito claro
  },
  fonts: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    sizes: {
      title: '1.5rem',
      subtitle: '0.875rem',
      axis: '0.75rem'
    }
  },
  spacing: {
    padding: 20,
    margin: 10
  }
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
    
    // Formatação de números para tooltip e eixos
    const nf = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    // Renderizar gráfico com tema customizado iFood
    muze
      .canvas()
      .data(dm)  // DataModel original
      .rows([measureCol])  // Y-axis: medida
      .columns([dimensionCol])  // X-axis: dimensão
      .color({
        field: dimensionCol,
        range: [
          IFOOD_THEME.colors.primary,   // Vermelho iFood (cor principal)
          IFOOD_THEME.colors.secondary, // Amarelo vibrante
          IFOOD_THEME.colors.accent,    // Laranja vibrante
          IFOOD_THEME.colors.success,   // Verde vibrante
          IFOOD_THEME.colors.pink       // Rosa vibrante
        ]
      })
      .title(`${dimensionCol} vs ${measureCol}`, {
        position: 'top',
        align: 'left'
      })
      .subtitle('Visualização customizada com tema iFood', {
        position: 'top',
        align: 'left'
      })
      .layers([
        {
          mark: 'bar',
          interactive: true
        }
      ])
      .config({
        // Configuração de bordas
        borders: {
          top: { show: true, stroke: IFOOD_THEME.colors.border },
          bottom: { show: true, stroke: IFOOD_THEME.colors.border },
          left: { show: true, stroke: IFOOD_THEME.colors.border },
          right: { show: false }
        },
        // Configuração de headers
        showHeaders: true,
        columns: {
          headers: {
            show: true,
            style: {
              fontFamily: IFOOD_THEME.fonts.primary,
              fontSize: IFOOD_THEME.fonts.sizes.axis,
              fill: IFOOD_THEME.colors.text
            }
          }
        },
        rows: {
          headers: {
            show: true,
            style: {
              fontFamily: IFOOD_THEME.fonts.primary,
              fontSize: IFOOD_THEME.fonts.sizes.axis,
              fill: IFOOD_THEME.colors.text
            }
          }
        },
        // Configuração de eixos
        axes: {
          x: {
            showAxisLine: true,
            showAxisName: true,
            tickFormat: (dataInfo) => {
              return dataInfo.formattedValue;
            },
            style: {
              fontFamily: IFOOD_THEME.fonts.primary,
              fontSize: IFOOD_THEME.fonts.sizes.axis,
              fill: IFOOD_THEME.colors.textLight
            }
          },
          y: {
            showAxisLine: true,
            showAxisName: true,
            tickFormat: (dataInfo) => {
              // Formatar números com separadores de milhar
              return nf.format(dataInfo.rawValue);
            },
            style: {
              fontFamily: IFOOD_THEME.fonts.primary,
              fontSize: IFOOD_THEME.fonts.sizes.axis,
              fill: IFOOD_THEME.colors.textLight
            }
          }
        },
        // Configuração de interação (tooltips)
        interaction: {
          tooltip: {
            formatter: (dataStore, config) => {
              const dm = dataStore.dataModel;
              const tooltipData = dm.getData().data;
              
              let tooltipContent = '';
              tooltipData.forEach((dataArray, i) => {
                const dimVal = dataArray[dm.getFieldIndex(dimensionCol)];
                const measureVal = dataArray[dm.getFieldIndex(measureCol)];
                
                tooltipContent += `
                  <div style="padding: 8px 12px; background: ${IFOOD_THEME.colors.background}; border: 1px solid ${IFOOD_THEME.colors.border}; border-radius: 6px;">
                    <div style="font-weight: 600; color: ${IFOOD_THEME.colors.text}; margin-bottom: 4px;">
                      ${dimVal}
                    </div>
                    <div style="color: ${IFOOD_THEME.colors.textLight}; font-size: 0.875rem;">
                      ${measureCol}: <strong style="color: ${IFOOD_THEME.colors.primary};">${nf.format(measureVal)}</strong>
                    </div>
                  </div>
                `;
              });
              
              return tooltipContent;
            }
          }
        }
      })
      .mount("#chart");
    
    console.log('✅ Gráfico com tema customizado iFood renderizado');
    
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
