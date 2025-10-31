# 🚀 Déploiement Automatique du Backend sur Render

## ✅ Configuration Terminée

J'ai configuré le déploiement automatique ! **Chaque push vers GitHub déclenchera automatiquement un déploiement sur Render.**

---

## 📋 Première Configuration (À faire UNE fois)

### 1. Créer le Service sur Render

1. **Allez sur** [dashboard.render.com](https://dashboard.render.com)
2. **Cliquez** "New +" → "Web Service"
3. **Connectez** votre repo GitHub `SonnyAlves/Zyron-Ai`
4. **Render détectera automatiquement** le fichier `backend/render.yaml` ✅
5. **Cliquez** "Apply" pour utiliser la configuration
6. **Ajoutez les variables d'environnement** :
   ```
   ANTHROPIC_API_KEY = sk-ant-...
   SUPABASE_URL = https://wdrnogmtgjiodptdxqdd.supabase.co
   SUPABASE_KEY = eyJhb...
   ```
7. **Cliquez** "Create Web Service"

**C'est tout !** 🎉 Le service est maintenant configuré pour se déployer automatiquement.

---

## 🔄 Déploiement (À chaque modification)

### Méthode 1 : Script Automatique (Recommandé)

```bash
# Depuis la racine du projet
./deploy-backend.sh
```

Le script va :
1. ✅ Stager les fichiers backend
2. ✅ Créer un commit (vous pouvez ajouter un message custom)
3. ✅ Push vers GitHub
4. ✅ Render déploie automatiquement dans 2-3 minutes

### Méthode 2 : Manuelle

```bash
# 1. Commit les changements backend
git add backend/
git commit -m "update: backend changes"

# 2. Push
git push origin feature/persistence-mvp

# 3. Render déploie automatiquement ✅
```

---

## 🎯 Workflow Complet

```
1. Modifier le backend (ex: backend/src/main.py)
2. ./deploy-backend.sh (ou git push)
3. ⏳ Attendre 2-3 minutes
4. ✅ Backend déployé automatiquement !
```

---

## 📊 Suivre le Déploiement

### Dashboard Render
- [https://dashboard.render.com](https://dashboard.render.com)
- Vous verrez en temps réel :
  - 🔄 "Building..." → Installation des dépendances
  - 🚀 "Deploying..." → Lancement du serveur
  - ✅ "Live" → Backend en ligne !

### Logs en Temps Réel
Dans le dashboard Render → Votre service → Onglet "Logs"

### Vérifier la Santé
```bash
curl https://votre-backend.onrender.com/health
# {"status":"ok"}

curl https://votre-backend.onrender.com/version
# {"version":"1.0.0","codename":"Money","status":"operational","api":"Render"}
```

---

## 🔑 Configuration `render.yaml`

Le fichier `backend/render.yaml` contient toute la configuration :

```yaml
services:
  - type: web
    name: zyron-ai-backend
    runtime: python
    region: frankfurt
    plan: free
    branch: feature/persistence-mvp
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: cd src && uvicorn main:app --host 0.0.0.0 --port $PORT
    autoDeploy: true  # ✅ Déploiement automatique !
    healthCheckPath: /health
```

**`autoDeploy: true`** = Déploiement automatique à chaque push 🚀

---

## 🎯 Avantages du Déploiement Automatique

✅ **Plus rapide** : Un simple `git push` suffit
✅ **Moins d'erreurs** : Pas de configuration manuelle à chaque fois
✅ **Traçabilité** : Chaque déploiement est lié à un commit Git
✅ **Rollback facile** : Revert le commit = rollback automatique
✅ **CI/CD natif** : Build et tests automatiques

---

## 🐛 Dépannage

### Problème : Le déploiement ne se déclenche pas

**Solution** :
1. Vérifiez que `autoDeploy: true` dans `render.yaml`
2. Allez dans Render Dashboard → Settings → Build & Deploy
3. Vérifiez que "Auto-Deploy" est activé

### Problème : Build échoue

**Solution** :
1. Consultez les logs dans Render Dashboard
2. Vérifiez que `requirements.txt` contient toutes les dépendances
3. Vérifiez que les variables d'environnement sont configurées

### Problème : Health check échoue

**Solution** :
1. Vérifiez que `/health` endpoint existe
2. Vérifiez que le serveur écoute sur `$PORT`
3. Consultez les logs d'application

---

## 🔄 Mettre à Jour la Version du Backend

1. **Modifiez** `backend/src/main.py` :
   ```python
   BACKEND_VERSION = "1.0.1"  # Incrémentez
   BACKEND_CODENAME = "Power"  # Nouveau nom
   ```

2. **Déployez** :
   ```bash
   ./deploy-backend.sh
   ```

3. **Vérifiez** dans la console frontend :
   ```
   🚀 Backend v1.0.1 (Power) - operational
   ```

---

## 📈 Monitoring

### Uptime
Render monitore automatiquement le health check toutes les minutes.

### Métriques
Dashboard Render → Votre service → Onglet "Metrics" :
- CPU usage
- Memory usage
- Request count
- Response times

### Alertes
Configurez des alertes email dans Settings → Notifications

---

## 💡 Tips

### Déploiement Rapide
```bash
# Alias pour déployer rapidement
alias deploy-back="cd ~/Documents/Zyron-Ai && ./deploy-backend.sh"
```

### Vérification Post-Déploiement
```bash
# Script de vérification
curl -s https://votre-backend.onrender.com/version | json_pp
```

### Rollback Rapide
```bash
# Revenir au commit précédent
git revert HEAD
git push
# Render redéploie automatiquement l'ancienne version
```

---

## 🎉 Résumé

**Avant** :
- ❌ Déploiement manuel compliqué
- ❌ Configuration répétitive
- ❌ Risque d'erreurs

**Maintenant** :
- ✅ `git push` = déploiement automatique
- ✅ Configuration dans `render.yaml`
- ✅ Zero downtime deployments
- ✅ Logs et monitoring intégrés

---

**Prêt à déployer ?** Lancez simplement :
```bash
./deploy-backend.sh
```

🚀 **Render s'occupe du reste !**

