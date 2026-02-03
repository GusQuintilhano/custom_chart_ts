#!/bin/sh
# Testa a imagem Docker (local ou do registry).
# Uso:
#   Testar imagem do registry: ./scripts/test-gitlab-image.sh [IMAGEM] [PORTA]
#   Testar imagem buildada local: ./scripts/test-gitlab-image.sh --local [IMAGEM] [PORTA]
#
# Pré-requisitos para pull: VPN iFood, docker login no registry.

set -e

SKIP_PULL=0
if [ "$1" = "--local" ]; then
    SKIP_PULL=1
    shift
fi

DEFAULT_IMAGE="${CI_REGISTRY_IMAGE:-registry.infra.ifood-prod.com.br/ifood/data/viz/custom-charts}:${CONTAINER_IMAGE_TAG:-dev}"
IMAGE="${1:-$DEFAULT_IMAGE}"
PORT="${2:-18080}"
CONTAINER_NAME="custom-charts-test-$$"

cleanup() {
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
}
trap cleanup EXIT

if [ "$SKIP_PULL" = 1 ]; then
    echo "Usando imagem local: $IMAGE"
else
    echo "Pull da imagem: $IMAGE"
    docker pull "$IMAGE"
fi

echo "Subindo container na porta $PORT..."
docker run --rm -d --name "$CONTAINER_NAME" -p "${PORT}:8080" "$IMAGE"

sleep 5

BASE="http://localhost:${PORT}"
ok=0
fail=0

if curl -sf "$BASE/health" > /dev/null; then
    echo "  /health: OK"
    ok=$((ok + 1))
else
    echo "  /health: FALHOU"
    fail=$((fail + 1))
fi

if curl -sf "$BASE/" > /dev/null; then
    echo "  /: OK"
    ok=$((ok + 1))
else
    echo "  /: FALHOU"
    fail=$((fail + 1))
fi

if curl -sf "$BASE/trellis" > /dev/null; then
    echo "  /trellis: OK"
    ok=$((ok + 1))
else
    echo "  /trellis: FALHOU"
    fail=$((fail + 1))
fi

if curl -sf "$BASE/boxplot" > /dev/null; then
    echo "  /boxplot: OK"
    ok=$((ok + 1))
else
    echo "  /boxplot: FALHOU"
    fail=$((fail + 1))
fi

echo ""
if [ "$fail" -eq 0 ]; then
    echo "Todos os testes passaram ($ok/4)."
    exit 0
fi
echo "Falhas: $fail. Logs do container:"
docker logs "$CONTAINER_NAME" 2>&1 | tail -30
exit 1
