/**
 * Zyron AI - Messages API Endpoint
 * Get messages for a specific conversation
 */

import { getConversationMessages } from '../../../lib/supabase-service.js';

export const config = {
  runtime: 'nodejs',
};

/**
 * GET /api/conversations/messages/[id] - Get all messages in a conversation
 */
export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Conversation ID is required' });
  }

  if (req.method === 'GET') {
    try {
      const messages = await getConversationMessages(id);

      return res.status(200).json({
        conversation_id: id,
        messages: messages
      });
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      return res.status(500).json({
        error: 'Failed to fetch messages',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

