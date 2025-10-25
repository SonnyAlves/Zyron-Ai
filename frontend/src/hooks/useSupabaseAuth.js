import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';

export const useSupabaseAuth = () => {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      // Sync Clerk user to Supabase profiles table
      const syncProfile = async () => {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            full_name: user.fullName,
            avatar_url: user.imageUrl,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id'
          });

        if (error) {
          console.error('Error syncing profile:', error);
        }
      };

      syncProfile();
    }
  }, [user, isLoaded]);

  return { user, isLoaded };
};
