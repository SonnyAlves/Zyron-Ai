# ============================================
# ZYRON AI - MAKEFILE
# Commandes rapides pour le développement
# ============================================

.PHONY: help backend-deploy frontend-deploy deploy-all test-backend

# Affiche l'aide
help:
	@echo "🎯 ZYRON AI - Commandes disponibles:"
	@echo ""
	@echo "  make backend-deploy    - Déploie le backend sur Render"
	@echo "  make frontend-deploy   - Déploie le frontend sur Vercel"
	@echo "  make deploy-all        - Déploie backend + frontend"
	@echo "  make test-backend      - Teste le backend en local"
	@echo "  make clean             - Nettoie les fichiers temporaires"
	@echo ""

# Déploie le backend sur Render
backend-deploy:
	@echo "🚀 Déploiement du backend sur Render..."
	@./render-deploy.sh

# Déploie le frontend sur Vercel  
frontend-deploy:
	@echo "🚀 Déploiement du frontend sur Vercel..."
	@cd frontend && npm run build && vercel --prod

# Déploie tout
deploy-all: backend-deploy frontend-deploy
	@echo "✅ Déploiement complet terminé!"

# Test le backend en local
test-backend:
	@echo "🧪 Démarrage du backend en local..."
	@cd backend && source venv/bin/activate && cd src && uvicorn main:app --reload

# Nettoie les fichiers temporaires
clean:
	@echo "🧹 Nettoyage..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "node_modules" -prune -o -type f -name "*.pyc" -exec rm -f {} + 2>/dev/null || true
	@rm -rf frontend/dist 2>/dev/null || true
	@echo "✅ Nettoyage terminé"
