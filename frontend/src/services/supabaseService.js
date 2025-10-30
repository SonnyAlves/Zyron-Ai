import { supabase } from '../lib/supabase.js';

/**
 * SIMPLIFIED SUPABASE SERVICE
 * No workspaces - Direct user → conversations → messages
 * Compatible with simplified schema
 */

// ============================================
// PROFILES
// ============================================

export const profilesService = {
  // Check if profile exists
  async exists(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected for non-existent profile)
      throw error;
    }

    return !!data;
  },

  // Create or update profile (upsert)
  async upsert(userId, profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: profileData.email || '',
        full_name: profileData.full_name || profileData.fullName || '',
        avatar_url: profileData.avatar_url || profileData.imageUrl || '',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============================================
// CONVERSATIONS
// ============================================

export const conversationsService = {
  // Fetch conversations for a user (NO workspace_id)
  async fetchByUser(userId) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Créer une conversation (NO workspace_id)
  async create(userId, title = 'Nouvelle conversation') {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
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

    const { data, error} = await supabase
      .from('messages')
      .insert(inserts)
      .select();

    if (error) throw error;
    return data;
  },
};
