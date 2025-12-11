# A3.2 - Processo de Implantação no ThoughtSpot

## Visão Geral

Este documento descreve o processo completo de upload e implantação dos Custom Charts no ambiente ThoughtSpot do iFood.

## Pré-requisitos

- Acesso de Admin ao ThoughtSpot
- Pacotes .zip dos 6 Custom Charts gerados
- Credenciais de acesso ao ambiente

## Passo-a-Passo de Implantação

### 1. Acessar Interface Admin

1. Fazer login no ThoughtSpot como administrador
2. Navegar para: **Admin** > **Custom Charts**

### 2. Upload do Pacote

1. Clicar em **"Upload Custom Chart"**
2. Selecionar o arquivo `.zip` do chart
3. Aguardar validação (tempo médio: 30-60 segundos)

### 3. Configurar Permissões

1. Definir permissões de acesso ao chart
2. Associar a grupos de usuários apropriados
3. Salvar configurações

### 4. Associar com TML Template (Opcional)

1. Navegar para: **Data** > **Tables**
2. Selecionar o template apropriado
3. Associar o Custom Chart ao template

## Tempo de Implantação Esperado

- Upload e validação: ~2 minutos por chart
- Configuração de permissões: ~1 minuto por chart
- Total: ~3-5 minutos por chart

## Checklist de Validação

- [ ] Chart aparece na lista de Custom Charts
- [ ] Manifest válido e visível
- [ ] Permissões configuradas corretamente
- [ ] TML template associado (se aplicável)
- [ ] Sem erros no console

## Troubleshooting

### Erro: "Invalid package structure"
- Verificar se o .zip contém os arquivos obrigatórios
- Executar `validate-package.js`

### Erro: "Chart not visible for users"
- Verificar configuração de permissões
- Confirmar que o usuário está em grupo com acesso

## Screenshots

Adicionar screenshots de cada etapa em `screenshots/`:
- `01-upload.png`
- `02-validation.png`
- `03-permissions.png`
- `04-success.png`




