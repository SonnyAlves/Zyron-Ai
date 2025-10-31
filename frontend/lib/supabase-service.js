/**
 * Zyron AI - Supabase Service (Backend API)
 * SIMPLIFIÉ - Database operations pour conversations et messages uniquement
 * Utilisé par les API Vercel Functions (/api/chat.js, etc.)
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Initialize Supabase client
 */
export function getSupabaseClient() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase credentials');
    }

    return createClient(supabaseUrl, supabaseKey);
}

// ============================================
// CONVERSATIONS
// ============================================

/**
 * Get existing conversation or create new one
 * @param {string} userId - User ID
 * @param {string|null} conversationId - Optional existing conversation ID
 * @returns {Promise<Object>} Conversation object
 */
export async function getOrCreateConversation(userId, conversationId = null) {
    const supabase = getSupabaseClient();

    // If conversation ID provided, try to get it
    if (conversationId) {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .eq('user_id', userId) // Vérifier que la conversation appartient à l'utilisateur
            .single();

        if (!error && data) {
            return data;
        }
    }

    // Create new conversation
    const now = new Date();
    const title = `Conversation ${now.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit'
    })} ${now.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    })}`;

    const { data, error } = await supabase
        .from('conversations')
        .insert({
            user_id: userId,
            title: title
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return data;
}

/**
 * Get all conversations for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of conversations
 */
export async function getUserConversations(userId) {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to get conversations: ${error.message}`);
    }

    return data || [];
}

/**
 * Update conversation
 * @param {string} conversationId - Conversation ID
 * @param {Object} updates - Fields to update (e.g., { title: 'New title' })
 * @returns {Promise<Object>} Updated conversation
 */
export async function updateConversation(conversationId, updates) {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', conversationId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update conversation: ${error.message}`);
    }

    return data;
}

/**
 * Delete conversation
 * @param {string} conversationId - Conversation ID
 */
export async function deleteConversation(conversationId) {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

    if (error) {
        throw new Error(`Failed to delete conversation: ${error.message}`);
    }
}

// ============================================
// MESSAGES
// ============================================

/**
 * Save a message (user or assistant)
 * @param {string} conversationId - Conversation ID
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content - Message content
 * @returns {Promise<Object>} Created message
 */
export async function saveMessage(conversationId, role, content) {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            role: role,
            content: content
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to save message: ${error.message}`);
    }

    return data;
}

/**
 * Get all messages in a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Array>} Array of messages
 */
export async function getConversationMessages(conversationId) {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        throw new Error(`Failed to get messages: ${error.message}`);
    }

    return data || [];
}

/**
 * Delete all messages in a conversation
 * @param {string} conversationId - Conversation ID
 */
export async function deleteConversationMessages(conversationId) {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

    if (error) {
        throw new Error(`Failed to delete messages: ${error.message}`);
    }
}

// ============================================
// PROFILES (OPTIONNEL)
// ============================================

/**
 * Upsert user profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data
 * @returns {Promise<Object>} Profile object
 */
export async function upsertProfile(userId, profileData) {
    const supabase = getSupabaseClient();

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

    if (error) {
        throw new Error(`Failed to upsert profile: ${error.message}`);
    }

    return data;
}

