/**
 * Zyron AI - Graph API Endpoint
 * DÉSACTIVÉ - Retourne un graph vide (compatibilité)
 */

export const config = {
  runtime: 'nodejs',
};

/**
 * GET /api/conversations/graph/[id] - Get graph for a conversation
 * Retourne toujours un graph vide (nodes/edges désactivés)
 */
export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Conversation ID is required' });
  }

  if (req.method === 'GET') {
    // Visual Brain désactivé - Retourne un graph vide
    return res.status(200).json({
      nodes: [],
      edges: []
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

