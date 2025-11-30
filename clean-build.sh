#!/bin/bash
# Script pour un build complètement propre sans Prisma

echo "=== Nettoyage complet ==="
rm -rf node_modules
rm -rf dist
rm -rf .vite
rm -rf .next
rm -rf build
rm -f package-lock.json

echo "=== Utilisation du package.json de production ==="
cp package.json package.json.backup
cp package.prod.json package.json

echo "=== Installation propre ==="
npm install

echo "=== Build frontend ==="
npm run build

echo "=== Vérification du build ==="
if [ -d "dist" ]; then
    echo "✅ Build réussi"
    ls -la dist/
else
    echo "❌ Build échoué"
    exit 1
fi