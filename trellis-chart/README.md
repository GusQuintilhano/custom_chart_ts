# Trellis Chart

Este é o Trellis Chart desenvolvido usando o ThoughtSpot Chart SDK e Muze Studio.

## Visão Geral

Este projeto implementa um chart customizado que permite visualizar múltiplas medidas simultaneamente, hospedado externamente no Railway.

## Estrutura

- `src/`: Código fonte TypeScript
  - `index.ts`: Implementação principal do Chart SDK
  - `test-local.ts`: Código para testes locais
- `dist/`: Build de produção (gerado automaticamente)
- `deploy.sh`: Script de deploy para Railway

## Tecnologias

- **ThoughtSpot Chart SDK**: Framework para criação de charts customizados
- **Muze Studio**: Biblioteca de visualização de dados
- **TypeScript**: Linguagem de programação
- **Vite**: Build tool
- **Railway**: Plataforma de hospedagem

## Deploy

O chart está hospedado no Railway. Para fazer deploy:

```bash
./deploy.sh
```

## Documentação

Toda a documentação técnica, aprendizados e guias estão disponíveis em [`../docs/sdk/exemplos/trellis-chart/`](../docs/sdk/exemplos/trellis-chart/).

## Status

Consulte o `TASK.md` na raiz do projeto para acompanhar o status de implementação.
