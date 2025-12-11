# Projeto de Testes Muze Studio - iFood

## Visão Geral

Validação completa das capacidades do Muze Studio através da criação de 6 Custom Charts independentes e testes de integração com ThoughtSpot.

Este projeto visa testar e documentar todas as capacidades do Muze para visualização de dados avançada, validando a integração com o ThoughtSpot para uso em dashboards corporativos do iFood.

## 📚 Documentação Importante

### Aprendizados Gerais
- **[APRENDIZADOS_GERAIS.md](./docs/APRENDIZADOS_GERAIS.md)** - Lições fundamentais aplicáveis a todos os charts ⭐
  - Como usar o DataModel do ThoughtSpot corretamente
  - Como acessar dados do DataModel
  - Como criar campos calculados
  - Como aplicar color encoding
  - Padrões e anti-padrões
- **[Documentação Completa do Muze](./docs/muze_documentation_complete.md)** - Documentação completa do Muze Studio

### Documentação por Chart
- **[Chart 01 - Achados](./docs/charts/ACHADOS_E_APRENDIZADOS.md)** - Problemas encontrados e soluções detalhadas
- **[Chart 01 - Como Usar](./docs/charts/COMO_USAR.md)** - Guia de uso do Chart 01
- **[Chart 01 - Guia Muze Studio](./docs/charts/GUIA_MUZE_STUDIO.md)** - Guia do Muze Studio
- **[Chart 06 - Análise de Problemas](./docs/charts/ANALISE_PROBLEMAS.md)** - Análise de problemas do Chart 06

## Índice de Custom Charts

### Fase 2: Criação de Custom Charts

- [Chart 01 - Encodings Avançados](./muze-tests/chart-01-encodings/)
  - Gráfico de barras com color encoding condicional baseado em benchmark dinâmico
- [Chart 02 - Múltiplas Layers](./muze-tests/chart-02-layers/)
  - Composição complexa com layers de barras, pontos e texto sobrepostos
- [Chart 03 - Transformações DataModel](./muze-tests/chart-03-transforms/)
  - Window functions para cálculo de rank e percentual acumulado
- [Chart 04 - Interatividade](./muze-tests/chart-04-interactivity/)
  - Dois gráficos interconectados com filtros dinâmicos
- [Chart 05 - Customização de Layout](./muze-tests/chart-05-customization/)
  - Chart com tema customizado seguindo design system do iFood
- [Chart 06 - Box Plot Avançado](./muze-tests/chart-06-boxplot/)
  - Visualização estatística com cálculo de quartis e identificação de outliers

## Índice de Testes de Integração

### Fase 3: Integração ThoughtSpot

- [A3.1 - Empacotamento](./docs/integration-tests/EMPACOTAMENTO.md)
  - Processo de criação de pacotes .zip para upload no ThoughtSpot
- [A3.2 - Implantação](./docs/integration-tests/DEPLOY.md)
  - Passo-a-passo de implantação no ambiente ThoughtSpot
- [A3.3 - Teste de Acesso](./docs/integration-tests/A3.3-teste-acesso/README.md)
  - Validação de acesso para diferentes perfis de usuário
- [A3.4 - Persistência em Liveboard](./docs/integration-tests/A3.4-persistencia/README.md)
  - Testes de persistência e carregamento em Liveboards
- [A3.5 - Filtros Globais](./docs/integration-tests/A3.5-filtros-globais/README.md)
  - Validação de reatividade a filtros globais
- [A3.6 - Manutenção](./docs/integration-tests/A3.6-manutencao/README.md)
  - Processo de atualização e versionamento

## Trellis Chart

- [Trellis Chart](./trellis-chart/)
  - Chart SDK desenvolvido com ThoughtSpot Chart SDK e Muze Studio
  - Hospedado externamente no Railway

## Requisitos

- Node.js >= 14.x
- Navegador moderno (Chrome/Firefox/Edge)
- Acesso ao ambiente ThoughtSpot do iFood
- Python 3.x (para servidor local de teste)

## Quick Start

### 1. Instalação

```bash
# Instalar dependências globais
npm install

# Para cada custom chart, instalar dependências
cd muze-tests/chart-01-encodings
npm install
```

### 2. Testar um Chart Localmente

```bash
cd muze-tests/chart-01-encodings
npm run dev
# Abrir http://localhost:8080
```

### 3. Empacotar um Chart

```bash
cd muze-tests/chart-01-encodings
./build.sh
# O arquivo .zip será gerado em dist/
```

### 4. Empacotar Todos os Charts

```bash
cd muze-tests/integration-tests/A3.1-empacotamento
./build-all.sh
```

## Estrutura do Projeto

```
MUZE/
├── README.md                   # Este arquivo
├── TASK.md                     # Tracking de progresso
├── package.json                # Dependências globais
├── .gitignore                  # Arquivos ignorados pelo Git
│
├── docs/                       # Documentação do projeto
│   ├── APRENDIZADOS_GERAIS.md # Aprendizados gerais
│   ├── muze_documentation_complete.md
│   ├── charts/                # Documentação dos Custom Charts
│   ├── trellis-chart/         # Documentação do Trellis Chart
│   ├── integration-tests/     # Documentação dos testes de integração
│   └── README.md              # Índice da documentação
│
├── trellis-chart/             # Trellis Chart (hospedado no Railway)
│   ├── src/                   # Código TypeScript
│   ├── dist/                  # Build de produção
│   ├── package.json           # Dependências do SDK
│   └── README.md              # Documentação do SDK
│
└── muze-tests/                # Códigos de teste do Muze
    ├── chart-XX-nome/         # 6 Custom Charts independentes
    │   ├── src/               # Código Muze
    │   ├── dev/               # Teste local (index.html)
    │   ├── dist/              # Pacote .zip gerado
    │   ├── manifest.json      # Metadados
    │   ├── README.md          # Documentação
    │   └── EVIDENCIAS.md      # Resultados dos testes
    ├── integration-tests/     # Testes de integração (scripts)
    └── datasets/              # Datasets compartilhados
        ├── sales_data.json
        ├── statistical_data.json
        └── hierarchical_data.json
```

## Como Contribuir

1. Siga o padrão de cada Custom Chart conforme template
2. Documente todas as evidências em EVIDENCIAS.md
3. Atualize o TASK.md conforme progresso
4. Capture screenshots em `screenshots/` de cada etapa

## Status do Projeto

Consulte [TASK.md](./TASK.md) para acompanhar o progresso de cada atividade.

## Recursos Adicionais

- [Documentação Muze Studio](https://developers.thoughtspot.com/charts/muze/intro)
- [ThoughtSpot Custom Charts](https://docs.thoughtspot.com/)




