# 🚀 Déployer le Backend - Guide Rapide

## ⚠️ CRITIQUE : Sans backend, vos messages ne sont PAS sauvegardés !

## 📋 Méthode 1 : Render.com (5 minutes - RECOMMANDÉ)

### Étape 1 : Créer un compte Render

1. Allez sur [render.com](https://render.com)
2. Cliquez sur **"Get Started"**
3. Connectez-vous avec GitHub

### Étape 2 : Déployer depuis GitHub

1. Dans le dashboard Render, cliquez sur **"New +"** → **"Web Service"**
2. Connectez votre repo GitHub `SonnyAlves/Zyron-Ai`
3. Configurez :
   - **Name** : `zyron-ai-backend`
   - **Region** : Frankfurt (ou le plus proche)
   - **Branch** : `feature/persistence-mvp`
   - **Root Directory** : `backend`
   - **Runtime** : Python 3
   - **Build Command** : 
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command** :
     ```bash
     cd src && uvicorn main:app --host 0.0.0.0 --port $PORT
     ```
   - **Plan** : Free

### Étape 3 : Configurer les Variables d'Environnement

Dans **Environment** :

```bash
ANTHROPIC_API_KEY = sk-ant-api03-... (votre clé)
SUPABASE_URL = https://wdrnogmtgjiodptdxqdd.supabase.co
SUPABASE_KEY = eyJhb... (votre clé Supabase)
```

**Comment trouver vos clés ?**

- **ANTHROPIC_API_KEY** : [console.anthropic.com](https://console.anthropic.com)
- **SUPABASE_URL** & **SUPABASE_KEY** : 
  1. Allez sur [supabase.com](https://supabase.com)
  2. Ouvrez votre projet
  3. Settings → API
  4. Copiez "Project URL" et "anon public" key

### Étape 4 : Déployer

1. Cliquez sur **"Create Web Service"**
2. Attendez 2-3 minutes
3. ✅ Votre backend est en ligne !

### Étape 5 : Récupérer l'URL

Une fois déployé, copiez l'URL : 
```
https://zyron-ai-backend.onrender.com
```

### Étape 6 : Configurer le Frontend

1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet `frontend`
3. **Settings** → **Environment Variables**
4. Ajoutez :
   ```
   VITE_API_URL = https://zyron-ai-backend.onrender.com
   ```
5. Sauvegardez et redéployez :
   ```bash
   cd frontend
   vercel --prod
   ```

---

## 📋 Méthode 2 : Railway.app (Alternative)

1. [railway.app](https://railway.app) → **"Start a New Project"**
2. **"Deploy from GitHub repo"**
3. Sélectionnez `Zyron-Ai`
4. **Root Directory** : `backend`
5. Ajoutez les mêmes variables d'environnement
6. Railway détecte automatiquement Python et lance uvicorn

---

## ✅ Vérification

### Test 1 : Backend Health Check

```bash
curl https://zyron-ai-backend.onrender.com/health
# Doit retourner: {"status":"ok"}
```

### Test 2 : Frontend Connection

1. Ouvrez votre app : https://frontend-r0mwq5yqt-zyron-ai.vercel.app
2. Ouvrez la **Console** (F12)
3. Vérifiez :
```
🌐 API: https://zyron-ai-backend.onrender.com  ✅
```

### Test 3 : Persistence

1. Envoyez un message
2. Rafraîchissez la page (F5)
3. Le message doit toujours être là ✅

---

## 🐛 Dépannage

### Erreur : "Application failed to respond"

→ Vérifiez le **Start Command** dans Render :
```bash
cd src && uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Erreur : "ANTHROPIC_API_KEY not found"

→ Allez dans **Environment** et ajoutez la variable

### Erreur : "Supabase connection failed"

→ Vérifiez que `SUPABASE_URL` et `SUPABASE_KEY` sont corrects

---

## 📊 État Actuel

| Composant | Statut | Action |
|-----------|--------|--------|
| Frontend | ✅ Déployé | Aucune |
| Backend | ❌ À déployer | **⚠️ URGENT** |
| Supabase | ✅ Configuré | Aucune |

---

## 🎯 Résultat Attendu

**AVANT** (sans backend) :
- ❌ Messages perdus au refresh
- ❌ Pas d'historique
- ❌ Conversations vides

**APRÈS** (avec backend) :
- ✅ Messages sauvegardés
- ✅ Historique persistant
- ✅ Continuité entre sessions
- ✅ Multi-device sync

---

**Temps estimé** : 5-10 minutes

**Coût** : Gratuit (plan Free de Render)

**Priorité** : 🔴 CRITIQUE

