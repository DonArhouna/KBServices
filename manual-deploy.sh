#!/bin/bash
# Script de déploiement manuel pour contourner GitHub Actions

echo "=== DÉPLOIEMENT MANUEL ==="

# 1. Nettoyage Docker complet
echo "Nettoyage Docker..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker rmi $(docker images -q) --force 2>/dev/null || true
docker system prune -af --volumes 2>/dev/null || true

# 2. Mise à jour du code
echo "Mise à jour du code..."
git fetch origin
git checkout dev
git pull origin dev

# 3. Déploiement
echo "Déploiement..."
chmod +x deploy/remote-deploy.sh
./deploy/remote-deploy.sh dev --use-existing-db postgres_db

# 4. Vérification
echo "Vérification..."
docker ps
curl -I http://localhost || true

echo "=== DÉPLOIEMENT TERMINÉ ==="