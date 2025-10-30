import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useStore } from '../store/useStore';
import { profilesService } from '../services/supabaseService';

/**
 * SIMPLIFIED APP INITIALIZATION
 * No workspaces - Direct: user → conversations → messages
 * Compatible with simplified architecture
 */
export const useAppInitialization = () => {
  const { user, isLoaded } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const [forceShow, setForceShow] = useState(false);

  const loadConversations = useStore(state => state.loadConversations);
  const loadMessages = useStore(state => state.loadMessages);
  const reset = useStore(state => state.reset);

  const currentConversationId = useStore(state => state.currentConversationId);

  // Step 1: Ensure profile exists in Supabase, then load conversations
  useEffect(() => {
    const initializeUser = async () => {
      if (isLoaded && user) {
        console.log('🔄 Initializing user:', user.id);

        try {
          // Ensure profile exists in Supabase (create if doesn't exist)
          console.log('👤 Checking if profile exists in Supabase...');
          await profilesService.upsert(user.id, {
            email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '',
            full_name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            avatar_url: user.imageUrl || '',
          });
          console.log('✅ Profile ensured in Supabase');

          // Now load conversations
          console.log('🔄 Loading conversations for user:', user.id);
          await loadConversations(user.id);
          console.log('✅ Conversations loaded');

          // Mark as initialized
          setIsInitialized(true);
        } catch (error) {
          console.error('❌ Error initializing user:', error);
          // Still mark as initialized to show UI (with local fallback)
          setIsInitialized(true);
        }
      }
    };

    initializeUser();
  }, [isLoaded, user, loadConversations]);

  // Step 2: Load messages when conversation is selected
  useEffect(() => {
    if (currentConversationId) {
      console.log('🔄 Loading messages for conversation:', currentConversationId);
      loadMessages(currentConversationId);
    }
  }, [currentConversationId, loadMessages]);

  // Step 3: Reset store when user logs out
  useEffect(() => {
    if (isLoaded && !user) {
      console.log('👋 User logged out - resetting store');
      reset();
      setIsInitialized(false);
    }
  }, [isLoaded, user, reset]);

  // Step 4: ABSOLUTE SAFETY TIMEOUT
  // Force show after 3 seconds to prevent infinite loading
  useEffect(() => {
    console.log('🚨 Starting ABSOLUTE safety timeout (3s)');
    const absoluteTimer = setTimeout(() => {
      if (!isInitialized) {
        console.error('🚨 ABSOLUTE TIMEOUT - Forcing UI display!');
        setForceShow(true);
        setIsInitialized(true);
      }
    }, 3000); // 3 seconds maximum

    return () => clearTimeout(absoluteTimer);
  }, []); // Empty deps - runs once on mount

  return {
    isInitialized: isInitialized || forceShow,
    user
  };
};
