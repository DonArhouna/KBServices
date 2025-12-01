#!/usr/bin/env bash
set -euo pipefail

# deploy.sh
# Simple deployment helper script for KBServices (modify variables below to your environment).
# WARNING: This script writes .env with placeholders - do not commit secrets to git.

# Config
REPO_DIR="/home/rhone/KBServices"
DB_USER="kbs_user"
DB_PASS="StrongPassword"
DB_HOST="127.0.0.1"
DB_PORT="5432"
DB_NAME_PROD="kbs_prod"
API_PORT="3001"

cd "$REPO_DIR"

# Pull latest (assumes your remote is set and you want dev branch)
git fetch origin
# Adjust the following to your branch (dev or main)
BRANCH="dev"
git checkout "$BRANCH" || git checkout -b "$BRANCH" origin/$BRANCH
git pull origin $BRANCH

# Create .env if not present
if [ ! -f .env ]; then
  cat > .env <<EOF
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME_PROD}"
NODE_ENV="production"
API_PORT=${API_PORT}
# VITE_SUPABASE_URL="https://example.supabase.co"
# VITE_SUPABASE_ANON_KEY="your-anon-key"
EOF
  echo ".env created from template"
else
  echo ".env already exists - not overwriting"
fi

# Dependencies and Prisma
npm ci
npm run db:generate
npx prisma migrate deploy

# Build frontend
npm run build

# Restart service (systemd)
sudo systemctl restart kbs-api.service || echo "systemd service restart failed - check service config"

# Nginx reload to pick up new assets
sudo systemctl reload nginx || echo "nginx reload failed - check config"

echo "Deployment finished"
