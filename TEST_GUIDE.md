# 🧪 Guide de Test - API Unifiée

## ⚡ Test Rapide

### Prérequis
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python src/main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### ✅ Checklist de Test

#### 1. Mode Guest (Sans Connexion)

- [ ] Ouvrir http://localhost:5173
- [ ] NE PAS se connecter
- [ ] Envoyer un message "Hello Zyron"
- [ ] **Vérifier** : La réponse stream correctement
- [ ] **Vérifier** : Le Visual Brain s'anime
- [ ] Rafraîchir la page (F5)
- [ ] **Vérifier** : L'historique est perdu (comportement normal)

**Logs attendus (Backend)** :
```
🔍 BACKEND - Received streaming request:
  - message: Hello Zyron
  - user_id: None
  - conversation_id: None
👤 Guest mode - no persistence
✅ Streaming complete. Total length: XXX
```

#### 2. Mode Connecté (Avec Authentification)

- [ ] Cliquer sur "Sign In" / "Se connecter"
- [ ] Se connecter avec Clerk
- [ ] Attendre le chargement des workspaces
- [ ] Envoyer un message "Bonjour, je suis connecté"
- [ ] **Vérifier** : La réponse stream correctement
- [ ] **Vérifier** : Le message apparaît dans le sidebar
- [ ] Rafraîchir la page (F5)
- [ ] **Vérifier** : L'historique est PRÉSENT (persisté)
- [ ] Cliquer sur la conversation dans le sidebar
- [ ] **Vérifier** : Les messages se rechargent correctement

**Logs attendus (Backend)** :
```
🔍 BACKEND - Received streaming request:
  - message: Bonjour, je suis connecté
  - user_id: user_xxx
  - conversation_id: conv_xxx
✅ Using conversation: conv_xxx
✅ Streaming complete. Total length: XXX
💾 Saving to Supabase...
✅ Messages saved to Supabase
```

**Logs attendus (Frontend)** :
```
📝 Adding user message to local state...
✅ User message added to local state
📤 Sending payload to API: {message, user_id, conversation_id}
✅ Streaming complete
💾 Backend has saved messages to Supabase
🔄 Reloading messages from Supabase...
✅ Messages reloaded from Supabase
```

#### 3. Vérification Supabase

- [ ] Ouvrir Supabase Dashboard
- [ ] Aller dans Table Editor → `messages`
- [ ] **Vérifier** : Les messages du mode connecté sont présents
- [ ] **Vérifier** : Les messages du mode guest NE sont PAS présents
- [ ] **Vérifier** : Les timestamps sont corrects
- [ ] **Vérifier** : Le `conversation_id` correspond

## 🐛 Tests de Problèmes Connus

### Test 1 : Pas de doublons

**Objectif** : Vérifier qu'un message n'est pas sauvegardé 2 fois

1. Se connecter
2. Envoyer "Test de doublon"
3. Ouvrir Supabase Dashboard
4. Compter les messages dans la table `messages`
5. **Attendu** : 2 messages (1 user + 1 assistant)
6. **Pas attendu** : 4 messages (doublon)

### Test 2 : Streaming interrompu

**Objectif** : Vérifier que le système gère bien les erreurs

1. Se connecter
2. Commencer à envoyer un message
3. Couper la connexion internet pendant le streaming
4. **Vérifier** : Message d'erreur affiché
5. **Vérifier** : L'UI ne freeze pas
6. Reconnecter internet
7. Réessayer d'envoyer un message
8. **Vérifier** : Ça fonctionne normalement

### Test 3 : Création auto de conversation

**Objectif** : Vérifier que la conversation est créée automatiquement

1. Se connecter
2. Cliquer sur "New Chat" pour avoir un workspace vide
3. Envoyer un message sans avoir de conversation sélectionnée
4. **Vérifier** : Une conversation est créée automatiquement
5. **Vérifier** : Le titre de la conversation est basé sur le premier message
6. **Vérifier** : Le message est sauvegardé

### Test 4 : Switch entre conversations

**Objectif** : Vérifier que le contexte change correctement

1. Se connecter
2. Créer conversation 1, envoyer "Message 1"
3. Créer conversation 2, envoyer "Message 2"
4. Cliquer sur conversation 1 dans le sidebar
5. **Vérifier** : "Message 1" est affiché
6. Cliquer sur conversation 2
7. **Vérifier** : "Message 2" est affiché
8. **Vérifier** : Pas de mélange de messages

## 📊 Résultats Attendus

### Mode Guest
```
✅ Streaming fonctionne
✅ Réponses rapides
✅ Visual Brain s'anime
✅ Pas de persistance
❌ Historique perdu au refresh (normal)
```

### Mode Connecté
```
✅ Streaming fonctionne
✅ Réponses rapides
✅ Visual Brain s'anime
✅ Messages persistés dans Supabase
✅ Historique disponible après refresh
✅ Conversations organisées dans sidebar
✅ Pas de doublons
```

## 🔧 Debugging

### Si le streaming ne fonctionne pas

1. **Vérifier les logs backend** :
   ```bash
   cd backend
   tail -f backend.log
   ```

2. **Vérifier la console browser** (F12) :
   - Onglet Console : chercher les erreurs
   - Onglet Network : vérifier la requête `/chat`
   - Status devrait être `200 OK`
   - Type devrait être `text/event-stream`

3. **Vérifier les variables d'environnement** :
   ```bash
   cd backend
   cat .env | grep ANTHROPIC_API_KEY
   cat .env | grep SUPABASE_URL
   ```

### Si la persistance ne fonctionne pas

1. **Vérifier Supabase** :
   - Dashboard → Settings → API
   - Vérifier que les credentials sont corrects

2. **Vérifier RLS (Row Level Security)** :
   - Dashboard → Authentication → Policies
   - Vérifier que les policies permettent l'insertion

3. **Vérifier les logs backend** :
   ```
   💾 Saving to Supabase...
   ✅ Messages saved to Supabase
   ```
   Si absent → problème de connexion Supabase

### Si il y a des doublons

1. **Vérifier que MainLayout utilise bien `addMessageLocal`** :
   ```javascript
   // ✅ Correct
   addMessageLocal(conversationId, 'user', message)

   // ❌ Incorrect (créerait des doublons)
   addMessage(conversationId, 'user', message)
   ```

2. **Vérifier les logs** :
   - Chercher "Adding user message to local state" (pas "to store")
   - Chercher "Backend has saved messages to Supabase"

## 📝 Rapport de Test

Après les tests, notez :

| Test | Guest | Connecté | Notes |
|------|-------|----------|-------|
| Streaming | ✅/❌ | ✅/❌ | |
| Visual Brain | ✅/❌ | ✅/❌ | |
| Persistance | N/A | ✅/❌ | |
| Pas de doublons | N/A | ✅/❌ | |
| Refresh page | ✅ (perte historique) | ✅ (garde historique) | |
| Switch conversations | N/A | ✅/❌ | |
| Création auto conv | N/A | ✅/❌ | |

## 🎯 Succès Critères

Pour considérer le test comme réussi :

- [ ] Mode guest fonctionne (streaming OK, pas de crash)
- [ ] Mode connecté fonctionne (streaming OK, persistance OK)
- [ ] Pas de doublons dans Supabase
- [ ] Refresh page garde l'historique (connecté)
- [ ] Visual Brain s'anime correctement
- [ ] Pas d'erreurs dans la console
- [ ] Performance acceptable (< 2s pour première réponse)

## 🚨 Si les tests échouent

1. Vérifier la documentation : `API_UNIFICATION.md`
2. Vérifier les changements : `CHANGES_SUMMARY.md`
3. Vérifier les logs backend et frontend
4. Checker Supabase Dashboard
5. Si besoin, repartir de git : `git status` et `git diff`

