/**
 * Zyron AI - Supabase Service
 * Database operations for conversations, messages, nodes, and edges
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
 * Create a new node
 * @param {string} conversationId - Conversation ID
 * @param {string} messageId - Message ID
 * @param {Object} nodeData - Node data (id, type, label, energy)
 * @returns {Promise<Object>} Created node
 */
export async function createNode(conversationId, messageId, nodeData) {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('nodes')
        .insert({
            conversation_id: conversationId,
            message_id: messageId,
            id: nodeData.id,
            type: nodeData.type,
            label: nodeData.label,
            energy: nodeData.energy || 0.8
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create node: ${error.message}`);
    }

    return data;
}

/**
 * Activate a node (increase energy)
 * @param {string} nodeId - Node ID
 * @param {number} energy - Energy level (0-1)
 */
export async function activateNode(nodeId, energy = 0.9) {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('nodes')
        .update({ energy: energy })
        .eq('id', nodeId);

    if (error) {
        throw new Error(`Failed to activate node: ${error.message}`);
    }
}

/**
 * Get all nodes in a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Array>} Array of nodes
 */
export async function getConversationNodes(conversationId) {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('nodes')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at');

    if (error) {
        throw new Error(`Failed to get nodes: ${error.message}`);
    }

    return data || [];
}

/**
 * Create an edge between two nodes
 * @param {string} fromNodeId - Source node ID
 * @param {string} toNodeId - Target node ID
 * @param {number} strength - Edge strength (0-1)
 * @returns {Promise<Object|null>} Created edge or null if exists
 */
export async function createEdge(fromNodeId, toNodeId, strength) {
    const supabase = getSupabaseClient();

    try {
        const { data, error } = await supabase
            .from('edges')
            .insert({
                from_node_id: fromNodeId,
                to_node_id: toNodeId,
                strength: strength
            })
            .select()
            .single();

        if (error) {
            console.log('Edge exists or error:', error.message);
            return null;
        }

        return data;
    } catch (e) {
        console.log('Edge creation error:', e);
        return null;
    }
}

/**
 * Get all edges for nodes in a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Array>} Array of edges
 */
export async function getConversationEdges(conversationId) {
    const supabase = getSupabaseClient();

    // First get all node IDs in the conversation
    const nodes = await getConversationNodes(conversationId);
    const nodeIds = nodes.map((n) => n.id);

    if (nodeIds.length === 0) {
        return [];
    }

    // Get edges where from_node_id is in the conversation
    const { data, error } = await supabase
        .from('edges')
        .select('*')
        .in('from_node_id', nodeIds);

    if (error) {
        throw new Error(`Failed to get edges: ${error.message}`);
    }

    return data || [];
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
        .order('created_at');

    if (error) {
        throw new Error(`Failed to get messages: ${error.message}`);
    }

    return data || [];
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

