# Referência: CI e Docker (Golden Image Node.js)

Projeto de exemplo oficial para comparar CI e Dockerfile:

- **Repositório:** [simple-project-gi-nodejs](https://code.ifoodcorp.com.br/ifood/docker-images/golden/test-projects/simple-project-gi-nodejs/-/tree/main)
- **Arquivos:** `.gitlab-ci.yml`, `Dockerfile`

## O que conferir no exemplo

1. **.gitlab-ci.yml**
   - Quais includes (ex.: só ifood-docker ou também ifood-security).
   - Variáveis: `SERVICE_NAME`, `BUILD_DOCKERFILE_PATH`, `CONTAINER_IMAGE_TAG`.
   - Jobs: validate, build (trigger), build-release (trigger), release-image.
   - Uso de `workflow:` / `rules` para tags e main.

2. **Dockerfile**
   - Base de produção: `FROM ${CI_REGISTRY}/ifood/docker-images/golden/nodejs/18:1-edge`.
   - Uso de `/executor` no `ENTRYPOINT` ou `CMD`.
   - Stages (build da app Node, stage final enxuto).

## Nosso CI atual (custom_charts)

- **Include:** ifood-security-4-stable (Sonar/Snyk etc.) + trigger ifood-docker nos jobs build/build-release.
- **Variáveis:** SERVICE_NAME=dataviz-custom-charts, NODE_VERSION=18, FORCE_RELEASE, SEMANTIC_VERSION_FILE, BUILD_MULTIARCH.
- **Jobs próprios:** validate, build-charts (artifacts dos dist), build (trigger docker tag=dev), build-release (trigger docker tag=CI_COMMIT_TAG), release-image.
- **Build da imagem:** o trigger ifood-docker usa o contexto do repositório e `BUILD_DOCKERFILE_PATH: $CI_PROJECT_DIR/Dockerfile`.

Se o exemplo tiver um CI mais enxuto (ex.: sem build-charts ou sem security include), dá para alinhar nosso `.gitlab-ci.yml` ao padrão do exemplo após revisão.
