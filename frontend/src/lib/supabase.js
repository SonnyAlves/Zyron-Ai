import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fonction pour récupérer le token Clerk
async function getClerkToken() {
  // @ts-ignore - Clerk is injected globally
  if (window.Clerk) {
    const session = await window.Clerk.session;
    if (session) {
      return await session.getToken({ template: 'supabase' });
    }
  }
  return null;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: async () => {
      const token = await getClerkToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  },
});
