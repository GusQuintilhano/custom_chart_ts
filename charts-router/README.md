# Charts Router

Servidor de roteamento para múltiplos gráficos customizados do ThoughtSpot.

## Estrutura

Este servidor roteia diferentes gráficos em paths específicos:

- `/trellis` → Trellis Chart
- `/boxplot` → Boxplot Chart
- `/health` → Health check endpoint

## Build e Deploy

O Railway executa automaticamente:

1. Build do `trellis-chart`
2. Build do `boxplot-chart`
3. Build do `charts-router`
4. Inicia o servidor Express

## Desenvolvimento Local

```bash
# Instalar dependências dos charts
cd ../trellis-chart && npm install
cd ../boxplot-chart && npm install

# Instalar dependências do router
cd ../charts-router && npm install

# Build dos charts
cd ../trellis-chart && npm run build
cd ../boxplot-chart && npm run build

# Build e start do router
cd ../charts-router && npm run build && npm start
```

O servidor estará disponível em `http://localhost:3000`

## URLs de Produção

- Trellis Chart: `https://ts-custom-charts-production.up.railway.app/trellis`
- Boxplot Chart: `https://ts-custom-charts-production.up.railway.app/boxplot`

