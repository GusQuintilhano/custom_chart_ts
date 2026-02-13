# Por que ainda aparece JSON em vez do gráfico

## Causa

A resposta `{"chart":"trellis","status":"available","message":"Trellis chart endpoint"}` vem do **código antigo** do `server.go` (handlers `trellisHandler`/`boxplotHandler` que retornavam JSON). Esse código foi trocado no commit **fb1736b** (12/02) para servir o HTML do chart.

Se a URL ainda devolve JSON, o **cluster está rodando uma imagem Docker antiga**, construída antes dessa alteração (ou a tag no registry ainda apontava para essa build antiga).

## Checklist para corrigir

1. **Garantir imagem nova com a correção**
   - Usar uma **tag nova** (ex.: **v0.1.2**) para forçar build a partir do código atual.
   - No custom-charts: merge do MR `release/0.1.2` no `main`, depois criar e dar push na tag:
     ```bash
     git pull gitlab main
     git tag v0.1.2 main -m "Release 0.1.2"
     git push gitlab v0.1.2
     ```
   - Aguardar a pipeline da tag terminar (job `build-release` deve publicar a imagem no registry).

2. **Apontar o deploy para a nova tag**
   - No repositório **k8s-manifests**, no arquivo:
     `manifests/new-singlecluster-apps/cluster-data-applications/dataviz/app/dataviz-custom-chart/deployment.yaml`
   - Alterar a linha da image de `.../dataviz-custom-charts:v0.1.1` para `.../dataviz-custom-charts:v0.1.2`.
   - Fazer commit, push e **merge do MR** na branch que o Argo usa (ex.: `main`).

3. **Deixar o cluster usar a nova imagem**
   - Argo CD: dar sync na Application do dataviz-custom-chart (ou aguardar o sync automático).
   - Ou, com `kubectl`: rollout do deployment no namespace correto (ex.: `dataviz`).
   - Com `imagePullPolicy: Always`, os nodes vão buscar a imagem v0.1.2 do registry.

4. **Conferir**
   - Abrir a URL do trellis (ex.: `https://dataviz-custom-chart.ifoodcorp.com.br/trellis`).
   - Deve carregar a **página do gráfico** (HTML), não o JSON.
   - Opcional: no pod em execução, verificar se o HTML existe:
     ```bash
     kubectl exec -n dataviz deploy/dataviz-custom-chart -- cat /app/static/trellis/index.html | head -5
     ```
     Se existir, o binário Go está servindo esse arquivo em `/trellis`.

## Se tiver token K8S_MANIFESTS_UPDATE_TOKEN

Com a variável configurada no projeto custom-charts, o job `update-k8s-manifest` na pipeline da tag **v0.1.2** pode abrir sozinho o MR no k8s-manifests atualizando a image para v0.1.2. Basta aprovar e fazer merge desse MR.
