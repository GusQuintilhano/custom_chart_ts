# Projeto de Testes Muze Studio - iFood

## Visão Geral

Validação completa das capacidades do Muze Studio através da criação de 6 Custom Charts independentes e testes de integração com ThoughtSpot.

Este projeto visa testar e documentar todas as capacidades do Muze para visualização de dados avançada, validando a integração com o ThoughtSpot para uso em dashboards corporativos do iFood.

## 📚 Documentação Importante

### 📚 Muze Studio
- **[Aprendizados Completos](./docs/muze/aprendizados/aprendizados-completos.md)** ⭐ - **Documento principal consolidado**
  - Todas as lições fundamentais sobre Muze
  - Como usar o DataModel do ThoughtSpot corretamente
  - Como acessar dados do DataModel
  - Como criar campos calculados
  - Como aplicar color encoding
  - Template completo de código
  - Padrões e anti-padrões

- **[Guia Completo](./docs/muze/guias/guia-completo.md)** ⭐ - **Guia prático**
  - Como usar no Muze Studio (editor interativo)
  - Como fazer upload como Custom Chart tradicional
  - Processo de empacotamento completo
  - Troubleshooting

### 🎨 Chart SDK
- **[Aprendizados Completos](./docs/sdk/aprendizados/aprendizados-completos.md)** ⭐ - **Documento principal consolidado**
  - Todas as lições sobre Chart SDK
  - Como inicializar o Chart Context
  - Como processar dados do ThoughtSpot
  - Template completo de código

### 📋 Documentação por Chart
- **[Chart 01 - Achados](./docs/muze/exemplos/charts/ACHADOS_E_APRENDIZADOS.md)** - Problemas encontrados e soluções detalhadas
- **[Chart 06 - Análise de Problemas](./docs/muze/exemplos/charts/ANALISE_PROBLEMAS.md)** - Análise de problemas do Chart 06

## Índice de Custom Charts

### Charts de Desenvolvimento

Os charts estão em desenvolvimento em [`dev/charts/`](./dev/charts/):

- [Chart 01 - Encodings Avançados](./dev/charts/chart-01-encodings/)
- [Chart 02 - Múltiplas Layers](./dev/charts/chart-02-layers/)
- [Chart 03 - Transformações DataModel](./dev/charts/chart-03-transforms/)
- [Chart 04 - Interatividade](./dev/charts/chart-04-interactivity/)
- [Chart 05 - Customização de Layout](./dev/charts/chart-05-customization/)
- [Chart 06 - Box Plot Avançado](./dev/charts/chart-06-boxplot/)
- [Chart 07 - Multi-Measures](./dev/charts/chart-06-multi-measures/)

### Charts de Produção

- **[Charts Muze de Produção](./muze/)** - Charts Muze finais prontos para uso
- **[Charts SDK de Produção](./sdk/)** - Charts SDK finais (incluindo Trellis Chart)

## Índice de Testes de Integração

### Fase 3: Integração ThoughtSpot

- [A3.1 - Empacotamento](./docs/testes/EMPACOTAMENTO.md)
  - Processo de criação de pacotes .zip para upload no ThoughtSpot
- [A3.2 - Implantação](./docs/testes/DEPLOY.md)
  - Passo-a-passo de implantação no ambiente ThoughtSpot
- [A3.3 - Teste de Acesso](./docs/testes/A3.3-teste-acesso/)
  - Validação de acesso para diferentes perfis de usuário
- [A3.4 - Persistência em Liveboard](./docs/testes/A3.4-persistencia/)
  - Testes de persistência e carregamento em Liveboards
- [A3.5 - Filtros Globais](./docs/testes/A3.5-filtros-globais/)
  - Validação de reatividade a filtros globais
- [A3.6 - Manutenção](./docs/testes/A3.6-manutencao/)
  - Processo de atualização e versionamento

**Scripts de Teste:** Consulte [`dev/integration-tests/`](./dev/integration-tests/) para scripts de empacotamento e validação.

## Trellis Chart

- [Trellis Chart](./sdk/trellis-chart/)
  - Chart SDK desenvolvido com ThoughtSpot Chart SDK e Muze Studio
  - Hospedado externamente
  - Localizado em [`sdk/trellis-chart/`](./sdk/trellis-chart/)

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

# Para cada custom chart em desenvolvimento, instalar dependências (se necessário)
cd dev/charts/chart-01-encodings
npm install
```

### 2. Testar um Chart Localmente

```bash
cd dev/charts/chart-01-encodings
# Abrir src/index.html em um servidor local
python -m http.server 8000
# Acessar http://localhost:8000/src/index.html
```

### 3. Empacotar um Chart

```bash
cd dev/charts/chart-01-encodings
./build.sh
# O arquivo .zip será gerado em dist/
```

### 4. Empacotar Todos os Charts

```bash
cd dev/integration-tests/A3.1-empacotamento
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
├── docs/                       # 📚 Documentação completa do projeto
│   ├── muze/                   # Documentação Muze Studio
│   ├── sdk/                    # Documentação Chart SDK
│   ├── testes/                 # Testes de integração
│   └── _meta/                  # Documentação meta e histórico
│
├── muze/                       # 🎨 Charts Muze de PRODUÇÃO
│   └── (charts finais prontos para uso)
│
├── sdk/                        # 🚀 Charts SDK de PRODUÇÃO
│   └── trellis-chart/         # Trellis Chart SDK
│       ├── src/                # Código TypeScript
│       ├── dist/               # Build de produção
│       └── package.json         # Dependências do SDK
│
└── dev/                        # 🧪 DESENVOLVIMENTO e TESTES
    ├── charts/                 # Custom Charts em desenvolvimento
    │   ├── chart-01-encodings/
    │   ├── chart-02-layers/
    │   └── ...
    ├── integration-tests/      # Scripts de teste de integração
    └── datasets/               # Datasets compartilhados
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




