# Criar propriedade Akamai (iFood)

Guia para criar e configurar uma propriedade Akamai e expor o serviço na edge (CDN). O repositório **edge-network-live** é responsável pelos recursos de edge (Akamai e Cloudflare).

**Serviço:** dataviz-custom-chart → FQDN `dataviz-custom-chart.ifoodcorp.com.br`

---

## Pré-requisitos

- Acesso ao repositório **edge-network-live** (GitLab iFood; URL pode variar – conferir no GitLab ou Confluence)
- **Make** e **CookieCutter** instalados na máquina
- Subdomínio já criado no Route 53 (dataviz-custom-chart.ifoodcorp.com.br)

---

## 1. Clonar o repositório

Só é necessário **Git** e acesso de rede/VPN ao GitLab. Make e CookieCutter **não** são usados no clone.

Na sua máquina (com acesso ao GitLab iFood):

```bash
# Use git.ifoodcorp.com.br (não code.ifoodcorp.com.br). Requer rede/VPN iFood.
git clone git@git.ifoodcorp.com.br:ifood/sre/network-l7/edge-network-live.git
cd edge-network-live
```

Repositório: **[edge-network-live](https://code.ifoodcorp.com.br/ifood/sre/network-l7/edge-network-live)** (grupo `ifood/sre/network-l7`)

---

## 2. Configurar a propriedade Akamai

Neste passo são necessários **Make** e **CookieCutter** (pré-requisitos). Na raiz do repositório clonado:

```bash
make edge
```

ou, se a propriedade integrar Akamai com bucket S3:

```bash
make edge-s3
```

Quando o comando pedir, informe:

| Prompt        | Valor para dataviz-custom-chart |
|---------------|----------------------------------|
| **FQDN**      | `dataviz-custom-chart.ifoodcorp.com.br` |
| **Maintainers** | Lista de mantenedores (ex.: `nome.sobrenome`) |
| **Impact Level** | Nível de impacto adequado (conforme catálogo do projeto) |
| **Description** | Descrição curta da propriedade (ex.: "Custom Charts SDK – dataviz-custom-chart") |

Ao final, deve aparecer algo como:

```
Done! Your property is in 'property-groups/<organizacao>/<FQDN>'. Enjoy!
```

---

## 3. Commit, push e Merge Request

```bash
git checkout -b feat/akamai-dataviz-custom-chart
git add .
git commit -m "feat: add Akamai property for dataviz-custom-chart.ifoodcorp.com.br"
git push origin feat/akamai-dataviz-custom-chart
```

- Abra um **Merge Request** no GitLab.
- Solicite aprovação do **pse-team** (ex.: abrindo ticket no canal **#engineering-support**).
- Siga o fluxo do **Atlantis** no MR (comentar `atlantis plan` e, após revisão, `atlantis apply`).
- O **apply** faz o merge do MR.

---

## 4. Testar em staging e promover para produção

### 4.1 Staging

- Após o apply, anote o **edge_hostname** do output do Atlantis.
- Teste no ambiente de **staging** da Akamai usando a ferramenta indicada no guia interno.
- Em caso de dúvida: ticket no **#engineering-support**.

### 4.2 Produção

1. Atualize o **production_property_version** no `terragrunt.hcl` da sua propriedade (em `property-groups/<organizacao>/<FQDN>/`). Para dataviz-custom-chart use **production_property_version = 1**.
2. Faça commit, push e abra um novo MR.
3. Siga novamente o fluxo Atlantis (plan → apply).
4. O apply faz o merge e a propriedade fica em produção.

---

## Resumo para dataviz-custom-chart

| Campo   | Valor |
|--------|--------|
| FQDN   | dataviz-custom-chart.ifoodcorp.com.br |
| production_property_version | **1** (obrigatório na promoção para produção) |
| Maintainers | _(preencher)_ |
| Impact Level | _(selecionar)_ |
| Description | Custom Charts SDK – dataviz-custom-chart (ou similar) |

---

## Referências

- Guia interno: "Creating Akamai property"
- Suporte: **#engineering-support**
- Aprovação: **pse-team**
