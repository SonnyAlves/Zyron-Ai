/**
 * Zyron AI - User Conversations API Endpoint
 * Get all conversations for a user
 */

import { getUserConversations } from '../../../lib/supabase-service.js';

export const config = {
  runtime: 'nodejs',
};

/**
 * GET /api/user/[userId]/conversations - Get all conversations for a user
 */
export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  if (req.method === 'GET') {
    try {
      const conversations = await getUserConversations(userId);

      return res.status(200).json({
        user_id: userId,
        conversations: conversations
      });
    } catch (error) {
      console.error('❌ Error fetching user conversations:', error);
      return res.status(500).json({
        error: 'Failed to fetch conversations',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

