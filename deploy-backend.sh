#!/bin/bash

# 🚀 Script de déploiement automatique du backend
# Ce script push le backend et Render le déploie automatiquement

set -e  # Stop on error

echo "🔄 Déploiement du backend Zyron AI..."
echo ""

# 1. Vérifier qu'on est dans le bon répertoire
if [ ! -f "backend/src/main.py" ]; then
    echo "❌ Erreur : backend/src/main.py introuvable"
    echo "   Exécutez ce script depuis la racine du projet"
    exit 1
fi

# 2. Git add backend
echo "📦 Staging des fichiers backend..."
git add backend/

# 3. Commit (si changements)
if git diff --staged --quiet; then
    echo "✅ Aucun changement à commiter"
else
    echo "💾 Commit des changements..."
    read -p "Message de commit (ou Enter pour message auto): " commit_msg
    if [ -z "$commit_msg" ]; then
        commit_msg="chore: update backend $(date +%Y-%m-%d_%H:%M)"
    fi
    git commit -m "$commit_msg"
fi

# 4. Push vers GitHub
echo "🚀 Push vers GitHub..."
git push origin feature/persistence-mvp

echo ""
echo "✅ Push terminé !"
echo "🎯 Render va déployer automatiquement dans ~2-3 minutes"
echo ""
echo "📊 Suivre le déploiement :"
echo "   → https://dashboard.render.com"
echo ""
echo "🔍 Vérifier la santé du backend :"
echo "   → curl https://votre-backend.onrender.com/health"
echo ""
echo "💡 Voir la version :"
echo "   → curl https://votre-backend.onrender.com/version"
echo ""

