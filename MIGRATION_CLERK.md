# 🔄 Migration Supabase vers Clerk - Guide de Migration

## 📋 Problème résolu

**Erreur initiale :**
```
invalid input syntax for type uuid: "user_34Zso8yotMTFo6WLF6u0PkkqcOz"
```

**Cause :** Le schéma Supabase utilisait des UUIDs pour les IDs utilisateurs, mais Clerk utilise des IDs au format `user_xxxxx`.

---

## 🚀 Étapes de Migration

### 1. Connectez-vous à Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Ouvrez votre projet Zyron AI
3. Cliquez sur **SQL Editor** dans le menu de gauche

### 2. Sauvegardez vos données (si vous en avez)

Si vous avez déjà des données de test, exportez-les d'abord :

```sql
-- Vérifier s'il y a des données
SELECT * FROM profiles;
SELECT * FROM conversations;
SELECT * FROM messages;
```

### 3. Supprimez les anciennes tables

Copiez et exécutez ce script dans l'éditeur SQL :

```sql
-- ⚠️ ATTENTION : Ceci supprimera TOUTES vos données !
-- Ne le faire que si vous êtes en développement

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can delete messages from their conversations" ON messages;
DROP POLICY IF EXISTS "Allow all operations on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all operations on conversations" ON conversations;
DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;

-- Supprimer les triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Supprimer les vues
DROP VIEW IF EXISTS conversations_with_message_count;

-- Supprimer les tables (dans l'ordre à cause des foreign keys)
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS profiles;
```

### 4. Créez les nouvelles tables

Copiez et exécutez **tout le contenu** du fichier `supabase-schema.sql` dans l'éditeur SQL.

Le nouveau schéma contient :
- ✅ `profiles.id` en TEXT (compatible Clerk)
- ✅ `conversations.user_id` en TEXT (compatible Clerk)
- ✅ Policies RLS simplifiées (permissives pour le développement)
- ✅ Pas de dépendance à `auth.users` de Supabase

### 5. Vérifiez la création

Après l'exécution, vérifiez que tout est bien créé :

```sql
-- Vérifier les tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'conversations', 'messages');

-- Vérifier les types de colonnes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'id';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conversations' AND column_name = 'user_id';
```

Vous devriez voir :
- `profiles.id` → `text`
- `conversations.user_id` → `text`

### 6. Testez avec votre application

1. Redémarrez votre application frontend
2. Connectez-vous avec Clerk
3. Essayez d'envoyer un message
4. Vérifiez dans Supabase que les données sont bien créées :

```sql
SELECT * FROM profiles;
SELECT * FROM conversations;
SELECT * FROM messages;
```

---

## 🔒 Important - Sécurité

⚠️ **Attention** : Le schéma actuel utilise des policies RLS **très permissives** :

```sql
CREATE POLICY "Allow all operations on profiles"
    ON profiles FOR ALL
    USING (true)
    WITH CHECK (true);
```

### Pour la production, vous devrez :

1. **Option A** : Utiliser Supabase avec un service role key côté serveur
2. **Option B** : Implémenter des JWT custom claims avec Clerk
3. **Option C** : Gérer la sécurité entièrement côté API

**Recommandation** : Pour le MVP actuel, c'est suffisant si vos API Vercel valident l'utilisateur Clerk avant chaque opération.

---

## 📊 Structure finale du schéma

```
┌─────────────┐
│  profiles   │
├─────────────┤
│ id (TEXT)   │ ← Clerk user ID (ex: "user_34Zso...")
│ email       │
│ full_name   │
│ avatar_url  │
└─────────────┘
       ↑
       │
       │ (FK)
       │
┌─────────────────┐
│ conversations   │
├─────────────────┤
│ id (UUID)       │
│ user_id (TEXT)  │ ← Clerk user ID
│ title           │
└─────────────────┘
       ↑
       │
       │ (FK)
       │
┌───────────────────┐
│ messages          │
├───────────────────┤
│ id (UUID)         │
│ conversation_id   │
│ role              │
│ content           │
└───────────────────┘
```

---

## ✅ Checklist finale

- [ ] Sauvegarder les données existantes (si nécessaire)
- [ ] Supprimer les anciennes tables
- [ ] Exécuter le nouveau schéma (`supabase-schema.sql`)
- [ ] Vérifier les types de colonnes
- [ ] Tester la connexion avec Clerk
- [ ] Vérifier que les données sont créées

---

## 🆘 Dépannage

### Si vous voyez encore l'erreur UUID :
- Vérifiez que vous avez bien exécuté le nouveau schéma
- Vérifiez les types avec la requête de vérification ci-dessus
- Videz le cache de votre navigateur (`Cmd+Shift+R` ou `Ctrl+Shift+R`)

### Si les policies RLS bloquent :
```sql
-- Vérifier les policies actives
SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'conversations', 'messages');
```

### Contact Supabase Support
Si vous rencontrez des problèmes, consultez :
- [Documentation Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Discord Supabase](https://discord.supabase.com)

---

**Fait le :** 31 octobre 2025  
**Version du schéma :** 1.1 (Compatible Clerk)

