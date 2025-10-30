# 🔄 Unification de l'API - Mode Guest et Connecté

## 📋 Problème Initial

Avant les modifications, il y avait une incohérence dans la façon dont les utilisateurs guest et connectés interagissaient avec le système :

- **Mode Guest** : Appelait le backend Python qui streamait la réponse de Claude
- **Mode Connecté** : Appelait directement Supabase pour la persistance, créant une logique séparée

Cela créait :
- Duplication de code
- Logique fragmentée
- Risque de doublons dans la base de données
- Maintenance plus complexe

## ✅ Solution Implémentée

### Architecture Unifiée

**Maintenant, un seul endpoint backend sert les deux modes** :

```
┌──────────────┐
│   Frontend   │
│ (Guest/Auth) │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│  Backend Python: /chat          │
│  - Stream de Claude             │
│  - Persistance conditionnelle   │
└─────────────────────────────────┘
       │
       ├──────────► Claude API (Streaming)
       │
       └──────────► Supabase (si user_id présent)
```

### Changements Backend (`backend/src/main.py`)

#### Endpoint `/chat` Unifié

L'endpoint accepte maintenant :
- `message` : Le message de l'utilisateur (obligatoire)
- `user_id` : ID de l'utilisateur (optionnel)
- `conversation_id` : ID de la conversation (optionnel)

**Logique** :

```python
@app.post("/chat")
async def chat_stream(request: ChatRequest):
    """
    Main chat endpoint with streaming support and optional persistence.

    - Streams Claude's response in real-time (SSE format)
    - If user_id provided: saves to Supabase after streaming completes
    - If user_id is None: guest mode, no persistence

    This single endpoint serves both authenticated and guest users.
    """
```

**Comportement** :

1. **Mode Guest** (`user_id = None`) :
   - ✅ Stream la réponse de Claude
   - ❌ Pas de persistance dans Supabase

2. **Mode Connecté** (`user_id` présent) :
   - ✅ Stream la réponse de Claude
   - ✅ Sauvegarde dans Supabase APRÈS le streaming complet
   - ✅ Gère le contexte de conversation (Graph Nodes pour Visual Brain)

### Changements Frontend

#### 1. Store Zustand (`frontend/src/store/useStore.js`)

**Nouvelles fonctions** :

```javascript
// Ajouter un message localement sans persister dans Supabase
addMessageLocal: (conversationId, role, content) => { ... }

// Mettre à jour le dernier message (pour le streaming)
updateLastMessage: (content) => { ... }
```

**Pourquoi ?**
- Le backend gère maintenant la persistance
- Le frontend gère l'UI optimiste et les mises à jour en temps réel
- Évite les doublons dans Supabase

#### 2. MainLayout (`frontend/src/components/MainLayout.jsx`)

**Flux de données** :

```javascript
handleSendMessage:
  1. Ajouter message user localement (addMessageLocal)
  2. Ajouter message assistant vide localement
  3. Appeler backend avec streaming
  4. Mettre à jour le message assistant au fur et à mesure (updateLastMessage)
  5. Après streaming : recharger depuis Supabase pour avoir les IDs corrects
```

**Avantages** :
- UI réactive immédiate (optimistic updates)
- Pas de doublons
- Données persistées correctement avec IDs Supabase
- Même code pour guest et connecté

## 🎯 Résultat

### Avant
```
Guest Mode:     Frontend → Backend Python → Claude
Connected Mode: Frontend → Supabase (+ logique séparée)
```

### Après
```
Guest Mode:     Frontend → Backend Python → Claude
Connected Mode: Frontend → Backend Python → Claude + Supabase
```

## 🔍 Points Clés

1. **Un seul endpoint** : `/chat` gère les deux modes
2. **Persistance conditionnelle** : Le backend sauvegarde dans Supabase seulement si `user_id` est fourni
3. **Streaming unifié** : Même format SSE (Server-Sent Events) pour tous
4. **Pas de doublons** : Le frontend n'écrit plus directement dans Supabase pendant le chat
5. **Backend comme source de vérité** : Toute la logique métier est centralisée

## 🚀 Utilisation

### Pour les développeurs

**Mode Guest** :
```javascript
const payload = {
  message: "Bonjour",
  // user_id: undefined (pas de persistance)
}
await apiService.sendChatMessageStream(payload)
```

**Mode Connecté** :
```javascript
const payload = {
  message: "Bonjour",
  user_id: user.id,           // ← Déclenche la persistance
  conversation_id: convId     // ← Pour le contexte
}
await apiService.sendChatMessageStream(payload)
```

## 📝 Testing

Pour tester :

1. **Mode Guest** :
   - Ouvrir l'app sans se connecter
   - Envoyer un message
   - Vérifier que le streaming fonctionne
   - Vérifier qu'aucune donnée n'est sauvegardée

2. **Mode Connecté** :
   - Se connecter avec Clerk
   - Envoyer un message
   - Vérifier que le streaming fonctionne
   - Vérifier dans Supabase que les messages sont sauvegardés
   - Recharger la page et vérifier que l'historique est présent

## 🐛 Debugging

**Backend logs** :
```
🔍 BACKEND - Received streaming request:
  - message: "Bonjour"
  - user_id: "user_xxx"  (ou None pour guest)
  - conversation_id: "conv_xxx"

✅ Using conversation: conv_xxx
✅ Streaming complete. Total length: 150
💾 Saving to Supabase...
✅ Messages saved to Supabase
```

**Frontend logs** :
```
📝 Adding user message to local state...
✅ User message added to local state
📤 Sending payload to API: { message, user_id, conversation_id }
✅ Streaming complete
💾 Backend has saved messages to Supabase
🔄 Reloading messages from Supabase...
✅ Messages reloaded from Supabase
```

## ⚠️ Notes Importantes

1. **Rate Limiting** : Le backend doit implémenter un rate limiting pour les users guest
2. **Context Limit** : Les users guest n'ont pas accès au contexte de conversation (Graph Nodes)
3. **Cleanup** : Les conversations locales (mode guest) sont perdues au rafraîchissement
4. **Fallback** : Le store a des fallbacks si Supabase échoue (mode local)

## 🔮 Prochaines Étapes

- [ ] Ajouter le support du Visual Brain Graph Updates pour les users connectés
- [ ] Implémenter le rate limiting pour les guests
- [ ] Ajouter des métriques de performance
- [ ] Implémenter le retry logic avec exponential backoff
- [ ] Ajouter des tests end-to-end

