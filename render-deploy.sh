#!/bin/bash

# ============================================
# RENDER DEPLOY SCRIPT
# Déploie automatiquement le backend sur Render
# ============================================

set -e  # Exit on error

echo "🚀 Déploiement du backend sur Render..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Erreur: Dossier 'backend' introuvable${NC}"
    echo "   Lancez ce script depuis la racine du projet"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}📝 Changements détectés${NC}"
    echo ""
    git status -s
    echo ""

    read -p "Voulez-vous commiter ces changements? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Get commit message
        echo -e "${BLUE}💬 Message du commit:${NC}"
        read -r COMMIT_MSG

        if [ -z "$COMMIT_MSG" ]; then
            COMMIT_MSG="deploy: backend update"
        fi

        # Add and commit
        git add backend/
        git commit -m "$COMMIT_MSG"
        echo -e "${GREEN}✅ Changements committés${NC}"
        echo ""
    fi
fi

# Push to GitHub (triggers Render deployment)
echo -e "${BLUE}📤 Push vers GitHub...${NC}"
git push origin feature/persistence-mvp

echo ""
echo -e "${GREEN}✅ Code poussé sur GitHub${NC}"
echo ""
echo -e "${BLUE}🔄 Render va détecter le push et redéployer automatiquement${NC}"
echo ""
echo "📊 Suivez le déploiement sur: https://dashboard.render.com"
echo ""
echo -e "${YELLOW}⏱️  Le déploiement prend environ 2-3 minutes${NC}"
echo ""
echo "🧪 Pour tester le backend une fois déployé:"
echo "   curl https://votre-backend.onrender.com/version"
echo ""
echo -e "${GREEN}✨ Déploiement lancé!${NC}"

