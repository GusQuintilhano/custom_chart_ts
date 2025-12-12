# Trellis Chart

Este é o Trellis Chart desenvolvido usando o ThoughtSpot Chart SDK e Muze Studio.

## Visão Geral

Este projeto implementa um chart customizado que permite visualizar múltiplas medidas simultaneamente, hospedado externamente no Railway.

## Estrutura

- `src/`: Código fonte TypeScript
  - `index.ts`: Implementação principal do Chart SDK
  - `test-local.ts`: Código para testes locais
- `docs/`: Documentação técnica e aprendizados
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

Toda a documentação técnica está disponível nesta pasta (`docs/custom-charts/trellis-chart/`):

- **APRENDIZADOS_COMPLETOS.md** ⭐ - **Documento principal consolidado**
  - Todas as lições fundamentais sobre Chart SDK
  - Como inicializar o Chart Context
  - Como processar dados do ThoughtSpot
  - Como renderizar gráficos
  - Template completo de código
  - Checklist para novos charts

- **APRENDIZADOS_E_ACHADOS.md**: Aprendizados e achados durante o desenvolvimento
- **ABA_CONFIGURE.md**: Guia completo sobre como acessar e usar a aba Configure
- **COLUMNS_VIZ_PROP_DEFINITION.md**: Guia completo sobre columnsVizPropDefinition (impacto, migração e hipóteses)
- **SOLUCAO_FORCAR_ATUALIZACAO.md**: Soluções para forçar atualização quando nova medida é adicionada
- Documentação técnica do SDK (arquivos numerados 01-04)

## Status

Consulte o `TASK.md` na raiz do projeto para acompanhar o status de implementação.
