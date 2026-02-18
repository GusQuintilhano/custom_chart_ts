# Dockerfile para Custom Charts SDK - iFood (GitLab CI / Golden Image)
# Apenas Node.js: build dos charts + charts-router (Express). Sem Go/CGO.
# Doc: https://code.ifoodcorp.com.br/ifood/docker-images/golden/test-projects/simple-project-gi-nodejs
ARG CI_REGISTRY=registry.infra.ifood-prod.com.br
ARG GOLDEN_IMG_NODE_VERSION=18
ARG GOLDEN_IMG_TAG=1-edge

# Build dos charts (Trellis e Boxplot). Dist gerado sempre do zero (vite.config base /trellis/ e /boxplot/).
FROM node:18-alpine AS charts-build

WORKDIR /build

COPY shared/ ./shared/
COPY trellis-chart/ ./trellis-chart/
COPY boxplot-chart/ ./boxplot-chart/

# Garantir build limpo: não reutilizar dist de outro build (base no vite.config deve ser aplicada).
RUN rm -rf trellis-chart/dist boxplot-chart/dist 2>/dev/null || true

RUN cd shared && npm install
RUN cd trellis-chart && npm ci && npm run build
RUN cd boxplot-chart && npm ci && npx vite build

# Build do charts-router (Express que serve /trellis e /boxplot)
FROM node:18-alpine AS router-build

WORKDIR /build

COPY charts-router/package.json charts-router/package-lock.json ./charts-router/
COPY shared/ ./shared/

RUN cd charts-router && npm ci

COPY charts-router/ ./charts-router/
RUN cd charts-router && npm run build && npm ci --omit=dev

# Stage para teste local (Node apenas, sem Golden Image)
FROM node:18-alpine AS test
WORKDIR /app
COPY --from=router-build /build/charts-router/package.json /build/charts-router/package-lock.json ./charts-router/
RUN cd charts-router && npm ci --omit=dev
COPY --from=router-build /build/charts-router/dist ./charts-router/dist/
COPY --from=charts-build /build/trellis-chart/dist ./trellis-chart/dist/
COPY --from=charts-build /build/boxplot-chart/dist ./boxplot-chart/dist/
ENV PORT=8080
EXPOSE 8080
WORKDIR /app/charts-router
CMD ["node", "dist/server.js"]

# Produção: Golden Image Node.js (sem shell; só COPY, sem RUN)
FROM ${CI_REGISTRY}/ifood/docker-images/golden/nodejs/${GOLDEN_IMG_NODE_VERSION}:${GOLDEN_IMG_TAG} AS production

WORKDIR /app

# node_modules de produção já gerado em router-build; Golden Image pode não ter /bin/sh
COPY --from=router-build /build/charts-router/package.json /build/charts-router/package-lock.json ./charts-router/
COPY --from=router-build /build/charts-router/node_modules ./charts-router/node_modules/
COPY --from=router-build /build/charts-router/dist ./charts-router/dist/
COPY --from=charts-build /build/trellis-chart/dist ./trellis-chart/dist/
COPY --from=charts-build /build/boxplot-chart/dist ./boxplot-chart/dist/

ENV PORT=8080
EXPOSE 8080
WORKDIR /app/charts-router
ENTRYPOINT [ "/executor", "node", "dist/server.js" ]
