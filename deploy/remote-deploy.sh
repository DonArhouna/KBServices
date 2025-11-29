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

# Done
echo "Deployment finished. Check running containers: docker compose -f docker/docker-compose.yml ps"
