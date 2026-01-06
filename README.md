# Custom Charts SDK - iFood

Charts desenvolvidos com ThoughtSpot Chart SDK para visualização de dados no ThoughtSpot.

## 📊 Charts Disponíveis

### Trellis Chart

- **Localização:** [`trellis-chart/`](./trellis-chart/)
- **URL:** `https://ts-custom-charts-production.up.railway.app/trellis`
- **Tipo:** Chart SDK
- **Descrição:** Chart que permite visualizar múltiplas medidas simultaneamente em formato "crosschart" (trellis)

### Boxplot Chart

- **Localização:** [`boxplot-chart/`](./boxplot-chart/)
- **URL:** `https://ts-custom-charts-production.up.railway.app/boxplot`
- **Tipo:** Chart SDK
- **Descrição:** Boxplot para visualização de distribuições estatísticas com quartis, mediana e outliers

## 🚀 Integração

Estes charts são servidos via **Railway** usando roteamento por path e integrados com o ThoughtSpot.

### Estrutura de Roteamento

O servidor `charts-router/` roteia múltiplos gráficos na mesma URL base:
- `/trellis` → Trellis Chart
- `/boxplot` → Boxplot Chart

### Código Compartilhado

Utilitários e funções comuns estão em `shared/`:
- `shared/utils/` - Formatters, calculations, logger, statistical
- `shared/config/` - Inicialização do Chart SDK
- `shared/types/` - Tipos TypeScript comuns

## 📚 Documentação

Documentação completa disponível em [`docs/sdk/`](./docs/sdk/):
- **Aprendizados**: [`docs/sdk/aprendizados/`](./docs/sdk/aprendizados/)
- **Guias**: [`docs/sdk/guias/`](./docs/sdk/guias/)
- **Exemplos**: [`docs/sdk/exemplos/`](./docs/sdk/exemplos/)
- **Referência**: [`docs/sdk/referencia/`](./docs/sdk/referencia/)

## 📄 Licença

Veja [LICENSE](./LICENSE) para mais detalhes.
