import { supabase } from '../lib/supabase.js';

// ============================================
// WORKSPACES
// ============================================

export const workspacesService = {
  // Fetch tous les workspaces de l'user
  async fetchAll(userId) {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Créer un workspace
  async create(userId, workspaceData) {
    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        user_id: userId,
        name: workspaceData.name || 'Nouveau Workspace',
        description: workspaceData.description || '',
        color: workspaceData.color || '#3B82F6',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update workspace
  async update(workspaceId, updates) {
    const { data, error } = await supabase
      .from('workspaces')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workspaceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete workspace
  async delete(workspaceId) {
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId);

    if (error) throw error;
  },
};

// ============================================
// CONVERSATIONS
// ============================================

export const conversationsService = {
  // Fetch conversations d'un workspace
  async fetchByWorkspace(workspaceId) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Créer une conversation
  async create(workspaceId, userId, title = 'Nouvelle conversation') {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        title,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update conversation (principalement le titre)
  async update(conversationId, updates) {
    const { data, error } = await supabase
      .from('conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete conversation
  async delete(conversationId) {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  },
};

// ============================================
// MESSAGES
// ============================================

export const messagesService = {
  // Fetch messages d'une conversation
  async fetchByConversation(conversationId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Ajouter un message
  async create(conversationId, role, content) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Batch insert messages (pour optimisation)
  async createBatch(conversationId, messages) {
    const inserts = messages.map(msg => ({
      conversation_id: conversationId,
      role: msg.role,
      content: msg.content,
    }));

    const { data, error } = await supabase
      .from('messages')
      .insert(inserts)
      .select();

    if (error) throw error;
    return data;
  },
};

// ============================================
// GRAPH NODES
// ============================================

export const graphNodesService = {
  // Fetch nodes d'un workspace
  async fetchByWorkspace(workspaceId) {
    const { data, error } = await supabase
      .from('graph_nodes')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) throw error;
    return data;
  },

  // Créer un node
  async create(workspaceId, nodeData) {
    const { data, error } = await supabase
      .from('graph_nodes')
      .insert({
        workspace_id: workspaceId,
        label: nodeData.label,
        type: nodeData.type || 'concept',
        position_x: nodeData.position?.x || 0,
        position_y: nodeData.position?.y || 0,
        position_z: nodeData.position?.z || 0,
        color: nodeData.color || '#3B82F6',
        size: nodeData.size || 1.0,
        mentions_count: nodeData.mentions_count || 1,
        importance: nodeData.importance || 0.5,
        metadata: nodeData.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update node
  async update(nodeId, updates) {
    const { data, error } = await supabase
      .from('graph_nodes')
      .update(updates)
      .eq('id', nodeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete node
  async delete(nodeId) {
    const { error } = await supabase
      .from('graph_nodes')
      .delete()
      .eq('id', nodeId);

    if (error) throw error;
  },
};

// ============================================
// GRAPH EDGES
// ============================================

export const graphEdgesService = {
  // Fetch edges d'un workspace
  async fetchByWorkspace(workspaceId) {
    const { data, error } = await supabase
      .from('graph_edges')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) throw error;
    return data;
  },

  // Créer une edge
  async create(workspaceId, sourceNodeId, targetNodeId, edgeData = {}) {
    const { data, error } = await supabase
      .from('graph_edges')
      .insert({
        workspace_id: workspaceId,
        source_node_id: sourceNodeId,
        target_node_id: targetNodeId,
        weight: edgeData.weight || 1.0,
        type: edgeData.type || 'relates_to',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete edge
  async delete(edgeId) {
    const { error } = await supabase
      .from('graph_edges')
      .delete()
      .eq('id', edgeId);

    if (error) throw error;
  },
};
