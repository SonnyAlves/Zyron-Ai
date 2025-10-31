-- ============================================
-- ZYRON AI - SCHEMA SUPABASE SIMPLIFIÉ
-- ============================================
-- Version: 1.1 - Compatible avec Clerk Authentication
-- Date: 2025-10-31
--
-- Tables:
-- 1. profiles - Profils utilisateurs (compatible Clerk, IDs TEXT)
-- 2. conversations - Conversations des utilisateurs
-- 3. messages - Messages dans les conversations
--
-- ⚠️ IMPORTANT: À exécuter dans l'éditeur SQL de Supabase
-- Note: Ce schéma utilise Clerk pour l'auth, pas Supabase Auth
-- ============================================

-- ============================================
-- 1. PROFILES
-- ============================================
-- Stocke les informations de profil des utilisateurs
-- Compatible avec Clerk authentication (IDs au format "user_xxxxx")

CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);

-- RLS (Row Level Security) - Désactivé pour Clerk (géré côté application)
-- Note: Avec Clerk, l'authentification est gérée côté client/API
-- Pour activer RLS avec Clerk, utiliser un JWT custom claim
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy permissive pour développement (À RESTREINDRE EN PRODUCTION)
CREATE POLICY "Allow all operations on profiles"
    ON profiles FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 2. CONVERSATIONS
-- ============================================
-- Stocke les conversations des utilisateurs

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Nouvelle conversation',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON conversations(updated_at DESC);

-- RLS - Désactivé pour Clerk (géré côté application)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy permissive pour développement (À RESTREINDRE EN PRODUCTION)
CREATE POLICY "Allow all operations on conversations"
    ON conversations FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 3. MESSAGES
-- ============================================
-- Stocke les messages dans les conversations

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

-- RLS - Désactivé pour Clerk (géré côté application)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy permissive pour développement (À RESTREINDRE EN PRODUCTION)
CREATE POLICY "Allow all operations on messages"
    ON messages FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-update updated_at pour conversations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VUES UTILES (OPTIONNEL)
-- ============================================

-- Vue pour voir toutes les conversations avec le nombre de messages
CREATE OR REPLACE VIEW conversations_with_message_count AS
SELECT 
    c.id,
    c.user_id,
    c.title,
    c.created_at,
    c.updated_at,
    COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id, c.user_id, c.title, c.created_at, c.updated_at;

-- ============================================
-- DONNÉES DE TEST (OPTIONNEL - À SUPPRIMER EN PROD)
-- ============================================

-- Décommentez pour créer des données de test
-- Exemple avec un ID Clerk format
-- INSERT INTO profiles (id, email, full_name) VALUES 
-- ('user_2abc123def456', 'test@example.com', 'Test User');

-- INSERT INTO conversations (id, user_id, title) VALUES
-- ('11111111-1111-1111-1111-111111111111', 'user_2abc123def456', 'Ma première conversation');

-- INSERT INTO messages (conversation_id, role, content) VALUES
-- ('11111111-1111-1111-1111-111111111111', 'user', 'Bonjour Zyron!'),
-- ('11111111-1111-1111-1111-111111111111', 'assistant', 'Bonjour! Comment puis-je vous aider aujourd''hui?');

-- ============================================
-- FIN DU SCHÉMA
-- ============================================

