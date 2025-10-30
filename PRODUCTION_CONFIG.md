# Configuration Production - Zyron AI

## Problèmes résolus

### 1. Appels API vers localhost en production
**Problème**: Le frontend en production appelait `http://localhost:8000/chat` au lieu de l'API de production.

**Cause**: Configuration ENV manquante pour la production et duplication du code d'appel API.

**Solution**:
- Création d'un service API centralisé ([frontend/src/services/apiService.ts](frontend/src/services/apiService.ts))
- Configuration `.env.production` pour la production
- Refactorisation de tous les composants pour utiliser le service centralisé

### 2. Duplication du code d'appel API
**Problème**: 6 fichiers différents définissaient leur propre `API_URL` et appelaient l'API directement:
- `useZyronChat.ts` → `http://localhost:8000`
- `MainLayout.jsx` → `http://localhost:8001` ou `/api`
- `ChatInterface.jsx` → `http://localhost:8001`
- `ChatPanel.jsx` → `http://localhost:8001`
- `useZyronChat.clerk.ts` → `http://localhost:8000`
- `useStreamingChat.js` → (non vérifié)

**Solution**: Tous les composants utilisent maintenant `apiService` qui centralise la configuration.

---

## Configuration des Variables d'Environnement

### 📁 Frontend Development (`.env`)
```env
VITE_API_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://wdrnogmtgjiodptdxqdd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 🚀 Frontend Production (`.env.production`)
```env
VITE_API_URL=https://zyron.com/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://wdrnogmtgjiodptdxqdd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note**: Ajustez `VITE_API_URL` selon votre architecture:
- `https://zyron.com/api` si l'API est sur le même domaine (reverse proxy)
- `https://zyron-ai.onrender.com` si l'API est sur Render.com
- `/api` si vous utilisez Vercel Serverless Functions

---

## Architecture du Service API

### 📄 [frontend/src/services/apiService.ts](frontend/src/services/apiService.ts)

Service centralisé qui:
- ✅ Lit `VITE_API_URL` depuis les variables d'environnement
- ✅ Fournit des méthodes pour tous les appels API
- ✅ Gère les erreurs de manière cohérente
- ✅ Supporte le streaming et le JSON
- ✅ Log les appels en développement

```typescript
// Usage
import { apiService } from '@/services/apiService'

// Appel JSON simple
const response = await apiService.sendChatMessage({
  message: 'Hello',
  user_id: 'user-123',
  conversation_id: 'conv-456'
})

// Appel avec streaming
const streamResponse = await apiService.sendChatMessageStream({
  message: 'Hello',
  user_id: 'user-123'
})
```

---

## Fichiers Modifiés

### ✅ Refactorisés pour utiliser `apiService`
1. **[frontend/src/hooks/useZyronChat.ts](frontend/src/hooks/useZyronChat.ts)** (ligne 11, 43, 85)
2. **[frontend/src/components/MainLayout.jsx](frontend/src/components/MainLayout.jsx)** (ligne 9, 110)
3. **[frontend/src/components/ChatInterface.jsx](frontend/src/components/ChatInterface.jsx)** (ligne 3, 53)
4. **[frontend/src/components/ChatPanel.jsx](frontend/src/components/ChatPanel.jsx)** (ligne 3, 49)
5. **[frontend/src/components/GuestChatLayout.jsx](frontend/src/components/GuestChatLayout.jsx)** (utilise `useZyronChat`)

### 📝 Nouveaux fichiers
- **[frontend/.env.production](frontend/.env.production)** - Variables ENV pour production
- **[frontend/src/services/apiService.ts](frontend/src/services/apiService.ts)** - Service API centralisé

---

## Déploiement sur Vercel

### 1. Variables d'environnement Vercel

Ajoutez ces variables dans le dashboard Vercel (Settings → Environment Variables):

```
VITE_API_URL=https://zyron.com/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Z3Jvd2luZy1nb3NoYXdrLTkuY2xlcmsuYWNjb3VudHMuZGV2JA
VITE_SUPABASE_URL=https://wdrnogmtgjiodptdxqdd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: Définissez ces variables pour l'environnement `Production`.

### 2. Build Command

Vérifiez que le build command dans Vercel utilise bien `.env.production`:

```bash
npm run build
# ou
yarn build
```

Vite charge automatiquement `.env.production` en mode production.

### 3. Vérification

Après déploiement, vérifiez dans la console du navigateur:
```
🔧 API URL configured: https://zyron.com/api
```

---

## Configuration Backend

### Option 1: Même domaine (Reverse Proxy)

Si votre backend est sur `https://zyron.com/api`:
```env
# .env.production
VITE_API_URL=https://zyron.com/api
```

**Avantages**:
- Pas de problème CORS
- URLs propres
- SSL automatique

### Option 2: Domaine différent (Render.com, etc.)

Si votre backend est sur Render.com:
```env
# .env.production
VITE_API_URL=https://zyron-ai.onrender.com
```

**Configuration CORS requise** sur le backend:
```python
# backend/src/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://zyron.com", "https://zyron-ai.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Option 3: Vercel Serverless Functions

Si vous utilisez des Serverless Functions Vercel:
```env
# .env.production
VITE_API_URL=/api
```

Créez `api/chat.js` dans votre projet Vercel.

---

## Tests

### Test en local
```bash
cd frontend

# Build avec config production
npm run build
npm run preview

# Vérifier dans la console:
# - API URL doit être https://zyron.com/api
# - Les appels API doivent pointer vers la bonne URL
```

### Test en staging
```bash
# Déployez sur une branche de preview Vercel
vercel --prod=false

# Vérifiez les appels réseau dans DevTools
```

---

## Checklist de Déploiement

- [ ] Variables d'environnement configurées dans Vercel
- [ ] `VITE_API_URL` pointe vers l'API de production
- [ ] Backend configure CORS correctement
- [ ] Test de l'API `/health` ou `/chat` en production
- [ ] Vérification des logs dans la console navigateur
- [ ] Test complet d'envoi de message
- [ ] Vérification que les conversations persistent (avec user_id)

---

## Troubleshooting

### Erreur: "Failed to fetch"
- Vérifiez que `VITE_API_URL` est défini dans Vercel
- Vérifiez que le backend est accessible publiquement
- Vérifiez CORS sur le backend

### Erreur: "HTTP 404"
- Vérifiez que l'endpoint existe sur le backend
- Vérifiez l'URL complète dans les logs console

### Erreur: "Address already in use" (local)
- Ce n'est plus un problème en production
- En local, utilisez les scripts de gestion du serveur

---

## Prochaines Étapes

1. **Sécurité**: Déplacer les clés sensibles vers des variables d'environnement serveur
2. **Monitoring**: Ajouter Sentry ou LogRocket pour tracker les erreurs
3. **Performance**: Ajouter un CDN pour les assets statiques
4. **Cache**: Implémenter une stratégie de cache pour les appels API

---

**Dernière mise à jour**: 2025-10-30
**Auteur**: Claude Code
**Version**: 1.0.0
