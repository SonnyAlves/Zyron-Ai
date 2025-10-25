import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useStore } from '../store/useStore';

export const useAppInitialization = () => {
  const { user, isLoaded } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);

  const loadWorkspaces = useStore(state => state.loadWorkspaces);
  const loadConversations = useStore(state => state.loadConversations);
  const loadMessages = useStore(state => state.loadMessages);
  const loadGraph = useStore(state => state.loadGraph);

  const currentWorkspaceId = useStore(state => state.currentWorkspaceId);
  const currentConversationId = useStore(state => state.currentConversationId);

  // Step 1: Load workspaces quand user est ready
  useEffect(() => {
    if (isLoaded && user) {
      loadWorkspaces(user.id);
    }
  }, [isLoaded, user, loadWorkspaces]);

  // Step 2: Load conversations quand workspace est sélectionné
  useEffect(() => {
    if (currentWorkspaceId) {
      loadConversations(currentWorkspaceId);
      loadGraph(currentWorkspaceId);
    }
  }, [currentWorkspaceId, loadConversations, loadGraph]);

  // Step 3: Load messages quand conversation est sélectionnée
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
      setIsInitialized(true);
    }
  }, [currentConversationId, loadMessages]);

  return { isInitialized, user };
};
