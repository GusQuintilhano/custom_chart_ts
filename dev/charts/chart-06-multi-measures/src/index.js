/**
 * Custom Chart: ifood-muze-multi-measures-crosstab
 * 
 * Funcionalidade: Crosstab com múltiplas medidas nas linhas e múltiplas dimensões nas colunas
 * Cada medida tem formatação customizada (percentual, reais, números, etc.)
 */

const MEASURE_FORMATS = {
  currency: {
    formatter: (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val),
    color: '#3b82f6'
  },
  percent: {
    formatter: (val) => `${(val * 100).toFixed(1)}%`,
    color: '#22c55e'
  },
  count: {
    formatter: (val) => new Intl.NumberFormat('pt-BR').format(val),
    color: '#10b981'
  },
  decimal: {
    formatter: (val) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(val),
    color: '#f59e0b'
  },
  default: {
    formatter: (val) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val),
    color: '#EA1D2C'
  }
};

function detectMeasureType(measureName) {
  const name = measureName.toLowerCase();
  if (name.includes('cost') || name.includes('price') || name.includes('valor') || name.includes('reais') || name.includes('$')) return 'currency';
  if (name.includes('percent') || name.includes('rate') || name.includes('%') || name.includes('taxa')) return 'percent';
  if (name.includes('count') || name.includes('orders') || name.includes('total') || name.includes('quantity')) return 'count';
  if (name.includes('leg') || name.includes('assing') || name.includes('assignment')) return 'decimal';
  return 'default';
}

function formatDateValue(value) {
  if (value === null || value === undefined || value === '') return String(value || '');
  
  // Verificar se é um timestamp numérico (milissegundos desde epoch)
  // Timestamps válidos geralmente estão entre 1970 e 2100 (0 a ~4102444800000)
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (!isNaN(numValue) && numValue > 0 && numValue < 4102444800000) {
    try {
      const date = new Date(numValue);
      if (!isNaN(date.getTime())) {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        return `${months[monthIndex]}/${year}`;
      }
    } catch (e) {
      // Continuar com outras verificações
    }
  }
  
  const strValue = String(value);
  
  // Tentar detectar formato de data (YYYY-MM, YYYY-MM-DD, etc)
  const datePatterns = [
    /^\d{4}-\d{2}$/,           // YYYY-MM
    /^\d{4}-\d{2}-\d{2}$/,     // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/,   // DD/MM/YYYY
    /^\d{4}\/\d{2}\/\d{2}$/    // YYYY/MM/DD
  ];
  
  // Verificar se é um padrão de data
  const isDatePattern = datePatterns.some(pattern => pattern.test(strValue));
  
  if (isDatePattern) {
    try {
      // Tentar parsear como data
      let date;
      if (strValue.includes('-')) {
        // Formato YYYY-MM ou YYYY-MM-DD
        date = new Date(strValue + (strValue.length === 7 ? '-01' : ''));
      } else if (strValue.includes('/')) {
        // Formato DD/MM/YYYY ou YYYY/MM/DD
        const parts = strValue.split('/');
        if (parts[0].length === 4) {
          // YYYY/MM/DD
          date = new Date(strValue);
        } else {
          // DD/MM/YYYY
          date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
      
      if (date && !isNaN(date.getTime())) {
        // Formatar mês em português
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        
        // Se for apenas mês/ano (formato YYYY-MM)
        if (strValue.length === 7 || (strValue.match(/\d{4}/) && !strValue.match(/\d{2}-\d{2}/))) {
          return `${months[monthIndex]}/${year}`;
        }
        
        // Se for data completa, retornar formato DD/MM/YYYY
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${year}`;
      }
    } catch (e) {
      // Se falhar, retornar valor original
    }
  }
  
  // Verificar se contém nomes de meses em português ou inglês
  const monthNames = {
    'jan': 'Jan', 'january': 'Jan', 'janeiro': 'Jan',
    'fev': 'Fev', 'feb': 'Fev', 'february': 'Fev', 'fevereiro': 'Fev',
    'mar': 'Mar', 'march': 'Mar', 'março': 'Mar',
    'abr': 'Abr', 'apr': 'Abr', 'april': 'Abr', 'abril': 'Abr',
    'mai': 'Mai', 'may': 'Mai', 'maio': 'Mai',
    'jun': 'Jun', 'june': 'Jun', 'junho': 'Jun',
    'jul': 'Jul', 'july': 'Jul', 'julho': 'Jul',
    'ago': 'Ago', 'aug': 'Ago', 'august': 'Ago', 'agosto': 'Ago',
    'set': 'Set', 'sep': 'Set', 'september': 'Set', 'setembro': 'Set',
    'out': 'Out', 'oct': 'Out', 'october': 'Out', 'outubro': 'Out',
    'nov': 'Nov', 'november': 'Nov', 'novembro': 'Nov',
    'dez': 'Dez', 'dec': 'Dez', 'december': 'Dez', 'dezembro': 'Dez'
  };
  
  const lowerValue = strValue.toLowerCase();
  for (const [key, formatted] of Object.entries(monthNames)) {
    if (lowerValue.includes(key)) {
      // Tentar extrair ano se presente
      const yearMatch = strValue.match(/\d{4}/);
      if (yearMatch) {
        return `${formatted}/${yearMatch[0]}`;
      }
      return formatted;
    }
  }
  
  return strValue;
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
    
    // Filtrar dimensões e medidas
    const specialFields = ['__id__', 'Measure values', 'Measure names', 'measure_name', 'measure_value'];
    const dimensions = schema.filter(f => f.type === 'dimension' && !specialFields.includes(f.name));
    const measures = schema.filter(f => f.type === 'measure' && !specialFields.includes(f.name));
    
    if (dimensions.length === 0 || measures.length === 0) {
      throw new Error(`É necessário ter pelo menos 1 dimensão e 1 medida. Dimensions: ${dimensions.length}, Measures: ${measures.length}`);
    }
    
    // Criar dados pivotados
    const pivotedData = [];
    const dimensionNames = dimensions.map(d => d.name);
    const measureNames = measures.map(m => m.name);
    
    dataArray.forEach(row => {
      const dimensionValues = {};
      dimensionNames.forEach(dimName => {
        const dimIndex = schema.findIndex(s => s.name === dimName);
        if (dimIndex >= 0 && dimIndex < row.length) {
          const rawValue = row[dimIndex];
          // Aplicar formatação de data/mês nas dimensões (detecta timestamps automaticamente)
          const formattedValue = formatDateValue(rawValue);
          dimensionValues[dimName] = formattedValue;
        }
      });
      
      measureNames.forEach(measureName => {
        const measureIndex = schema.findIndex(s => s.name === measureName);
        if (measureIndex >= 0 && measureIndex < row.length) {
          const measureValue = row[measureIndex];
          const numericValue = typeof measureValue === 'number' ? measureValue : parseFloat(measureValue);
          
          if (!isNaN(numericValue)) {
            // Garantir que measure_name seja sempre uma string válida
            const measureNameStr = measureName && String(measureName).trim() ? String(measureName).trim() : 'Medida';
            
            pivotedData.push({
              ...dimensionValues,
              'measure_name': measureNameStr,
              'measure_value': numericValue
            });
          }
        }
      });
    });
    
    if (pivotedData.length === 0) {
      throw new Error('Nenhum dado pivotado válido foi criado.');
    }
    
    // Garantir que todos os valores de measure_name sejam strings válidas
    pivotedData.forEach(row => {
      if (!row.measure_name || row.measure_name === 'NaN' || String(row.measure_name).trim() === '') {
        console.warn('⚠️ Encontrado measure_name inválido:', row.measure_name);
        // Tentar encontrar o nome da medida original
        const foundMeasure = measures.find(m => {
          const measureIndex = schema.findIndex(s => s.name === m.name);
          return measureIndex >= 0;
        });
        row.measure_name = foundMeasure ? foundMeasure.name : 'Medida';
      }
      row.measure_name = String(row.measure_name).trim();
    });
    
    // Criar DataModel
    const DataModel = muze.DataModel;
    const pivotedSchema = [
      ...dimensions.map(d => ({ name: d.name, type: 'dimension' })),
      { name: 'measure_name', type: 'dimension' },
      { name: 'measure_value', type: 'measure' }
    ];
    
    console.log('📊 Schema pivotado (ordem):', pivotedSchema.map((s, idx) => `${idx}: ${s.name} (${s.type})`));
    
    // Garantir que todos os valores sejam válidos antes de criar o DataModel
    // Usar objetos (formato preferido pelo Muze)
    const validatedPivotedData = pivotedData.map((row, rowIdx) => {
      const validatedRow = {};
      
      pivotedSchema.forEach(field => {
        let value = row[field.name];
        
        if (field.name === 'measure_name') {
          // Garantir que measure_name seja sempre uma string válida
          if (!value || value === 'NaN' || String(value).trim() === '') {
            value = 'Medida';
          }
          value = String(value).trim();
        } else if (field.type === 'dimension') {
          // Garantir que dimensões sejam strings válidas
          if (value === null || value === undefined || value === 'NaN') {
            value = '';
          }
          value = String(value);
        } else if (field.type === 'measure') {
          // Garantir que medidas sejam números válidos
          const numValue = typeof value === 'number' ? value : parseFloat(value);
          if (isNaN(numValue)) {
            console.warn(`⚠️ Linha ${rowIdx}: measure_value inválido para ${row.measure_name}:`, value);
            value = 0;
          } else {
            value = numValue;
          }
        }
        
        validatedRow[field.name] = value;
      });
      
      // Log da primeira linha para debug
      if (rowIdx === 0) {
        console.log('📊 Primeira linha validada (objeto):', validatedRow);
        console.log('📊 Mapeamento campo->valor:', Object.keys(validatedRow).map(k => `${k}(${pivotedSchema.find(s => s.name === k)?.type})=${validatedRow[k]}`));
      }
      
      return validatedRow;
    });
    
    let parsedData;
    try {
      // Usar formato de objeto (formato preferido pelo Muze)
      parsedData = DataModel.loadDataSync(validatedPivotedData, pivotedSchema);
      console.log('✅ Dados carregados com sucesso usando formato objeto');
    } catch (error) {
      console.warn('⚠️ Erro ao carregar dados como objeto, tentando formato array:', error);
      // Fallback para array se objeto falhar
      const pivotedDataArray = validatedPivotedData.map(row => pivotedSchema.map(field => row[field.name]));
      parsedData = DataModel.loadDataSync(pivotedDataArray, pivotedSchema);
      console.log('✅ Dados carregados com sucesso usando formato array (fallback)');
    }
    
    let dmPivoted = new DataModel(parsedData);
    dmPivoted = dmPivoted.sort(['measure_name'], 'asc');
    
    // Debug: verificar nomes das medidas (usar pivotedData original que ainda tem objetos)
    const uniqueMeasureNamesDebug = [...new Set(pivotedData.map(row => row.measure_name))];
    console.log('📊 Nomes das medidas encontrados:', uniqueMeasureNamesDebug);
    console.log('📊 Total de linhas pivotadas:', pivotedData.length);
    
    // Verificar dados no DataModel
    const dmData = dmPivoted.getData();
    console.log('📊 Schema do DataModel final:', dmData.schema.map((s, idx) => `${idx}: ${s.name} (${s.type})`));
    
    if (dmData.data && dmData.data.length > 0) {
      console.log('📊 Primeira linha do DataModel:', dmData.data[0]);
      console.log('📊 Primeiras 5 linhas do DataModel:', dmData.data.slice(0, 5));
      
      // Verificar valores únicos de measure_value
      const measureValueIdx = dmData.schema.findIndex(s => s.name === 'measure_value');
      const measureNameIdx = dmData.schema.findIndex(s => s.name === 'measure_name');
      
      console.log('📊 Índice de measure_name no schema:', measureNameIdx);
      console.log('📊 Índice de measure_value no schema:', measureValueIdx);
      
      // Verificar se os índices estão corretos
      if (measureValueIdx >= 0 && measureNameIdx >= 0) {
        // Verificar algumas linhas para garantir que os valores estão corretos
        // Os objetos Wt podem ter propriedades .value, .rawValue, ou serem acessíveis diretamente
        dmData.data.slice(0, 3).forEach((row, idx) => {
          const measureNameObj = row[measureNameIdx];
          const measureValueObj = row[measureValueIdx];
          
          // Tentar extrair valores de diferentes formas
          const measureName = measureNameObj?.value ?? measureNameObj?.rawValue ?? measureNameObj?.toString?.() ?? measureNameObj;
          const measureValue = measureValueObj?.value ?? measureValueObj?.rawValue ?? (typeof measureValueObj === 'number' ? measureValueObj : parseFloat(measureValueObj));
          
          console.log(`📊 Linha ${idx}:`);
          console.log(`  - measure_name objeto:`, measureNameObj);
          console.log(`  - measure_name extraído: "${measureName}"`);
          console.log(`  - measure_value objeto:`, measureValueObj);
          console.log(`  - measure_value extraído: ${measureValue} (tipo: ${typeof measureValue})`);
        });
        
        // Extrair valores usando diferentes métodos
        const measureValues = dmData.data.map(row => {
          const measureValueObj = measureValueIdx >= 0 && measureValueIdx < row.length ? row[measureValueIdx] : null;
          if (!measureValueObj) return null;
          
          // Tentar extrair valor de diferentes formas
          const value = measureValueObj?.value ?? measureValueObj?.rawValue ?? (typeof measureValueObj === 'number' ? measureValueObj : parseFloat(measureValueObj));
          return (typeof value === 'number' && !isNaN(value)) ? value : null;
        }).filter(v => v !== null);
        
        console.log('📊 Valores de measure_value (amostra):', measureValues.slice(0, 10));
        console.log('📊 Valores únicos de measure_value:', [...new Set(measureValues)].slice(0, 10));
        if (measureValues.length > 0) {
          console.log('📊 Min/Max de measure_value:', Math.min(...measureValues), '/', Math.max(...measureValues));
        }
        
        // Verificar estrutura por medida
        const valuesByMeasure = {};
        dmData.data.forEach(row => {
          const measureNameObj = row[measureNameIdx];
          const measureValueObj = row[measureValueIdx];
          
          const measureName = measureNameObj?.value ?? measureNameObj?.rawValue ?? measureNameObj?.toString?.() ?? measureNameObj;
          const measureValue = measureValueObj?.value ?? measureValueObj?.rawValue ?? (typeof measureValueObj === 'number' ? measureValueObj : parseFloat(measureValueObj));
          
          if (measureName && measureValue !== null && typeof measureValue === 'number' && !isNaN(measureValue)) {
            if (!valuesByMeasure[measureName]) {
              valuesByMeasure[measureName] = [];
            }
            valuesByMeasure[measureName].push(measureValue);
          }
        });
        console.log('📊 Valores por medida:', Object.keys(valuesByMeasure).map(m => ({
          medida: m,
          valores: valuesByMeasure[m].slice(0, 3),
          min: Math.min(...valuesByMeasure[m]),
          max: Math.max(...valuesByMeasure[m])
        })));
      } else {
        console.error('❌ ERRO: Não foi possível encontrar measure_name ou measure_value no schema!');
        console.error('📊 Schema completo:', dmData.schema);
      }
    }
    
    // Configurar formatações
    const measureFormats = {};
    measures.forEach(measure => {
      measureFormats[measure.name] = MEASURE_FORMATS[detectMeasureType(measure.name)];
    });
    
    const colorRange = measures.map(m => {
      const format = measureFormats[m.name];
      return format ? format.color : '#EA1D2C';
    });
    
    // Debug: verificar valores antes de renderizar
    const measureValueField = pivotedSchema.find(s => s.name === 'measure_value');
    let globalMin = 0;
    let globalMax = 0;
    if (measureValueField) {
      const valuesBeforeRender = validatedPivotedData.map(r => r['measure_value']).filter(v => typeof v === 'number' && !isNaN(v));
      console.log('📊 Valores únicos de measure_value antes de renderizar:', 
        [...new Set(valuesBeforeRender)].sort((a, b) => a - b).slice(0, 10));
      if (valuesBeforeRender.length > 0) {
        globalMin = Math.min(...valuesBeforeRender);
        globalMax = Math.max(...valuesBeforeRender);
        console.log('📊 Min/Max de measure_value (global):', globalMin, '/', globalMax);
      }
    }
    
    // Garantir que globalMax seja válido (se for 0, usar 1 como fallback)
    if (globalMax <= 0) {
      globalMax = 1;
      console.warn('⚠️ globalMax inválido, usando 1 como fallback');
    }
    
    // Validar DataModel antes de renderizar
    if (!dmPivoted) {
      throw new Error('DataModel não foi criado corretamente');
    }
    
    const dmDataCheck = dmPivoted.getData();
    if (!dmDataCheck || !dmDataCheck.data || dmDataCheck.data.length === 0) {
      throw new Error('DataModel está vazio ou inválido');
    }
    
    console.log('✅ DataModel validado:', {
      totalLinhas: dmDataCheck.data.length,
      schema: dmDataCheck.schema.map(s => s.name)
    });
    
    // Calcular domínio Y compartilhado (sempre começar em 0)
    const sharedYDomain = [0, globalMax * 1.1];
    console.log('📐 Domínio Y compartilhado:', sharedYDomain);
    
    // Verificar se o container existe
    const chartContainer = document.getElementById('chart');
    if (!chartContainer) {
      throw new Error('Container #chart não encontrado no DOM');
    }
    
    console.log('🎨 Iniciando renderização do gráfico...');
    
    // Renderizar gráfico único com .rows() para criar trellis chart
    try {
    muze
      .canvas()
      .data(dmPivoted)
      .rows(['measure_name'])
      .columns(dimensionNames)
      .layers([{
        mark: 'bar',
        encoding: {
            y: {
              field: 'measure_value',
            },
            y0: 0
          },
          interactive: true
      }])
      .color({
        field: 'measure_name',
        range: colorRange
      })
      .config({
        facets: {
          normalize: false
        },
        showHeaders: true,
        columns: {
          headers: {
            show: true,
            showLabels: true,
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
              fill: '#1a1a1a',
              fontWeight: 600
            }
          },
          showAllLabels: true
        },
        rows: {
          headers: {
            show: true,
            showLabels: true,
            showAllLabels: true,
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
              fill: '#1a1a1a',
              fontWeight: 600
            }
          }
        },
        axes: {
          y: {
            tickFormat: (dataInfo) => {
              if (!dataInfo || dataInfo.rawValue === undefined || dataInfo.rawValue === null) return '';
              // Formatação padrão
              return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(dataInfo.rawValue);
            },
            showAxisName: true,
            style: { fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fill: '#666666' },
            showLabels: true,
            scale: {
              type: 'linear',
              zero: true,
              domain: sharedYDomain,
              nice: false
            }
          },
          x: {
            showAxisName: false,
            style: { fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fill: '#666666' },
            showLabels: true,
            tickFormat: (dataInfo) => {
              if (!dataInfo) return '';
              const rawValue = dataInfo.rawValue !== undefined && dataInfo.rawValue !== null 
                ? dataInfo.rawValue 
                : (dataInfo.formattedValue !== undefined && dataInfo.formattedValue !== null ? dataInfo.formattedValue : '');
              
              if (rawValue === '' || rawValue === null || rawValue === undefined) return '';
              
              return formatDateValue(rawValue);
            }
          }
        },
        borders: {
          top: { show: true, stroke: '#e0e0e0' },
          bottom: { show: true, stroke: '#e0e0e0' },
          left: { show: true, stroke: '#e0e0e0' },
          right: { show: false }
        },
        interaction: {
          tooltip: {
            show: true
            // Remover formatter customizado para evitar erros
            // O Muze usará o tooltip padrão que funciona corretamente
          }
        }
      })
      .title('Crosstab Multi-Medidas')
      .subtitle(`Comparação de ${measures.length} medidas por ${dimensions.length} dimensões`)
      .mount("#chart");
      
      console.log('✅ Gráfico renderizado com sucesso');
    } catch (renderError) {
      console.error('❌ Erro ao renderizar gráfico:', renderError);
      throw renderError;
    }
    
    // WORKAROUND: Corrigir labels "NaN" e ajustar proporções das barras
    const uniqueMeasureNamesForFix = [...new Set(validatedPivotedData.map(r => r['measure_name']))].filter(m => m && m !== 'NaN');
    console.log('🔧 Preparando correção de labels. Medidas:', uniqueMeasureNamesForFix);
    
    // Organizar dados por medida para o workaround de proporções
    const dataByMeasure = {};
    uniqueMeasureNamesForFix.forEach(measureName => {
      const measureData = validatedPivotedData
        .filter(r => r['measure_name'] === measureName)
        .sort((a, b) => {
          const dimName = dimensionNames[0];
          return String(a[dimName]).localeCompare(String(b[dimName]));
        });
      
      dataByMeasure[measureName] = measureData.map(r => r['measure_value']).filter(v => typeof v === 'number' && !isNaN(v));
    });
    
    function fixLabels(attempt = 1) {
      try {
        const chartElement = document.getElementById('chart');
        if (!chartElement) {
          if (attempt < 5) {
            setTimeout(() => fixLabels(attempt + 1), 500);
          }
          return;
        }
        
        const svg = chartElement.querySelector('svg');
        if (!svg) {
          if (attempt < 5) {
            setTimeout(() => fixLabels(attempt + 1), 500);
          }
          return;
        }
        
        // Procurar por elementos de texto que contenham "NaN"
        const allTextElements = Array.from(chartElement.querySelectorAll('text, tspan'));
        const nanElements = [];
        
        allTextElements.forEach((el) => {
          const text = (el.textContent || '').trim();
          if (text === 'NaN' || (text.includes('NaN') && text.length < 10)) {
            nanElements.push(el);
          }
        });
        
        console.log(`🔧 Tentativa ${attempt}: Encontrados ${nanElements.length} elementos com "NaN"`);
        
        if (nanElements.length > 0) {
          // Ordenar elementos por posição Y (de cima para baixo) para corresponder às medidas
          nanElements.sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            return rectA.top - rectB.top;
          });
          
          nanElements.forEach((el, idx) => {
            if (idx < uniqueMeasureNamesForFix.length) {
              const oldText = el.textContent;
              el.textContent = uniqueMeasureNamesForFix[idx];
              console.log(`✅ Label ${idx} corrigido: "${oldText}" → "${uniqueMeasureNamesForFix[idx]}"`);
            }
          });
        } else if (attempt < 5) {
          // Se não encontrou NaN mas ainda há tentativas, tentar novamente
          setTimeout(() => fixLabels(attempt + 1), 500);
        }
      } catch (error) {
        console.error('❌ Erro no workaround de labels:', error);
        if (attempt < 5) {
          setTimeout(() => fixLabels(attempt + 1), 500);
        }
      }
    }
    
    // Usar MutationObserver e múltiplas tentativas
    const chartElement = document.getElementById('chart');
    if (chartElement) {
      const observer = new MutationObserver(() => {
        fixLabels(1);
      });
      
      observer.observe(chartElement, { childList: true, subtree: true });
      
      // Múltiplas tentativas com delays diferentes
      setTimeout(() => fixLabels(1), 1000);
      setTimeout(() => fixLabels(1), 2000);
      setTimeout(() => {
        fixLabels(1);
        observer.disconnect();
      }, 3000);
    }
    
    // WORKAROUND: Ajustar proporções das barras baseado nos dados reais
    function fixBarProportions(attempt = 1) {
      try {
        const chartElement = document.getElementById('chart');
        if (!chartElement) {
          console.log(`⚠️ Tentativa ${attempt}: Container não encontrado`);
          if (attempt < 5) {
            setTimeout(() => fixBarProportions(attempt + 1), 500);
          }
          return;
        }
        
        const svg = chartElement.querySelector('svg');
        if (!svg) {
          console.log(`⚠️ Tentativa ${attempt}: SVG não encontrado`);
          if (attempt < 5) {
            setTimeout(() => fixBarProportions(attempt + 1), 500);
          }
          return;
        }
        
        // Verificar estrutura do SVG
        const svgViewBox = svg.getAttribute('viewBox');
        const svgWidthAttr = svg.getAttribute('width');
        const svgHeightAttr = svg.getAttribute('height');
        const svgRectCheck = svg.getBoundingClientRect();
        
        console.log('🔍 Estrutura do SVG:', {
          viewBox: svgViewBox,
          width: svgWidthAttr,
          height: svgHeightAttr,
          boundingRect: `${svgRectCheck.width.toFixed(0)}x${svgRectCheck.height.toFixed(0)}`,
          children: svg.children.length
        });
        
        // Buscar em toda a estrutura do chart, não apenas no SVG direto
        const allRects = Array.from(chartElement.querySelectorAll('rect'));
        const allPaths = Array.from(chartElement.querySelectorAll('path'));
        const allGroups = Array.from(chartElement.querySelectorAll('g'));
        
        console.log(`🔍 Total de elementos encontrados:`, {
          rects: allRects.length,
          paths: allPaths.length,
          groups: allGroups.length
        });
        
        // Buscar barras - usar critérios mais flexíveis
        // Primeiro, tentar encontrar todas as barras possíveis
        let bars = [];
        
        // Filtrar rects que parecem ser barras (altura e largura razoáveis)
        bars = allRects.filter(rect => {
          const h = Math.abs(parseFloat(rect.getAttribute('height')) || 0);
          const w = Math.abs(parseFloat(rect.getAttribute('width')) || 0);
          
          // Critérios básicos: deve ter altura e largura significativas
          // Mas não muito grandes (não são backgrounds)
          const isValidBar = h > 1 && w > 1 && h < 1000 && w < 1000;
          
          return isValidBar;
        });
        
        // Se não encontrou barras suficientes, buscar em grupos também
        if (bars.length < 8) {
          allGroups.forEach((group, gIdx) => {
            const groupRects = Array.from(group.querySelectorAll('rect'));
            groupRects.forEach(rect => {
              const h = Math.abs(parseFloat(rect.getAttribute('height')) || 0);
              const w = Math.abs(parseFloat(rect.getAttribute('width')) || 0);
              if (h > 1 && w > 1 && h < 1000 && w < 1000 && !bars.includes(rect)) {
                bars.push(rect);
              }
            });
          });
        }
        
        // Remover duplicatas
        bars = [...new Set(bars)];
        
        console.log(`🔍 Barras válidas encontradas: ${bars.length}`);
        
        if (bars.length === 0) {
          // Log da estrutura completa para debug
          console.log('🔍 Estrutura completa do chart:', {
            innerHTML: chartElement.innerHTML.substring(0, 500),
            svgChildren: Array.from(svg.children).map(c => c.tagName).join(', ')
          });
        }
        
        // Obter dimensões do container do gráfico (não do SVG diretamente)
        // O SVG pode ter width/height 100% e estar dentro de um container com dimensões reais
        const containerRect = chartElement.getBoundingClientRect();
        let svgHeight = containerRect.height;
        let svgWidth = containerRect.width;
        
        // Se o container não tiver dimensões válidas, tentar o SVG
        if (!svgHeight || svgHeight < 10) {
          const svgRect = svg.getBoundingClientRect();
          svgHeight = svgRect.height || parseFloat(svg.getAttribute('height')) || 600;
        }
        if (!svgWidth || svgWidth < 10) {
          const svgRect = svg.getBoundingClientRect();
          svgWidth = svgRect.width || parseFloat(svg.getAttribute('width')) || 500;
        }
        
        // Garantir dimensões mínimas razoáveis
        if (svgHeight < 100) svgHeight = 600;
        if (svgWidth < 100) svgWidth = 500;
        
        console.log(`📐 Container: ${containerRect.width.toFixed(0)}x${containerRect.height.toFixed(0)}, SVG: ${svgWidth.toFixed(0)}x${svgHeight.toFixed(0)}`);
        
        // Verificar viewBox para entender o sistema de coordenadas
        // IMPORTANTE: Se o SVG tem viewBox, as coordenadas dos elementos estão no sistema do viewBox
        const viewBox = svg.getAttribute('viewBox');
        let coordSystemHeight = svgHeight; // Altura do sistema de coordenadas
        let coordSystemWidth = svgWidth;   // Largura do sistema de coordenadas
        
        // Verificar se há transformações ou escalas aplicadas
        const svgActualRect = svg.getBoundingClientRect();
        const scaleX = svgActualRect.width > 0 ? svgWidth / svgActualRect.width : 1;
        const scaleY = svgActualRect.height > 0 ? svgHeight / svgActualRect.height : 1;
        
        if (viewBox) {
          const vbParts = viewBox.split(/\s+/).map(Number);
          const vbX = vbParts[0] || 0;
          const vbY = vbParts[1] || 0;
          const vbWidth = vbParts[2];
          const vbHeight = vbParts[3];
          
          // Se o viewBox existe, usar suas dimensões para o sistema de coordenadas
          // Mas também considerar o scale se houver diferença
          if (vbWidth && vbHeight) {
            // Se o SVG visual é muito diferente do viewBox, pode haver escala
            // Mas vamos usar o viewBox como sistema de coordenadas
            coordSystemHeight = vbHeight;
            coordSystemWidth = vbWidth;
            console.log(`📐 SVG com viewBox: sistema ${coordSystemWidth.toFixed(0)}x${coordSystemHeight.toFixed(0)}, visual ${svgWidth.toFixed(0)}x${svgHeight.toFixed(0)}, scale ${scaleX.toFixed(2)}x${scaleY.toFixed(2)}`);
          } else {
            console.log(`📐 SVG com viewBox inválido, usando dimensões visuais`);
          }
        } else {
          // Sem viewBox, usar as dimensões do container como sistema de coordenadas
          console.log(`📐 SVG sem viewBox: ${svgWidth.toFixed(0)}x${svgHeight.toFixed(0)}, scale ${scaleX.toFixed(2)}x${scaleY.toFixed(2)}`);
        }
        
        console.log(`📐 Sistema de coordenadas final: ${coordSystemWidth.toFixed(0)}x${coordSystemHeight.toFixed(0)}`);
        
        if (bars.length === 0) {
          console.warn(`⚠️ Tentativa ${attempt}: Nenhuma barra encontrada`);
          if (attempt < 5) {
            setTimeout(() => fixBarProportions(attempt + 1), 500);
          }
          return;
        }
        
        // Calcular altura de cada facet usando o sistema de coordenadas
        const numFacets = uniqueMeasureNamesForFix.length;
        const facetHeight = coordSystemHeight / numFacets;
        
        console.log(`📊 ${numFacets} facets, altura por facet: ${facetHeight.toFixed(0)}`);
        console.log(`📊 Domínio compartilhado: [${sharedYDomain[0]}, ${sharedYDomain[1].toFixed(4)}]`);
        
        // Agrupar barras por facet (baseado na posição Y)
        const barsByFacet = {};
        bars.forEach(bar => {
          const y = parseFloat(bar.getAttribute('y')) || 0;
          const facetIdx = Math.min(Math.max(0, Math.floor(y / facetHeight)), numFacets - 1);
          
          if (!barsByFacet[facetIdx]) barsByFacet[facetIdx] = [];
          barsByFacet[facetIdx].push(bar);
        });
        
        console.log(`📊 Barras agrupadas por facet:`, Object.keys(barsByFacet).map(k => `${k}: ${barsByFacet[k].length}`).join(', '));
        
        // Ordenar facets por posição Y média (de cima para baixo) para garantir ordem correta
        const facetKeys = Object.keys(barsByFacet).map(k => parseInt(k));
        facetKeys.sort((a, b) => {
          const barsA = barsByFacet[a];
          const barsB = barsByFacet[b];
          if (barsA.length === 0 || barsB.length === 0) return a - b;
          
          const avgYA = barsA.reduce((sum, bar) => sum + parseFloat(bar.getAttribute('y') || 0), 0) / barsA.length;
          const avgYB = barsB.reduce((sum, bar) => sum + parseFloat(bar.getAttribute('y') || 0), 0) / barsB.length;
          return avgYA - avgYB;
        });
        
        console.log(`📊 Facets ordenados por Y:`, facetKeys.join(', '));
        console.log(`📊 Medidas disponíveis:`, uniqueMeasureNamesForFix);
        
        // Ajustar cada facet na ordem correta
        let totalAdjusted = 0;
        facetKeys.forEach((facetIdx, orderIdx) => {
          if (facetIdx >= uniqueMeasureNamesForFix.length) {
            console.warn(`⚠️ Facet index ${facetIdx} fora do range, pulando`);
            return;
          }
          
          // Usar a ordem visual (orderIdx) para mapear para a medida
          // Mas primeiro tentar usar o facetIdx original
          const measureName = uniqueMeasureNamesForFix[facetIdx] || uniqueMeasureNamesForFix[orderIdx];
          const measureValues = dataByMeasure[measureName] || [];
          
          console.log(`📊 Facet ${facetIdx} (${measureName}): ${measureValues.length} valores esperados`);
          
          if (measureValues.length === 0) {
            console.warn(`⚠️ Sem valores para ${measureName}`);
            return;
          }
          
          const facetBars = barsByFacet[facetIdx];
          
          // Ordenar barras por X (da esquerda para direita)
          facetBars.sort((a, b) => {
            const xA = parseFloat(a.getAttribute('x')) || 0;
            const xB = parseFloat(b.getAttribute('x')) || 0;
            return xA - xB;
          });
          
          // Calcular área útil do facet
          const facetTop = facetHeight * facetIdx;
          const facetBottom = facetTop + facetHeight;
          const paddingTop = facetHeight * 0.1; // 10% de padding no topo
          const paddingBottom = facetHeight * 0.15; // 15% de padding na base
          const chartAreaHeight = facetHeight - paddingTop - paddingBottom; // Altura disponível para as barras
          
          // O zero de cada facet está na parte inferior da área de plotagem
          const zeroY = facetBottom - paddingBottom;
          
          console.log(`📊 Facet ${facetIdx}: top=${facetTop.toFixed(0)}, bottom=${facetBottom.toFixed(0)}, zeroY=${zeroY.toFixed(0)}, areaHeight=${chartAreaHeight.toFixed(0)}`);
          
          // Ajustar cada barra proporcionalmente
          facetBars.forEach((bar, barIdx) => {
            if (barIdx < measureValues.length) {
              const barValue = measureValues[barIdx];
              if (typeof barValue !== 'number' || isNaN(barValue)) {
                console.warn(`⚠️ Barra ${barIdx}: valor inválido`, barValue);
                return;
              }
              
              const oldHeight = parseFloat(bar.getAttribute('height')) || 0;
              const oldY = parseFloat(bar.getAttribute('y')) || 0;
              
              // Calcular nova altura baseada no valor real vs globalMax
              const newHeight = (barValue / sharedYDomain[1]) * chartAreaHeight;
              
              // Calcular nova posição Y: a base da barra (y + height) deve ficar no zeroY
              // Então: newY + newHeight = zeroY, logo: newY = zeroY - newHeight
              const newY = zeroY - newHeight;
              
              // Sempre aplicar mudanças para garantir proporções corretas
              bar.setAttribute('height', Math.max(2, newHeight));
              bar.setAttribute('y', newY);
              totalAdjusted++;
              
              if (barIdx < 3 || facetIdx === 0) { // Log das primeiras 3 barras ou do primeiro facet
                console.log(`  ✅ Barra ${barIdx} (facet ${facetIdx}): valor=${barValue.toFixed(4)}, altura ${oldHeight.toFixed(1)} → ${newHeight.toFixed(1)}, y ${oldY.toFixed(1)} → ${newY.toFixed(1)}`);
                console.log(`     Cálculo: (${barValue.toFixed(4)} / ${sharedYDomain[1].toFixed(4)}) * ${chartAreaHeight.toFixed(1)} = ${newHeight.toFixed(1)}`);
              }
            }
          });
        });
        
        console.log(`✅ ${totalAdjusted} barras ajustadas proporcionalmente`);
      } catch (error) {
        console.error('❌ Erro ao ajustar proporções:', error);
        console.error(error.stack);
        if (attempt < 5) {
          setTimeout(() => fixBarProportions(attempt + 1), 500);
        }
      }
    }
    
    // Função para aplicar todas as correções
    function applyAllFixes() {
      console.log('🔧 Aplicando todas as correções...');
      fixLabels(1);
      setTimeout(() => fixBarProportions(1), 300);
    }
    
    // Executar ajuste de proporções após renderização (múltiplas tentativas)
    setTimeout(() => {
      console.log('🔧 Tentativa 1 de ajuste de proporções (2s)');
      applyAllFixes();
    }, 2000);
    
    setTimeout(() => {
      console.log('🔧 Tentativa 2 de ajuste de proporções (4s)');
      applyAllFixes();
    }, 4000);
    
    setTimeout(() => {
      console.log('🔧 Tentativa 3 de ajuste de proporções (6s)');
      applyAllFixes();
    }, 6000);
    
    // Observar mudanças de tamanho do gráfico e re-aplicar correções
    // Aguardar um pouco para garantir que o elemento existe
    setTimeout(() => {
      const chartElement = document.getElementById('chart');
      if (chartElement && window.ResizeObserver) {
        let resizeTimeout;
        const resizeObserver = new ResizeObserver((entries) => {
          // Debounce: aguardar 500ms após o último redimensionamento
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            console.log('📐 Gráfico redimensionado, re-aplicando correções...');
            applyAllFixes();
          }, 500);
        });
        
        resizeObserver.observe(chartElement);
        console.log('👀 Observador de redimensionamento configurado');
        
        // Armazenar referência globalmente para limpeza se necessário
        window._muzeResizeObserver = resizeObserver;
      } else if (!window.ResizeObserver) {
        console.warn('⚠️ ResizeObserver não disponível, usando fallback para window resize');
        let resizeTimeout;
        const resizeHandler = () => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            console.log('📐 Janela redimensionada, re-aplicando correções...');
            applyAllFixes();
          }, 500);
        };
        window.addEventListener('resize', resizeHandler);
        window._muzeResizeHandler = resizeHandler;
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Erro:', error);
    document.getElementById('chart').innerHTML = 
      `<div style="padding: 20px; color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">
        <h4 style="margin: 0 0 10px 0;">❌ Erro ao renderizar gráfico</h4>
        <p style="margin: 0;">${error.message}</p>
      </div>`;
  }
}

renderCustomChart();
