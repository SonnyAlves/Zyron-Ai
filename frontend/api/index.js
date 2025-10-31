/**
 * Zyron AI - Root API Endpoint
 * Welcome message for API root
 */

export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  return new Response(
    JSON.stringify({
      status: 'Zyron AI Backend is running',
      version: '2.0.0',
      codename: 'Vercel Edition 🚀',
      platform: 'Vercel Edge Functions',
      endpoints: {
        health: '/api/health',
        version: '/api/version',
        chat: '/api/chat (POST)',
        conversations: '/api/conversations/[id]',
        graph: '/api/conversations/graph/[id]',
        messages: '/api/conversations/messages/[id]',
        userConversations: '/api/user/[userId]/conversations'
      },
      docs: 'https://github.com/your-repo/docs'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

