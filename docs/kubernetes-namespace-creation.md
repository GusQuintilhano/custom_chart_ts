# Criar namespace Kubernetes (dataviz-custom-chart)

Procedimento para criar o namespace **dataviz-custom-chart** no **kubernetes-infrastructure-live**, espelhando a configuração usada por outros serviços do mesmo cluster (ex.: **quality-gate-api**). O Kong sandbox/production já apontam para o cluster **internal-services** (`cluster-01.k8s.internal-services-sandbox.dc-ifood.com` e `cluster-01.k8s.internal-services-production.dc-ifood.com`).

**Referência:** [Creating a Kubernetes namespace](https://code.ifoodcorp.com.br/ifood/ps/pse/docs/-/blob/main/docs/pse-guides/first-deploy/README.md) (PSE) e configuração existente de **quality-gate-api** no mesmo cluster.

---

## Pré-requisitos

- Acesso ao repositório **kubernetes-infrastructure-live**
- **Make** e **cookiecutter** instalados
- Nome do serviço: **dataviz-custom-chart**  
- Cluster alvo: **internal-services** (sandbox e production)

---

## Opção A: Usar o cookiecutter (make generate-namespace)

1. Clone o repositório (se ainda não tiver):

   ```bash
   git clone git@git.ifoodcorp.com.br:ifood/sre/kubernetes/kubernetes-infrastructure-live.git
   cd kubernetes-infrastructure-live
   ```

2. Crie uma branch:

   ```bash
   git checkout -b feat/namespace-dataviz-custom-chart
   ```

3. Gere o namespace para **sandbox**:

   ```bash
   CLUSTER_NAME=cluster-01.k8s.internal-services-sandbox.dc-ifood.com make generate-namespace
   ```

   Quando o cookiecutter pedir:
   - **namespace:** `dataviz-custom-chart`
   - **kifood_package_version:** `2.0.0` (ou o valor sugerido)
   - **_cluster_name:** `cluster-01.k8s.internal-services-sandbox.dc-ifood.com`

4. Edite o arquivo gerado e preencha **userMaintainers** (veja formato na Opção B abaixo). O template pode gerar um path diferente do usado no cluster; se precisar alinhar ao padrão do internal-services, use o conteúdo da Opção B.

5. Repita para **production** (outra pasta de cluster):

   ```bash
   CLUSTER_NAME=cluster-01.k8s.internal-services-production.dc-ifood.com make generate-namespace
   ```

   Mesmos valores de namespace e package. Depois edite o YAML para incluir os maintainers.

6. Commit, push e MR:

   ```bash
   git add clusters/cluster-01.k8s.internal-services-sandbox.dc-ifood.com/namespaces/dataviz-custom-chart/
   git add clusters/cluster-01.k8s.internal-services-production.dc-ifood.com/namespaces/dataviz-custom-chart/
   git commit -m "feat: add namespace for dataviz-custom-chart"
   git push origin feat/namespace-dataviz-custom-chart
   ```

7. Abra o Merge Request no GitLab. Revise o comentário do **Atlantis** (Ran Plan). Se estiver ok, após aprovação comente com:

   ```text
   atlantis apply -d clusters/cluster-01.k8s.internal-services-sandbox.dc-ifood.com/namespaces/dataviz-custom-chart
   atlantis apply -d clusters/cluster-01.k8s.internal-services-production.dc-ifood.com/namespaces/dataviz-custom-chart
   ```

   (Ou aplique um ambiente por vez, conforme política do time.)

---

## Opção B: Copiar a configuração do quality-gate-api (recomendado)

A configuração do **quality-gate-api** no mesmo cluster foi usada como referência. Você pode criar as pastas e arquivos manualmente com o conteúdo abaixo.

**Cluster sandbox:**  
`clusters/cluster-01.k8s.internal-services-sandbox.dc-ifood.com/namespaces/dataviz-custom-chart/`

**Cluster production:**  
`clusters/cluster-01.k8s.internal-services-production.dc-ifood.com/namespaces/dataviz-custom-chart/`

Em cada pasta, crie:

- **`.gitkeep`** (arquivo vazio)
- **`dataviz-custom-chart.yaml`** com o conteúdo:

```yaml
helmfiles:
  - path: git::ssh://git.ifoodcorp.com.br/ifood/sre/kubernetes/helmfile-packages.git@namespace/helmfile.yaml?ref=1.3.0
    values:
      - namespace:
          name: dataviz-custom-chart
          userMaintainers:
            - dataviz@ifood.com.br
            # Adicione outros maintainers (ex.: gustavo.silva@ifood.com.br)
```

Substitua ou complemente **userMaintainers** com os e-mails do time que terão permissão no namespace (ex.: maintainers do squad dataviz). O `helmfile.yaml` na pasta `namespaces/` do cluster já inclui `namespaces/*.yaml`, então o novo namespace será carregado automaticamente.

Depois: commit, push, MR e **atlantis plan/apply** como na Opção A (passos 6 e 7).

---

## Referência: quality-gate-api (mesmo cluster)

Estrutura e conteúdo usados como base (apenas para comparação):

- **Sandbox:**  
  `clusters/cluster-01.k8s.internal-services-sandbox.dc-ifood.com/namespaces/quality-gate-api/quality-gate-api.yaml`
- **Production:**  
  `clusters/cluster-01.k8s.internal-services-production.dc-ifood.com/namespaces/quality-gate-api/quality-gate-api.yaml`

Ambos usam `helmfile-packages.git@namespace/helmfile.yaml?ref=1.3.0` e listam **userMaintainers** com e-mails individuais. O **dataviz-custom-chart** segue o mesmo padrão; a única diferença é o `name` do namespace e a lista de maintainers.

---

## Troubleshooting (Atlantis)

Se o merge automático falhar com algo como `405 Method Not Allowed`:

1. Rebase o MR.
2. Rode novamente no comentário do MR:
   - `atlantis plan -d clusters/cluster-01.k8s.internal-services-sandbox.dc-ifood.com/namespaces/dataviz-custom-chart`
   - `atlantis apply -d clusters/cluster-01.k8s.internal-services-sandbox.dc-ifood.com/namespaces/dataviz-custom-chart`
   (E o equivalente para production.)

Dúvidas de permissão ou plano Terraform: #engineering-support.
