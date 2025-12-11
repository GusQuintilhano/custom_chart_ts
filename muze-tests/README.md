# Muze Tests

Esta pasta contém todos os códigos de teste relacionados ao Muze Studio, incluindo os Custom Charts e testes de integração.

## Estrutura

### Custom Charts
6 Custom Charts independentes desenvolvidos com Muze Studio:
- **chart-01-encodings**: Gráfico de barras com color encoding condicional
- **chart-02-layers**: Composição complexa com múltiplas layers
- **chart-03-transforms**: Transformações DataModel com window functions
- **chart-04-interactivity**: Gráficos interconectados com filtros dinâmicos
- **chart-05-customization**: Chart com tema customizado do iFood
- **chart-06-boxplot**: Visualização estatística com quartis e outliers
- **chart-06-multi-measures**: Chart com múltiplas medidas

### `integration-tests/`
Testes de integração com o ThoughtSpot, organizados por fase:
- **A3.1-empacotamento**: Scripts e documentação para empacotamento dos charts
- **A3.2-implantacao**: Processo de implantação no ThoughtSpot
- **A3.3-teste-acesso**: Validação de acesso para diferentes perfis
- **A3.4-persistencia**: Testes de persistência em Liveboards
- **A3.5-filtros-globais**: Validação de reatividade a filtros globais
- **A3.6-manutencao**: Processo de atualização e versionamento

### `datasets/`
Datasets compartilhados usados nos testes:
- `sales_data.json`: Dados de vendas
- `statistical_data.json`: Dados estatísticos
- `hierarchical_data.json`: Dados hierárquicos

## Como Usar

### Testar um Custom Chart Localmente

```bash
cd chart-01-encodings
npm install
npm run dev
# Abrir http://localhost:8080
```

### Empacotar um Chart

```bash
cd chart-01-encodings
./build.sh
# O arquivo .zip será gerado em dist/
```

### Testes de Integração

Consulte a documentação específica em cada subpasta de `integration-tests/` para instruções detalhadas sobre cada tipo de teste.

