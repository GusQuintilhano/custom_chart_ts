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

## ✅ Solução Implementada

### Separação por Repositório/Pasta

**custom_charts-railway → Railway (Ativo)**
- Deploy automático no Railway
- Usa `Dockerfile` (versão simplificada)
- Registry público Railway
- Branch: `main` ou `develop` (conforme configurado no Railway)

**custom_charts → GitLab CI/CD (Futuro)**
- Deploy via GitLab CI/CD quando estiver 100% funcional
- Usa `Dockerfile.gitlab` (com golden image iFood)
- Registry interno do iFood
- Branch: `main`

## 🔧 Configuração Atual

### Railway (custom_charts-railway)
- **Status**: ✅ Ativo e funcionando
- **Branch monitorada**: Configurada no painel do Railway
- **Dockerfile**: `Dockerfile` (versão simplificada para Railway)
- **Build**: Nixpacks com `railway.json`

### GitLab CI/CD (custom_charts)
- **Status**: 🔄 Em desenvolvimento (não 100% funcional ainda)
- **Branch monitorada**: `main` (quando ativado)
- **Dockerfile**: `Dockerfile.gitlab` (com golden image iFood)
- **Build**: GitLab CI com `.gitlab-ci.yml`

## 📝 Próximos Passos

**Situação Atual (Recomendado):**
1. ✅ Manter Railway ativo para `custom_charts-railway`
2. ✅ Continuar desenvolvimento do GitLab CI para `custom_charts`
3. ✅ Quando GitLab estiver 100%, migrar produção para lá
4. ✅ Railway pode continuar como ambiente de desenvolvimento/teste

## 🚨 Verificação

Após configurar, faça um teste:

1. Push para `develop` → Deve fazer deploy apenas no Railway
2. Push para `main` → Deve fazer deploy apenas no GitLab CI/CD
3. Não deve haver 2 deploys simultâneos

