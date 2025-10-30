import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useStore } from '../store/useStore';

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

  // Step 1: Load conversations directly when user is ready
  useEffect(() => {
    if (isLoaded && user) {
      console.log('🔄 Loading conversations for user:', user.id);
      loadConversations(user.id);
      // Mark as initialized immediately after starting to load
      console.log('✅ App initialized - loading conversations');
      setIsInitialized(true);
    }
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
