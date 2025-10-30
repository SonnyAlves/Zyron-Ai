-- =====================================================
-- ZYRON AI - SIMPLIFIED SUPABASE SCHEMA
-- No Workspaces - Direct User → Conversations → Messages
-- Compatible with Python Backend
-- =====================================================

-- ⚠️ ATTENTION: Exécutez ces commandes dans l'ordre !
-- Cela va SUPPRIMER les tables existantes et leurs données

-- =====================================================
-- STEP 1: DROP OLD TABLES (Clean Slate)
-- =====================================================

DROP TABLE IF EXISTS graph_edges CASCADE;
DROP TABLE IF EXISTS graph_nodes CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- STEP 2: Enable UUID extension
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE 1: PROFILES
-- Synced with Clerk authentication
-- =====================================================

CREATE TABLE profiles (
  id TEXT PRIMARY KEY,  -- Clerk user ID
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE 2: CONVERSATIONS (SIMPLIFIED - NO WORKSPACES)
-- Direct relationship: user → conversations
-- =====================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nouvelle conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);

-- =====================================================
-- TABLE 3: MESSAGES
-- Individual messages in conversations
-- =====================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- =====================================================
-- STEP 3: DISABLE RLS (For Development)
-- =====================================================
-- Note: En production, vous voudrez activer RLS avec Clerk JWT

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- OPTIONAL: Seed data for testing
-- =====================================================

-- Insert test profile (remplacez par votre vrai Clerk ID)
-- INSERT INTO profiles (id, email, full_name)
-- VALUES ('user_test123', 'test@example.com', 'Test User');

-- Insert test conversation
-- INSERT INTO conversations (user_id, title)
-- VALUES ('user_test123', 'Test Conversation');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check conversations structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- =====================================================
-- DONE! ✅
-- Next steps:
-- 1. Verify the schema in Supabase Dashboard
-- 2. Update frontend to match this simplified structure
-- 3. Test with backend Python API
-- =====================================================

