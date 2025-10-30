import { create } from 'zustand';
import {
  workspacesService,
  conversationsService,
  messagesService,
  graphNodesService,
  graphEdgesService,
} from '../services/supabaseService';

export const useStore = create((set, get) => ({
  // ============================================
  // STATE
  // ============================================
  workspaces: [],
  currentWorkspaceId: null,
  conversations: [],
  currentConversationId: null,
  messages: [],
  graphNodes: [],
  graphEdges: [],
  loading: false,
  error: null,

  // ============================================
  // WORKSPACES ACTIONS
  // ============================================
  loadWorkspaces: async (userId) => {
    set({ loading: true, error: null });
    try {
      const workspaces = await workspacesService.fetchAll(userId);

      // Si aucun workspace, en créer un par défaut
      if (workspaces.length === 0) {
        const defaultWorkspace = await workspacesService.create(userId, {
          name: 'Mon Workspace',
          color: '#3B82F6',
        });
        set({
          workspaces: [defaultWorkspace],
          currentWorkspaceId: defaultWorkspace.id,
          loading: false
        });
      } else {
        set({
          workspaces,
          currentWorkspaceId: workspaces[0].id,
          loading: false
        });
      }
    } catch (error) {
      console.error('❌ Error loading workspaces:', error);

      // FALLBACK: Créer un workspace local en mémoire si Supabase échoue
      console.warn('⚠️ Supabase failed, creating local fallback workspace...');
      const fallbackWorkspace = {
        id: `local-workspace-${Date.now()}`,
        user_id: userId,
        name: 'Mon Workspace (Local)',
        color: '#3B82F6',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      set({
        workspaces: [fallbackWorkspace],
        currentWorkspaceId: fallbackWorkspace.id,
        error: 'Mode hors ligne - Les données ne sont pas sauvegardées',
        loading: false
      });

      console.log('✅ Local fallback workspace created:', fallbackWorkspace.id);
    }
  },

  createWorkspace: async (userId, workspaceData) => {
    try {
      const newWorkspace = await workspacesService.create(userId, workspaceData);
      set(state => ({
        workspaces: [newWorkspace, ...state.workspaces],
        currentWorkspaceId: newWorkspace.id,
      }));
      return newWorkspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      set({ error: error.message });
    }
  },

  updateWorkspace: async (workspaceId, updates) => {
    try {
      const updated = await workspacesService.update(workspaceId, updates);
      set(state => ({
        workspaces: state.workspaces.map(w =>
          w.id === workspaceId ? updated : w
        ),
      }));
    } catch (error) {
      console.error('Error updating workspace:', error);
      set({ error: error.message });
    }
  },

  deleteWorkspace: async (workspaceId) => {
    try {
      await workspacesService.delete(workspaceId);
      set(state => {
        const remaining = state.workspaces.filter(w => w.id !== workspaceId);
        return {
          workspaces: remaining,
          currentWorkspaceId: remaining.length > 0 ? remaining[0].id : null,
        };
      });
    } catch (error) {
      console.error('Error deleting workspace:', error);
      set({ error: error.message });
    }
  },

  setCurrentWorkspace: (workspaceId) => {
    set({ currentWorkspaceId: workspaceId });
  },

  // ============================================
  // CONVERSATIONS ACTIONS
  // ============================================
  loadConversations: async (workspaceId) => {
    set({ loading: true, error: null });
    try {
      const conversations = await conversationsService.fetchByWorkspace(workspaceId);
      set({
        conversations,
        currentConversationId: conversations.length > 0 ? conversations[0].id : null,
        loading: false
      });
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      // FALLBACK: Start with empty conversations (local mode)
      console.warn('⚠️ Supabase failed, starting with empty conversations (local mode)');
      set({
        conversations: [],
        currentConversationId: null,
        loading: false
      });
    }
  },

  createConversation: async (workspaceId, userId, title) => {
    try {
      const newConv = await conversationsService.create(workspaceId, userId, title);
      set(state => ({
        conversations: [newConv, ...state.conversations],
        currentConversationId: newConv.id,
        messages: [], // Reset messages
      }));
      return newConv;
    } catch (error) {
      console.error('❌ Error creating conversation:', error);

      // FALLBACK: Créer une conversation locale si Supabase échoue
      console.warn('⚠️ Supabase failed, creating local fallback conversation...');
      const fallbackConv = {
        id: `local-conv-${Date.now()}`,
        workspace_id: workspaceId,
        user_id: userId,
        title: title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      set(state => ({
        conversations: [fallbackConv, ...state.conversations],
        currentConversationId: fallbackConv.id,
        messages: [], // Reset messages
      }));

      console.log('✅ Local fallback conversation created:', fallbackConv.id);
      return fallbackConv;
    }
  },

  updateConversation: async (conversationId, updates) => {
    try {
      const updated = await conversationsService.update(conversationId, updates);
      set(state => ({
        conversations: state.conversations.map(c =>
          c.id === conversationId ? updated : c
        ),
      }));
    } catch (error) {
      console.error('Error updating conversation:', error);
      set({ error: error.message });
    }
  },

  deleteConversation: async (conversationId) => {
    try {
      await conversationsService.delete(conversationId);
      set(state => {
        const remaining = state.conversations.filter(c => c.id !== conversationId);
        return {
          conversations: remaining,
          currentConversationId: remaining.length > 0 ? remaining[0].id : null,
          messages: [],
        };
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      set({ error: error.message });
    }
  },

  setCurrentConversation: (conversationId) => {
    set({ currentConversationId: conversationId });
  },

  // ============================================
  // MESSAGES ACTIONS
  // ============================================
  loadMessages: async (conversationId) => {
    set({ loading: true, error: null });
    try {
      const messages = await messagesService.fetchByConversation(conversationId);
      set({ messages, loading: false });
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      // FALLBACK: Start with empty messages (local mode)
      console.warn('⚠️ Supabase failed, starting with empty messages (local mode)');
      set({ messages: [], loading: false });
    }
  },

  addMessage: async (conversationId, role, content) => {
    try {
      const newMessage = await messagesService.create(conversationId, role, content);

      // Use updater function to get current state without race conditions
      const state = get();
      const isFirstUserMessage = state.messages.length === 0 && role === 'user';

      set(prevState => ({
        messages: [...prevState.messages, newMessage],
      }));

      // Auto-update conversation title only for first user message
      if (isFirstUserMessage) {
        const title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
        await conversationsService.update(conversationId, { title });
        set(prevState => ({
          conversations: prevState.conversations.map(c =>
            c.id === conversationId ? { ...c, title } : c
          ),
        }));
      }

      return newMessage;
    } catch (error) {
      console.error('❌ Error adding message:', error);

      // FALLBACK: Créer un message local si Supabase échoue
      console.warn('⚠️ Supabase failed, creating local fallback message...');
      const fallbackMessage = {
        id: `local-msg-${Date.now()}`,
        conversation_id: conversationId,
        role: role,
        content: content,
        created_at: new Date().toISOString(),
      };

      // Add to messages list
      set(prevState => ({
        messages: [...prevState.messages, fallbackMessage],
      }));

      // Auto-update conversation title for first user message (local only)
      const state = get();
      const isFirstUserMessage = state.messages.filter(m => m.role === 'user').length === 1 && role === 'user';
      if (isFirstUserMessage) {
        const title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
        set(prevState => ({
          conversations: prevState.conversations.map(c =>
            c.id === conversationId ? { ...c, title } : c
          ),
        }));
      }

      console.log('✅ Local fallback message created:', fallbackMessage.id);
      return fallbackMessage;
    }
  },

  /**
   * Add message to local state only (no Supabase persistence)
   * Used when backend handles persistence (authenticated users with streaming)
   */
  addMessageLocal: (conversationId, role, content) => {
    const newMessage = {
      id: `local-msg-${Date.now()}-${Math.random()}`,
      conversation_id: conversationId,
      role: role,
      content: content,
      created_at: new Date().toISOString(),
    };

    set(prevState => ({
      messages: [...prevState.messages, newMessage],
    }));

    // Auto-update conversation title for first user message
    const state = get();
    const isFirstUserMessage = state.messages.filter(m => m.role === 'user').length === 1 && role === 'user';
    if (isFirstUserMessage) {
      const title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
      set(prevState => ({
        conversations: prevState.conversations.map(c =>
          c.id === conversationId ? { ...c, title } : c
        ),
      }));
    }

    return newMessage;
  },

  /**
   * Update the last message in the state (for streaming updates)
   */
  updateLastMessage: (content) => {
    set(prevState => {
      const messages = [...prevState.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content: content,
        };
      }
      return { messages };
    });
  },

  // ============================================
  // GRAPH ACTIONS
  // ============================================
  loadGraph: async (workspaceId) => {
    try {
      const [nodes, edges] = await Promise.all([
        graphNodesService.fetchByWorkspace(workspaceId),
        graphEdgesService.fetchByWorkspace(workspaceId),
      ]);
      set({ graphNodes: nodes, graphEdges: edges });
    } catch (error) {
      console.error('Error loading graph:', error);
      set({ error: error.message });
    }
  },

  addGraphNode: async (workspaceId, nodeData) => {
    try {
      const newNode = await graphNodesService.create(workspaceId, nodeData);
      set(state => ({
        graphNodes: [...state.graphNodes, newNode],
      }));
      return newNode;
    } catch (error) {
      console.error('Error adding graph node:', error);
      set({ error: error.message });
    }
  },

  addGraphEdge: async (workspaceId, sourceId, targetId, edgeData) => {
    try {
      const newEdge = await graphEdgesService.create(workspaceId, sourceId, targetId, edgeData);
      set(state => ({
        graphEdges: [...state.graphEdges, newEdge],
      }));
      return newEdge;
    } catch (error) {
      console.error('Error adding graph edge:', error);
      set({ error: error.message });
    }
  },
}));
