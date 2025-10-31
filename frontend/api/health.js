/**
 * Zyron AI - Health Check Endpoint
 * Simple health check for monitoring
 */

export const config = {
  runtime: 'edge', // Use edge runtime for fastest response
};

export default function handler(req) {
  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Zyron AI Backend (Vercel)'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    }
  );
}

