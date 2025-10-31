/**
 * Zyron AI - Graph API Endpoint
 * Get only the graph (nodes + edges) for a conversation
 */

import {
  getConversationNodes,
  getConversationEdges
} from '../../../lib/supabase-service.js';

export const config = {
  runtime: 'nodejs',
};

/**
 * GET /api/conversations/graph/[id] - Get graph for a conversation
 */
export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Conversation ID is required' });
  }

  if (req.method === 'GET') {
    try {
      const nodes = await getConversationNodes(id);
      const edges = await getConversationEdges(id);

      return res.status(200).json({
        nodes: nodes,
        edges: edges
      });
    } catch (error) {
      console.error('❌ Error fetching graph:', error);
      return res.status(500).json({
        error: 'Failed to fetch graph',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

