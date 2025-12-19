# Desenvolvimento e Testes

Esta pasta contém recursos para **desenvolvimento e testes** dos Custom Charts, incluindo scripts de empacotamento, validação e datasets compartilhados.

## 📁 Estrutura

```
dev/
├── charts/                # Custom Charts em desenvolvimento
│   ├── chart-01-encodings/
│   ├── chart-02-layers/
│   └── ...
│
├── integration-tests/      # Scripts de teste de integração
│   └── A3.1-empacotamento/
│       ├── build-all.sh   # Script para empacotar todos os charts
│       └── validate-package.js  # Validador de pacotes
│
└── datasets/              # Datasets compartilhados para testes
    ├── sales_data.json
    ├── statistical_data.json
    └── hierarchical_data.json
```

## 🧪 Testes de Integração

### A3.1 - Empacotamento

Scripts para empacotar e validar todos os Custom Charts:

```bash
cd integration-tests/A3.1-empacotamento
./build-all.sh
# Gera todos os pacotes .zip em paralelo
```

**Validação de Pacotes:**
```bash
node validate-package.js <caminho-do-zip>
# Valida estrutura e conteúdo do pacote
```

### Outros Testes

Para documentação completa dos testes de integração, consulte:
- **[Testes de Integração](../../docs/testes/)**
  - A3.1 - Empacotamento
  - A3.2 - Implantação
  - A3.3 - Teste de Acesso
  - A3.4 - Persistência em Liveboard
  - A3.5 - Filtros Globais
  - A3.6 - Manutenção

## 📊 Datasets

Datasets compartilhados usados nos testes e desenvolvimento:

- **`sales_data.json`**: Dados de vendas para testes de visualização
- **`statistical_data.json`**: Dados estatísticos para charts avançados
- **`hierarchical_data.json`**: Dados hierárquicos para visualizações complexas

### Como Usar os Datasets

Os datasets podem ser usados para testes locais dos charts:

```javascript
// Em um chart de teste local
fetch('../dev/datasets/sales_data.json')
  .then(res => res.json())
  .then(data => {
    // Usar os dados para teste
  });
```

## 🛠️ Ferramentas de Desenvolvimento

### Scripts Úteis

**Empacotar todos os charts:**
```bash
cd integration-tests/A3.1-empacotamento
./build-all.sh
```

**Validar um pacote:**
```bash
node integration-tests/A3.1-empacotamento/validate-package.js charts/chart-01-encodings/dist/chart.zip
```

**Empacotar um chart individual:**
```bash
cd charts/chart-01-encodings
./build.sh
```

## 📚 Documentação Relacionada

- **[Charts Muze de Produção](../muze/)** - Charts Muze finais prontos para uso
- **[Charts SDK de Produção](../sdk/)** - Charts SDK finais prontos para uso
- **[Documentação Completa](../docs/)** - Toda a documentação do projeto

## ⚠️ Nota Importante

Esta pasta contém recursos de **desenvolvimento e teste**. Os charts finais de produção estão em:
- [`../muze/`](../muze/) - Charts Muze de produção
- [`../sdk/`](../sdk/) - Charts SDK de produção

---

**Última atualização:** 2025-01-03

