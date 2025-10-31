# 🚨 Backend Deployment Required

## Problème Actuel

**Le backend Python n'est PAS déployé en production.**

Conséquences :
- ❌ Les messages ne sont **pas sauvegardés** dans Supabase
- ❌ Le renommage des conversations ne fonctionne **pas**
- ❌ L'historique n'est **pas persisté**

## Architecture Actuelle

```
┌──────────────────────┐
│   Frontend (Vercel)  │  ✅ Déployé
│   zyron-ai.vercel... │
└──────────┬───────────┘
           │
           │ ❌ VITE_API_URL = "not configured"
           │
           ▼
┌──────────────────────┐
│  Backend (Python)    │  ❌ NON DÉPLOYÉ
│  FastAPI + Supabase  │
│  backend/src/main.py │
└──────────────────────┘
```

## Solution : 3 Options

### Option 1 : Render.com (Recommandé - Gratuit)

1. **Créer un compte** sur [Render.com](https://render.com)

2. **Créer un Web Service** :
   - Repo : `SonnyAlves/Zyron-Ai`
   - Branch : `feature/persistence-mvp`
   - Root Directory : `backend`
   - Build Command : `pip install -r requirements.txt`
   - Start Command : `uvicorn src.main:app --host 0.0.0.0 --port $PORT`

3. **Variables d'environnement** (dans Render) :
```bash
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://wdrnogmtgjiodptdxqdd.supabase.co
SUPABASE_KEY=eyJhb...
```

4. **Récupérer l'URL** : `https://zyron-ai-backend.onrender.com`

5. **Configurer Vercel** :
```bash
cd frontend
vercel env add VITE_API_URL
# Entrer: https://zyron-ai-backend.onrender.com
vercel --prod
```

### Option 2 : Railway.app (Alternatif)

1. Créer un compte sur [Railway.app](https://railway.app)
2. Déployer depuis GitHub
3. Même configuration que Render

### Option 3 : Localhost pour tests (Temporaire)

```bash
cd backend
source venv/bin/activate  # ou venv\Scripts\activate sur Windows
uvicorn src.main:app --reload
# Backend disponible sur http://localhost:8000
```

**Pour tester en local** :
```bash
cd frontend
VITE_API_URL=http://localhost:8000 npm run dev
```

## Checklist de Déploiement

- [ ] Backend déployé sur Render/Railway
- [ ] Variables d'environnement configurées (ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_KEY)
- [ ] URL du backend récupérée (ex: https://zyron-ai-backend.onrender.com)
- [ ] `VITE_API_URL` configuré dans Vercel
- [ ] Frontend redéployé sur Vercel
- [ ] Test : Créer une conversation → Elle doit apparaître dans Supabase
- [ ] Test : Renommer une conversation → Le changement doit persister
- [ ] Test : Rafraîchir la page → L'historique doit se recharger

## Vérification

Une fois déployé, testez :

1. **Console du navigateur** :
```javascript
// Doit afficher l'URL du backend
🌐 API: https://zyron-ai-backend.onrender.com
```

2. **Backend Health Check** :
```bash
curl https://zyron-ai-backend.onrender.com/health
# Doit retourner: {"status":"ok"}
```

3. **Chat + Persistence** :
   - Envoyez un message
   - Rafraîchissez la page
   - Le message doit toujours être là ✅

## Fichiers Concernés

- `backend/src/main.py` : L'application FastAPI
- `backend/requirements.txt` : Dépendances Python
- `frontend/.env.production` : Variables Vercel (à configurer via dashboard)
- `frontend/src/services/apiService.ts` : Client API (ligne 27)

## Notes

⚠️ **Sans backend déployé** :
- Le frontend fonctionne en "mode local"
- Les données ne sont PAS sauvegardées
- Chaque refresh = perte de l'historique

✅ **Avec backend déployé** :
- Persistence complète dans Supabase
- Historique synchronisé
- Renommage de conversations fonctionnel
- Continuité entre les sessions

---

**Priorité** : 🔴 **CRITIQUE** pour que l'app soit fonctionnelle en production

