#!/usr/bin/env bash
set -euo pipefail

# deploy-docker.sh
# Usage: ./docker/deploy-docker.sh [prod|test] [--container-db] [--attach-existing-db CONTAINER_NAME]
# If first arg is 'test', uses .env.test, else uses .env.prod
# The optional second arg `--container-db` will start the postgres container (profile localdb)
# If `--attach-existing-db CONTAINER_NAME` is passed, it connects that container to the compose network so the backend can reach it as `CONTAINER_NAME`.
# If first arg is 'test', uses .env.test, else uses .env.prod
# The optional second arg `--container-db` will start the postgres container (profile localdb)

ENV=${1:-prod}
USE_CONTAINER_DB=false
ATTACH_EXISTING_DB=""
shift_index=0
for arg in "$@"; do
  case "$arg" in
    --container-db)
      USE_CONTAINER_DB=true
      ;;
    --attach-existing-db)
      shift_index=1
      # The next param is the container name
      ;;
    *)
      if [ "$shift_index" -eq 1 ]; then
        ATTACH_EXISTING_DB="$arg"
        shift_index=0
      fi
      ;;
  esac
done

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

# Copy the environment file into the compose expected path: ../.env
echo "Copying env file $ENVFILE to ../.env used by docker-compose"
cp "$ENVFILE" ../.env

COMPOSE_PROFILES=""
if [ "$USE_CONTAINER_DB" = true ]; then
  COMPOSE_PROFILES="--profile localdb"
fi

echo "Deploying app using envfile: $ENVFILE"
if [ -n "$ATTACH_EXISTING_DB" ]; then
  echo "You provided --attach-existing-db $ATTACH_EXISTING_DB. Ensuring it is connected to the compose network 'kbnet'..."
  docker network create kbnet || true
  docker network connect kbnet "$ATTACH_EXISTING_DB" || true
  echo "Connected $ATTACH_EXISTING_DB to kbnet"
fi
if [ -n "$COMPOSE_PROFILES" ]; then
  if [ -n "$ATTACH_EXISTING_DB" ]; then
    docker compose -f docker-compose.yml -f docker-compose.no-postgres.yml $COMPOSE_PROFILES --env-file "$ENVFILE" up --build -d
  else
    docker compose -f docker-compose.yml $COMPOSE_PROFILES --env-file "$ENVFILE" up --build -d
  fi
else
  if [ -n "$ATTACH_EXISTING_DB" ]; then
    docker compose -f docker-compose.yml -f docker-compose.no-postgres.yml --env-file "$ENVFILE" up --build -d
  else
    docker compose -f docker-compose.yml --env-file "$ENVFILE" up --build -d
  fi
fi

# Ensure backend/frontend are attached to the external kbnet network after compose up
echo "Ensuring compose-created containers are attached to kbnet (idempotent)"
BACKEND_CID=$(docker compose -f docker-compose.yml -f docker-compose.no-postgres.yml --env-file "$ENVFILE" ps -q backend || true)
FRONTEND_CID=$(docker compose -f docker-compose.yml -f docker-compose.no-postgres.yml --env-file "$ENVFILE" ps -q frontend || true)
if [ -n "$BACKEND_CID" ]; then
  docker network connect kbnet "$BACKEND_CID" || true
fi
if [ -n "$FRONTEND_CID" ]; then
  docker network connect kbnet "$FRONTEND_CID" || true
fi

# Simple smoke test: wait for API to respond and return success if healthy
echo "Waiting for backend API to respond on http://127.0.0.1:3001/api/health/tables ..."
for i in {1..10}; do
  if curl -sSf http://127.0.0.1:3001/api/health/tables >/dev/null 2>&1; then
    echo "Health check passed"
    break
  fi
  echo "Waiting for API... ($i/10)"
  sleep 2
done
if ! curl -sSf http://127.0.0.1:3001/api/health/tables >/dev/null 2>&1; then
  echo "Health check FAILED: backend is not responding. Check logs"
  docker compose -f docker-compose.yml -f docker-compose.no-postgres.yml --env-file "$ENVFILE" logs backend --tail 200
  exit 1
fi

echo "Deployment complete. Tail logs to debug: docker compose -f docker-compose.yml logs -f backend"
