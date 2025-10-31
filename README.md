# Zyron AI

> AI assistant moderne avec Visual Brain et streaming Claude AI

Une application full-stack avec backend JavaScript sur Vercel et frontend React.

---

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev
```

Ouvrir http://localhost:3000

---

## 📂 Structure

```
Zyron-Ai/
└── frontend/
    ├── api/              # Backend (Vercel Functions)
    │   ├── chat.js      # Streaming avec Claude AI
    │   └── ...          # Autres endpoints
    ├── lib/              # Utilitaires partagés
    │   ├── prompts.js
    │   └── supabase-service.js
    ├── src/              # Frontend React
    ├── public/           # Assets statiques
    ├── .env.local        # Variables d'environnement (à créer)
    ├── package.json
    ├── vercel.json       # Configuration Vercel
    └── vite.config.js
```

---

## 🔐 Configuration

Créer `frontend/.env.local` :

```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxx
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

---

## 🔌 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `POST /api/chat` | Streaming chat avec Claude |
| `GET /api/conversations/[id]` | Récupérer une conversation |
| Plus... | Voir `frontend/api/README.md` |

---

## 🚢 Déploiement

### Vercel (automatique)

```bash
git push origin main
# → Déploiement automatique sur Vercel
```

### Configuration Vercel

1. Aller sur Vercel Dashboard
2. Ajouter les variables d'environnement
3. Déployer

---

## 🛠️ Développement

```bash
# Développement
npm run dev

# Build
npm run build

# Preview
npm run preview
```

---

## 📚 Features

- ✅ Chat streaming avec Claude AI (Anthropic)
- ✅ Visual Brain (graphe de pensée interactif)
- ✅ Persistence avec Supabase
- ✅ Authentification Clerk
- ✅ Mode invité et authentifié
- ✅ Déploiement serverless sur Vercel

---

## 🧪 Tests

```bash
# Health check
curl http://localhost:3000/api/health

# Chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!"}'
```

---

## 📖 Documentation

- **API Documentation:** `frontend/api/README.md`
- **Development Guide:** `DEVELOPMENT.md`
- **Visual Brain Guide:** `VISUAL_BRAIN_GUIDE.md`

---

## 🔧 Tech Stack

- **Frontend:** React 19 + Vite
- **Backend:** Vercel Functions (Node.js)
- **AI:** Claude AI (Anthropic SDK)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Clerk
- **3D:** Three.js + React Three Fiber

---

## 📝 License

MIT

---

**Questions ?** Consulter la documentation dans le dossier `frontend/api/`
