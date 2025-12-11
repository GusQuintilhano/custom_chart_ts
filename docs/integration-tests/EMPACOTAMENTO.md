# A3.1 - Processo de Empacotamento

## Visão Geral

Este documento descreve o processo de empacotamento dos 6 Custom Charts para upload no ThoughtSpot.

## Passo-a-Passo

### 1. Empacotar um Chart Individual

```bash
# Navegar para o chart desejado
cd muze-tests/chart-01-encodings

# Executar o script de build
./build.sh
```

O arquivo `.zip` será gerado em: `dist/ifood-muze-[nome]-v[versao].zip`

### 2. Empacotar Todos os Charts

```bash
# Na raiz do projeto
cd muze-tests/integration-tests/A3.1-empacotamento

# Executar script
./build-all.sh
```

Todos os 6 charts serão empacotados simultaneamente.

### 3. Validar Pacote

```bash
# Usar script de validação
node validate-package.js
```

## Estrutura Esperada do .zip

```
ifood-muze-[nome]-v1.0.0.zip
├── index.js                 # Código Muze (obrigatório)
├── styles.css               # Estilos (opcional mas recomendado)
├── manifest.json            # Metadados (obrigatório)
└── chart-config.json        # Configuração (obrigatório)
```

## Checklist de Validação

- [ ] Arquivo .zip foi gerado
- [ ] Contém manifest.json
- [ ] Contém index.js
- [ ] Contém chart-config.json
- [ ] Versão no manifest corresponde ao arquivo .zip
- [ ] Nome do chart é único e descritivo
- [ ] Tamanho do arquivo < 5MB

## Troubleshooting

### Erro: "build.sh: Permission denied"
```bash
chmod +x build.sh
```

### Erro: Arquivo .zip vazio
Verificar se os arquivos em `src/` existem e estão corretos.




