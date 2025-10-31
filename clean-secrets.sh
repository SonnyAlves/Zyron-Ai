#!/bin/bash

echo "🧹 Nettoyage des secrets de l'historique Git..."
echo ""

# Supprimer les fichiers .env de l'historique
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch frontend/.env frontend/.env.production frontend/.env.development .env" \
  --prune-empty --tag-name-filter cat -- --all

echo ""
echo "✅ Secrets supprimés de l'historique"
echo ""
echo "⚠️  ATTENTION: Vous devez maintenant faire:"
echo "   git push origin --force --all"
echo ""
echo "⚠️  Cela va réécrire l'historique. Informez votre équipe si vous en avez une."

