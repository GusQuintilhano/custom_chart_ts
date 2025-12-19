/**
 * Custom Chart: ifood-muze-interactive-dual
 * 
 * Funcionalidade: Dois gráficos interconectados com filtros dinâmicos
 * - Gráfico 1: Barras mostrando medida por dimensão
 * - Gráfico 2: Pizza mostrando distribuição por cor/dimensão
 * - Interatividade cruzada: selecionar no gráfico 1 filtra o gráfico 2 e vice-versa
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
    
    // Identificar campos do schema
    const dimensions = schema.filter(f => f.type === 'dimension');
    const measures = schema.filter(f => f.type === 'measure');
    
    if (dimensions.length === 0 || measures.length === 0) {
      throw new Error(`Não foi possível identificar dimensões ou medidas no schema. 
        Dimensions: ${dimensions.length}, Measures: ${measures.length}`);
    }
    
    // Usar dimensões diferentes para cada gráfico
    // Gráfico de barras: primeira dimensão
    // Gráfico de pizza: segunda dimensão (se disponível) ou mesma dimensão
    const dimension1Col = dimensions[0].name;
    const measureCol = measures[0].name;
    const dimension2Col = dimensions.length > 1 ? dimensions[1].name : dimensions[0].name;
    
    console.log(`📐 Dimension 1 (barras): ${dimension1Col}, Measure: ${measureCol}`);
    console.log(`📐 Dimension 2 (pizza): ${dimension2Col}`);
    
    // Para cross-filtering funcionar, ambos os gráficos precisam compartilhar um campo
    // Vamos usar dimension2Col como campo compartilhado no color encoding
    // Isso não altera o eixo X do gráfico de barras (que continua sendo dimension1Col)
    
    // Criar gráfico de barras
    const barChart = muze
      .canvas()
      .data(dm)  // Usar DataModel original para barras
      .rows([measureCol])  // Y-axis: medida
      .columns([dimension1Col])  // X-axis: dimensão 1 (principal)
      .color(dimension2Col)  // Color encoding compartilhado (para cross-filtering)
      .title(`${dimension1Col} vs ${measureCol} (por ${dimension2Col})`)
      .layers([
        {
          mark: 'bar',
          interactive: true  // Garantir que as barras sejam interativas
        }
      ])
      .mount("#barChart");
    
    console.log('✅ Gráfico de barras criado');
    
    // Criar gráfico de pizza usando a MEDIDA selecionada
    // A pizza vai agrupar por dimension2Col e somar a medida automaticamente
    const pieChart = muze
      .canvas()
      .data(dm)  // Usar o mesmo DataModel original
      .rows([])  // Pizza não usa rows/columns
      .columns([])
      .color(dimension2Col)  // MESMO campo compartilhado (necessário para cross-filtering)
      .layers([
        {
          mark: 'arc',
          encoding: {
            angle: measureCol  // Tamanho do slice baseado na MEDIDA (soma automática por dimension2Col)
          },
          interactive: true  // Garantir que a pizza seja interativa
        }
      ])
      .title(`${measureCol} por ${dimension2Col}`)
      .mount("#pieChart");
    
    console.log('✅ Gráfico de pizza criado');
    
    // Debug: verificar aliases dos gráficos
    const barAlias = barChart.alias();
    const pieAlias = pieChart.alias();
    console.log('📊 Bar Chart Alias:', barAlias);
    console.log('📊 Pie Chart Alias:', pieAlias);
    
    // Habilitar cross-filtering bidirecional entre os dois gráficos
    // Como ambos os gráficos compartilham o campo dimension2Col no color encoding,
    // o filtro funcionará quando você selecionar em qualquer um dos gráficos
    muze.ActionModel.for(barChart, pieChart).enableCrossInteractivity({
      [barAlias]: {
        select: {
          target: {
            [pieAlias]: {
              filter: {
                sideEffects: ['filter'],  // Filtro ao selecionar no gráfico de barras
              },
            },
          },
        },
      },
      [pieAlias]: {
        select: {
          target: {
            [barAlias]: {
              filter: {
                sideEffects: ['filter'],  // Filtro ao selecionar no gráfico de pizza
              },
            },
          },
        },
      },
    });
    
    console.log('✅ Interatividade cruzada habilitada');
    console.log('✅ Ambos os gráficos renderizados e interconectados');
    
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
