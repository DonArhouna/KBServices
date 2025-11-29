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
  docker compose -f docker-compose.yml $COMPOSE_PROFILES --env-file "$ENVFILE" up --build -d
else
  docker compose -f docker-compose.yml --env-file "$ENVFILE" up --build -d
fi

echo "Deployment complete. Tail logs to debug: docker compose -f docker-compose.yml logs -f backend"
