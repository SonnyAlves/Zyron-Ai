# 🚀 Backend Deployment Guide

## 📁 Structure

```
backend/
├── src/                     # Code source principal
│   ├── __init__.py
│   ├── main.py             # Point d'entrée FastAPI
│   ├── schemas.py          # Modèles Pydantic
│   ├── supabase_service.py # Service Supabase
│   └── prompts.py          # Prompts système
├── requirements.txt        # Dépendances Python
├── render.yaml            # Configuration Render
└── README_DEPLOY.md       # Ce fichier

```

## ⚙️ Configuration Render

### Configuration Manuelle (Dashboard)

```yaml
Name: zyron-ai-backend
Language: Python 3
Branch: feature/persistence-mvp
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn src.main:app --host 0.0.0.0 --port $PORT
Auto-Deploy: Yes
```

### Variables d'Environnement

À configurer dans Render Dashboard :

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
SUPABASE_URL=https://wdrnogmtgjiodptdxqdd.supabase.co
SUPABASE_KEY=eyJhbG...
```

## 🧪 Test Local

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Créer .env avec vos clés
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
echo "SUPABASE_URL=https://..." >> .env
echo "SUPABASE_KEY=eyJh..." >> .env

# Lancer le serveur
uvicorn src.main:app --reload --port 8000

# Tester
curl http://localhost:8000/health
curl http://localhost:8000/version
```

## ✅ Endpoints Disponibles

- `GET /` - Status principal avec version
- `GET /health` - Health check
- `GET /version` - Info version backend
- `POST /chat` - Chat streaming avec Claude

## 🔧 Dépannage

### Erreur "Could not import module main"

**Cause** : Start command incorrect
**Solution** : Utilisez `uvicorn src.main:app` (PAS `cd src && uvicorn main:app`)

### Erreur "Root Directory missing"

**Cause** : Root Directory mal configuré
**Solution** : Utilisez exactement `backend` (pas `src/backend`)

### Imports ne fonctionnent pas

**Cause** : Python ne trouve pas les modules
**Solution** : Vérifiez que le start command est `uvicorn src.main:app`

