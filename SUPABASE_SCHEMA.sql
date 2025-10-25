-- =====================================================
-- ZYRON AI - SUPABASE DATABASE SCHEMA
-- Single-User Architecture (No Collaboration/Sharing)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE
-- Synced with Clerk authentication
-- =====================================================
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. WORKSPACES TABLE
-- Private workspaces per user (no sharing)
-- =====================================================
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT '📁',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspaces_user ON workspaces(user_id);

-- =====================================================
-- 3. CONVERSATIONS TABLE
-- Chat conversations within workspaces
-- =====================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nouvelle conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_workspace ON conversations(workspace_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);

-- =====================================================
-- 4. MESSAGES TABLE
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

-- =====================================================
-- 5. GRAPH NODES TABLE
-- Visual brain graph nodes
-- =====================================================
CREATE TABLE graph_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('concept', 'topic', 'question')),
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  position_z FLOAT DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  size FLOAT DEFAULT 1.0,
  mentions_count INT DEFAULT 1,
  importance FLOAT DEFAULT 0.5,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nodes_workspace ON graph_nodes(workspace_id);

-- =====================================================
-- 6. GRAPH EDGES TABLE
-- Connections between graph nodes
-- =====================================================
CREATE TABLE graph_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_node_id UUID REFERENCES graph_nodes(id) ON DELETE CASCADE,
  target_node_id UUID REFERENCES graph_nodes(id) ON DELETE CASCADE,
  weight FLOAT DEFAULT 1.0,
  type TEXT DEFAULT 'relates_to',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_edges_workspace ON graph_edges(workspace_id);
CREATE INDEX idx_edges_source ON graph_edges(source_node_id);
CREATE INDEX idx_edges_target ON graph_edges(target_node_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- Single-user architecture: users only see their own data
-- =====================================================

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.jwt() ->> 'sub');

-- Workspaces: Users can only see their own workspaces
CREATE POLICY "Users can only see their own workspaces"
  ON workspaces FOR ALL
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Conversations: Users can only see their own conversations
CREATE POLICY "Users can only see their own conversations"
  ON conversations FOR ALL
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Messages: Users can see messages in their conversations
CREATE POLICY "Users can see messages in their conversations"
  ON messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

-- Graph Nodes: Users can see nodes in their workspaces
CREATE POLICY "Users can see nodes in their workspaces"
  ON graph_nodes FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

-- Graph Edges: Users can see edges in their workspaces
CREATE POLICY "Users can see edges in their workspaces"
  ON graph_edges FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

-- =====================================================
-- SETUP COMPLETE
-- Next steps:
-- 1. Configure Clerk webhooks to sync users
-- 2. Create default workspace for new users
-- 3. Test RLS policies
-- =====================================================
