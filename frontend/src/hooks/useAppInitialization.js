import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useStore } from '../store/useStore';

export const useAppInitialization = () => {
  const { user, isLoaded } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const [forceShow, setForceShow] = useState(false);

  const loadWorkspaces = useStore(state => state.loadWorkspaces);
  const loadConversations = useStore(state => state.loadConversations);
  const loadMessages = useStore(state => state.loadMessages);
  const loadGraph = useStore(state => state.loadGraph);
  const createWorkspace = useStore(state => state.createWorkspace);
  const workspaces = useStore(state => state.workspaces);

  const currentWorkspaceId = useStore(state => state.currentWorkspaceId);
  const currentConversationId = useStore(state => state.currentConversationId);

  // Step 1: Load workspaces quand user est ready
  useEffect(() => {
    if (isLoaded && user) {
      console.log('🔄 Loading workspaces for user:', user.id);
      loadWorkspaces(user.id);
    }
  }, [isLoaded, user, loadWorkspaces]);

  // Step 1.5: Create default workspace if user has none (after workspaces loaded)
  useEffect(() => {
    if (isLoaded && user && workspaces.length === 0 && currentWorkspaceId === null) {
      console.log('📦 No workspaces found, creating default workspace...');
      createWorkspace(user.id, {
        name: 'Mon Workspace',
        description: 'Workspace par défaut'
      });
    }
  }, [isLoaded, user, workspaces, currentWorkspaceId, createWorkspace]);

  // Step 2: Load conversations quand workspace est sélectionné
  useEffect(() => {
    if (currentWorkspaceId) {
      console.log('🔄 Loading conversations for workspace:', currentWorkspaceId);
      loadConversations(currentWorkspaceId);
      loadGraph(currentWorkspaceId);
    }
  }, [currentWorkspaceId, loadConversations, loadGraph]);

  // Step 3: Load messages quand conversation est sélectionnée
  useEffect(() => {
    if (currentConversationId) {
      console.log('🔄 Loading messages for conversation:', currentConversationId);
      loadMessages(currentConversationId);
    }
  }, [currentConversationId, loadMessages]);

  // Step 4: Marquer comme initialisé dès que les workspaces sont chargés
  useEffect(() => {
    if (isLoaded && user && currentWorkspaceId !== null) {
      // Initialisé dès qu'on a un workspace (même sans conversation)
      console.log('✅ App initialized with workspace:', currentWorkspaceId);
      setIsInitialized(true);
    }
  }, [isLoaded, user, currentWorkspaceId]);

  // Step 5: SAFETY TIMEOUT - Force show after 3 seconds to prevent infinite loading
  useEffect(() => {
    if (!isInitialized && isLoaded && user) {
      console.log('⏱️ Starting safety timeout (3s)...');
      const timer = setTimeout(() => {
        if (!isInitialized) {
          console.warn('⚠️ Loading timeout - forcing show UI');
          setForceShow(true);
          setIsInitialized(true);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isInitialized, isLoaded, user]);

  return { isInitialized: isInitialized || forceShow, user };
};
