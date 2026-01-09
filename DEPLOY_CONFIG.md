# Configuração de Deploy - Evitar Deploys Duplicados

## 🔍 Problema Identificado

Atualmente há **2 sistemas fazendo deploy simultaneamente**:

1. **GitLab CI/CD** (`.gitlab-ci.yml`) - Deploy na branch `main`
2. **Railway** (`railway.json`) - Deploy automático (provavelmente em múltiplas branches)

Isso causa **2 deploys** toda vez que há push.

## 📋 Situação Atual

### GitLab CI/CD
- **Branch monitorada**: `main` (linha 72 do `.gitlab-ci.yml`)
- **Quando faz deploy**: Push para `main` ou merge requests
- **Dockerfile usado**: `Dockerfile.gitlab`

### Railway
- **Branch monitorada**: Provavelmente `develop` E/OU `main` (configuração no painel do Railway)
- **Quando faz deploy**: Automático em cada push (se configurado)
- **Dockerfile usado**: `Dockerfile` (corrigido no `railway.json`)

## ✅ Solução Recomendada

### Opção 1: Separar por Ambiente (Recomendado)

**GitLab CI/CD → Produção (`main`)**
- Deploy apenas quando há push/merge para `main`
- Usa `Dockerfile.gitlab` (com golden image iFood)
- Registry interno do iFood

**Railway → Desenvolvimento (`develop`)**
- Deploy apenas quando há push para `develop`
- Usa `Dockerfile` (versão simplificada)
- Registry público Railway

### Como Configurar Railway para Monitorar Apenas `develop`:

1. No painel do Railway:
   - Vá em **Settings** → **Source**
   - Em **Branch**, selecione apenas `develop`
   - Desmarque **Auto Deploy** para outras branches

2. Ou criar um arquivo `.railway/config.toml` (se Railway suportar):
```toml
[build]
  dockerfilePath = "Dockerfile"

[deploy]
  branch = "develop"
```

### Opção 2: Desabilitar Deploy Automático no Railway

1. No painel do Railway:
   - Vá em **Settings** → **Source**
   - Desabilite **Auto Deploy**
   - Deploy manual apenas quando necessário

### Opção 3: Usar Apenas GitLab CI/CD

1. Remover integração do Railway
2. Usar apenas GitLab CI/CD para todos os deploys
3. Configurar GitLab para fazer deploy em múltiplos ambientes

## 🔧 Correções Aplicadas

1. ✅ Corrigido `railway.json` para usar `Dockerfile` (em vez de `Dockerfile.railway` inexistente)
2. ✅ Adicionada configuração de restart policy no `railway.json`

## 📝 Próximos Passos

**Você precisa configurar no painel do Railway:**

1. Acesse o projeto no Railway
2. Vá em **Settings** → **Source**
3. Configure para monitorar **apenas a branch `develop`** (ou a branch que você usa para dev)
4. Desabilite **Auto Deploy** para outras branches
5. Salve as alterações

Isso garantirá que:
- **GitLab CI** faça deploy apenas de `main` (produção)
- **Railway** faça deploy apenas de `develop` (desenvolvimento)
- **Apenas 1 deploy por push** em cada ambiente

## 🚨 Verificação

Após configurar, faça um teste:

1. Push para `develop` → Deve fazer deploy apenas no Railway
2. Push para `main` → Deve fazer deploy apenas no GitLab CI/CD
3. Não deve haver 2 deploys simultâneos

