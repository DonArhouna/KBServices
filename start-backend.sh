#!/bin/bash
# Script pour démarrer le backend simple sur le VPS

echo "🚀 Démarrage du backend KB&S..."

# Aller dans le dossier du projet
cd ~/KBServices/KBS

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install express cors
fi

# Arrêter le processus existant s'il existe
pkill -f "node.*simple-backend.js" || true

# Démarrer le serveur en arrière-plan
echo "▶️ Lancement du serveur..."
nohup node server/simple-backend.js > backend.log 2>&1 &

# Attendre que le serveur démarre
sleep 3

# Tester la connexion
echo "🔍 Test de connexion..."
if curl -s http://localhost:3001/api/health/tables > /dev/null; then
    echo "✅ Backend démarré avec succès sur le port 3001"
    echo "📊 Test de l'API health:"
    curl -s http://localhost:3001/api/health/tables | head -c 200
    echo ""
else
    echo "❌ Erreur de démarrage du backend"
    echo "📋 Logs:"
    tail -10 backend.log
fi