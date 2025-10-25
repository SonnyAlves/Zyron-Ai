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
          icon: '🏠',
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
      console.error('Error loading workspaces:', error);
      set({ error: error.message, loading: false });
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
      console.error('Error loading conversations:', error);
      set({ error: error.message, loading: false });
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
      console.error('Error creating conversation:', error);
      set({ error: error.message });
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
      console.error('Error loading messages:', error);
      set({ error: error.message, loading: false });
    }
  },

  addMessage: async (conversationId, role, content) => {
    try {
      const newMessage = await messagesService.create(conversationId, role, content);
      set(state => ({
        messages: [...state.messages, newMessage],
      }));

      // Auto-update conversation title si c'est le premier message user
      const state = get();
      if (state.messages.length === 1 && role === 'user') {
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
      console.error('Error adding message:', error);
      set({ error: error.message });
    }
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
