/**
 * Zyron AI - Version Endpoint
 * Returns version info for frontend console display
 */

export const config = {
    runtime: 'edge',
};

const BACKEND_VERSION = '2.0.0';
const BACKEND_CODENAME = 'Vercel Edition 🚀';

export default function handler(req) {
    return new Response(
        JSON.stringify({
            version: BACKEND_VERSION,
            codename: BACKEND_CODENAME,
            status: 'operational',
            api: 'Vercel',
            platform: 'JavaScript/Node.js',
            timestamp: new Date().toISOString()
        }),
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
            },
        }
    );
}

