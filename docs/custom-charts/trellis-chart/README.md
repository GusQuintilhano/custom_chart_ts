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

### ⭐ Documento Principal (Consolidado)

- **APRENDIZADOS_COMPLETOS.md** - **Documento principal consolidado** (1.159 linhas)
  - Todas as lições fundamentais sobre Chart SDK
  - Como inicializar o Chart Context
  - Como processar dados do ThoughtSpot
  - Como renderizar gráficos
  - 9 problemas encontrados e soluções
  - Visual Properties (elements vs columnsVizPropDefinition)
  - Template completo de código
  - Deploy e configuração
  - Checklist para novos charts
  - Evolução do código

### 📚 Documentos Complementares (Detalhes Específicos)

- **COLUMNS_VIZ_PROP_DEFINITION.md**: Guia detalhado sobre configurações por coluna
  - Impacto prático
  - Migração de `elements` para `columnsVizPropDefinition`
  - Hipóteses testadas e refutadas
  
- **SOLUCAO_FORCAR_ATUALIZACAO.md**: Workaround detalhado para nova medida não aparecer
  - Tentativas de solução automática
  - Análise de charts profissionais

- **APRENDIZADOS_E_ACHADOS.md**: Histórico detalhado de desenvolvimento
  - Evolução completa do código
  - Comandos úteis
  - Limitações conhecidas

### 📖 Documentação Técnica Oficial (Referência)

- **DOCUMENTACAO_TECNICA_OFICIAL.md**: Documentação técnica consolidada
  - Consolida 4 documentos oficiais em um único arquivo
  - ThoughtSpot Charts SDK (GitHub README)
  - Custom Charts (ThoughtSpot Documentation)
  - Creating Custom Charts with TSE and D3
  - How SDK Works (Arquitetura)

**Nota:** Para começar, leia primeiro o **APRENDIZADOS_COMPLETOS.md**. Os outros documentos são para referência detalhada de tópicos específicos.

## Status

Consulte o `TASK.md` na raiz do projeto para acompanhar o status de implementação.
