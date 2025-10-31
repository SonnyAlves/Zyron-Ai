/**
 * Zyron AI - Conversation API Endpoint
 * Get messages and graph data for a specific conversation
 */

import {
  getConversationMessages,
  getConversationNodes,
  getConversationEdges
} from '../../lib/supabase-service.js';

export const config = {
  runtime: 'nodejs',
};

/**
 * Handler for conversation operations
 * GET /api/conversations/[id] - Get all messages and graph for a conversation
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

      // Get graph data (nodes + edges)
      const nodes = await getConversationNodes(id);
      const edges = await getConversationEdges(id);

      return res.status(200).json({
        conversation_id: id,
        messages: messages,
        graph: {
          nodes: nodes,
          edges: edges
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

