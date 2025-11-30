#!/usr/bin/env bash
set -euo pipefail

# remote-deploy.sh
# Intended to be executed on the VPS as user `rhone`. Usage:
# ./deploy/remote-deploy.sh [dev|main] [--use-existing-db CONTAINER_NAME]

BRANCH=${1:-dev}
USE_EXISTING_DB="false"
EXISTING_DB_CONTAINER="postgres_db"

if [ "${2:-}" = "--use-existing-db" ] && [ -n "${3:-}" ]; then
  USE_EXISTING_DB="true"
  EXISTING_DB_CONTAINER="$3"
fi

# Detect repository root: allow two possible layouts
if [ -d "$HOME/KBServices/KBS" ]; then
  ROOT_DIR="$HOME/KBServices/KBS"
else
  ROOT_DIR="$HOME/KBServices"
fi
REPO_URL="https://github.com/DonArhouna/KBServices.git"

# Clone or update repository
if [ ! -d "$ROOT_DIR" ]; then
  echo "Cloning repo into $HOME/KBServices"
  git clone "$REPO_URL" "$HOME/KBServices"
  # if the repo contains KBS as a subdir, set ROOT_DIR accordingly
  if [ -d "$HOME/KBServices/KBS" ]; then
    ROOT_DIR="$HOME/KBServices/KBS"
  else
    ROOT_DIR="$HOME/KBServices"
  fi
fi

cd "$ROOT_DIR"
# Ensure correct branch
git fetch origin
git checkout "$BRANCH"
# Ensure we don't overwrite local config (.env) — allow local edits only for .env
LOCAL_CHANGES=$(git status --porcelain)
if [ -n "$LOCAL_CHANGES" ]; then
  # If local changes excluding .env, request user to commit or stash
  local_non_env_changes=$(echo "$LOCAL_CHANGES" | grep -v '\.env' || true)
  if [ -n "$local_non_env_changes" ]; then
    echo "You have local changes (other than .env). Please commit or stash them before pulling. Changes:\n$local_non_env_changes"
    exit 1
  else
    echo "Local changes only in .env; proceeding without overwriting it"
  fi
fi

# Pull updates from remote
git pull origin "$BRANCH"

# Check .env.prod exists
if [ ! -f .env.prod ]; then
  echo ".env.prod not found - copying example to .env.prod. Please edit it to set DB credentials and NOT commit it."
  cp .env.prod.example .env.prod || cp ./.env.prod.example .env.prod || true
  echo "Please open $ROOT_DIR/.env.prod and edit DATABASE_URL, POSTGRES_PASSWORD, and other secrets, then re-run this script." 
  exit 0
fi

# If using existing DB container, ensure it is attached to the network
if [ "$USE_EXISTING_DB" = "true" ]; then
  # Ensure we are in the docker folder
  cd "${ROOT_DIR}/docker" || true
  echo "Connecting existing Postgres container $EXISTING_DB_CONTAINER to network kbnet"
  docker network create kbnet || true
  docker network connect kbnet "$EXISTING_DB_CONTAINER" || true
  echo "Connected $EXISTING_DB_CONTAINER to kbnet"
  cd "$ROOT_DIR" || true
fi

# Use the docker deployment helper
cd "$ROOT_DIR/docker"
if [ "$USE_EXISTING_DB" = "true" ]; then
  # Ensure the deploy helper is executable (and fallback to bash if not)
  chmod +x ./deploy-docker.sh || true
  bash ./deploy-docker.sh prod --attach-existing-db "$EXISTING_DB_CONTAINER"
else
  chmod +x ./deploy-docker.sh || true
  bash ./deploy-docker.sh prod
fi

# Post-deploy: wait for API to be healthy, fail if not
echo "Checking API health at http://127.0.0.1:3001/api/health/tables"
for i in {1..10}; do
  if curl -sSf http://127.0.0.1:3001/api/health/tables >/dev/null 2>&1; then
    echo "Remote deploy smoke test passed"
    break
  fi
  echo "Waiting for API to become healthy... ($i/10)"
  sleep 3
done
if ! curl -sSf http://127.0.0.1:3001/api/health/tables >/dev/null 2>&1; then
  echo "Remote smoke test failed: API did not respond"
  # Print logs for debugging
  docker compose -f docker/docker-compose.yml -f docker/docker-compose.no-postgres.yml --env-file ../.env logs backend --tail 200 || true
  exit 1
fi

# Done
echo "Deployment finished. Check running containers: docker compose -f docker/docker-compose.yml ps"
