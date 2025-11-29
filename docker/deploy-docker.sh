#!/usr/bin/env bash
set -euo pipefail

# deploy-docker.sh
# Usage: ./docker/deploy-docker.sh [prod|test] [--container-db]
# If first arg is 'test', uses .env.test, else uses .env.prod
# The optional second arg `--container-db` will start the postgres container (profile localdb)

ENV=${1:-prod}
USE_CONTAINER_DB=false
if [ "${2:-}" = "--container-db" ]; then
  USE_CONTAINER_DB=true
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/docker"

if [ "$ENV" = "test" ]; then
  ENVFILE="$ROOT_DIR/.env.test"
else
  ENVFILE="$ROOT_DIR/.env.prod"
fi

if [ ! -f "$ENVFILE" ]; then
  echo "Env file $ENVFILE not found. Copy the example from ${ENVFILE}.example and fill credentials."
  exit 1
fi

COMPOSE_PROFILES=""
if [ "$USE_CONTAINER_DB" = true ]; then
  COMPOSE_PROFILES="--profile localdb"
fi

echo "Deploying app using envfile: $ENVFILE"
if [ -n "$COMPOSE_PROFILES" ]; then
  docker compose -f docker-compose.yml $COMPOSE_PROFILES --env-file "$ENVFILE" up --build -d
else
  docker compose -f docker-compose.yml --env-file "$ENVFILE" up --build -d
fi

echo "Deployment complete. Tail logs to debug: docker compose -f docker-compose.yml logs -f backend"
