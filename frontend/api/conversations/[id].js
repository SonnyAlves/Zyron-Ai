/**
 * Zyron AI - Conversation API Endpoint
 * Get messages for a specific conversation
 * SIMPLIFIÉ - Graph (nodes/edges) désactivé
 */

import { getConversationMessages } from '../../lib/supabase-service.js';

export const config = {
  runtime: 'nodejs',
};

/**
 * Handler for conversation operations
 * GET /api/conversations/[id] - Get all messages (+ empty graph for compatibility)
 */
export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Conversation ID is required' });
  }

  if (req.method === 'GET') {
    try {
      // Get messages
      const messages = await getConversationMessages(id);

      return res.status(200).json({
        conversation_id: id,
        messages: messages,
        // Graph désactivé (compatibilité avec ancien code)
        graph: {
          nodes: [],
          edges: []
        }
      });
    } catch (error) {
      console.error('❌ Error fetching conversation:', error);
      return res.status(500).json({
        error: 'Failed to fetch conversation',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

