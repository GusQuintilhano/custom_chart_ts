# Dockerfile para Custom Charts SDK - iFood (GitLab CI / Golden Image)
# Doc: git clone https://code.ifoodcorp.com.br/ifood/docker-images/golden/nodejs.git
ARG CI_REGISTRY=registry.infra.ifood-prod.com.br

FROM node:18-alpine AS dist

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

# Golden Image via CI_REGISTRY (gate compliant); default for local builds
FROM ${CI_REGISTRY}/ifood/docker-images/golden/nodejs/18:1-edge AS production

COPY --from=dist /app/charts-router /app/charts-router

EXPOSE 8080

ENTRYPOINT [ "/executor", "/app/charts-router" ]
