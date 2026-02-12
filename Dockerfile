# Dockerfile para Custom Charts SDK - iFood (GitLab CI / Golden Image)
# Doc: git clone https://code.ifoodcorp.com.br/ifood/docker-images/golden/nodejs.git
ARG CI_REGISTRY=registry.infra.ifood-prod.com.br

# Build do binário Go (router)
FROM node:18-alpine AS go-build

LABEL maintainer="iFood Data Visualization Team"
LABEL description="Custom Charts SDK - ThoughtSpot Chart SDK para visualização de dados"
LABEL version="1.0.0"
LABEL org.opencontainers.image.source=".../custom-charts"

WORKDIR /app

RUN apk add --no-cache go

COPY server.go .

# CGO_ENABLED=0 evita link com musl (Alpine); gera binário estático que roda na base glibc do Golden Image
ENV CGO_ENABLED=0
RUN go build -o charts-router server.go && \
    chmod +x charts-router && \
    ls -la charts-router

# Build dos charts (Trellis e Boxplot) para servir HTML/JS no ThoughtSpot
FROM node:18-alpine AS charts-build

WORKDIR /build

COPY shared/ ./shared/
COPY trellis-chart/ ./trellis-chart/
COPY boxplot-chart/ ./boxplot-chart/

RUN cd shared && npm install
RUN cd trellis-chart && npm ci && npm run build
RUN cd boxplot-chart && npm ci && npx vite build

# Stage para teste local: base glibc (como Golden Image), sem executor - valida binário estático
FROM debian:bookworm-slim AS test
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=go-build /app/charts-router /app/charts-router
COPY --from=charts-build /build/trellis-chart/dist /app/static/trellis
COPY --from=charts-build /build/boxplot-chart/dist /app/static/boxplot
ENV PORT=8080
EXPOSE 8080
CMD ["/app/charts-router"]

# Golden Image via CI_REGISTRY (gate compliant); default for local builds
FROM ${CI_REGISTRY}/ifood/docker-images/golden/nodejs/18:1-edge AS production

COPY --from=go-build /app/charts-router /app/charts-router
COPY --from=charts-build /build/trellis-chart/dist /app/static/trellis
COPY --from=charts-build /build/boxplot-chart/dist /app/static/boxplot

EXPOSE 8080

ENTRYPOINT [ "/executor", "/app/charts-router" ]
