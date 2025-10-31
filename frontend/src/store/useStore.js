import { create } from 'zustand';
import {
  conversationsService,
  messagesService,
} from '../services/supabaseService';

/**
 * SIMPLIFIED ZUSTAND STORE
 * No workspaces - Direct user → conversations → messages
 * Compatible with Python backend + Supabase simplified schema
 */
export const useStore = create((set, get) => ({
  // ============================================
  // STATE
  // ============================================
  conversations: [],
  currentConversationId: null,
  messages: [],
  loading: false,
  error: null,

  // ============================================
  // CONVERSATIONS ACTIONS
  // ============================================

  /**
   * Load all conversations for a user
   */
  loadConversations: async (userId) => {
    set({ loading: true, error: null });
    try {
      const conversations = await conversationsService.fetchByUser(userId);
      set({
        conversations,
        currentConversationId: conversations.length > 0 ? conversations[0].id : null,
        loading: false
      });
      console.log(`✅ Loaded ${conversations.length} conversations for user ${userId}`);
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      // FALLBACK: Start with empty conversations (local mode)
      console.warn('⚠️ Supabase failed, starting with empty conversations (local mode)');
      set({
        conversations: [],
        currentConversationId: null,
        loading: false,
        error: 'Mode hors ligne - Les données ne sont pas sauvegardées'
      });
    }
  },

  /**
   * Create a new conversation
   */
  createConversation: async (userId, title = 'Nouvelle conversation') => {
    try {
      const newConv = await conversationsService.create(userId, title);
      set(state => ({
        conversations: [newConv, ...state.conversations],
        currentConversationId: newConv.id,
        messages: [], // Reset messages
      }));
      console.log('✅ Conversation created:', newConv.id);
      return newConv;
    } catch (error) {
      console.error('❌ Error creating conversation:', error);

      // FALLBACK: Créer une conversation locale si Supabase échoue
      console.warn('⚠️ Supabase failed, creating local fallback conversation...');
      const fallbackConv = {
        id: `local-conv-${Date.now()}`,
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

  /**
   * Update conversation title
   */
  updateConversation: async (conversationId, updates) => {
    try {
      const updated = await conversationsService.update(conversationId, updates);
      set(state => ({
        conversations: state.conversations.map(c =>
          c.id === conversationId ? updated : c
        ),
      }));
      console.log('✅ Conversation updated:', conversationId);
    } catch (error) {
      console.error('❌ Error updating conversation:', error);
      set({ error: error.message });
    }
  },

  /**
   * Delete a conversation
   */
  deleteConversation: async (conversationId) => {
    try {
      // Check if it's a local conversation (starts with "local-")
      if (conversationId && typeof conversationId === 'string' && conversationId.startsWith('local-')) {
        // Just remove from state, no API call
        console.log('🗑️ Deleting local conversation:', conversationId);
      } else {
        await conversationsService.delete(conversationId);
      }

      set(state => {
        const remaining = state.conversations.filter(c => c.id !== conversationId);
        return {
          conversations: remaining,
          currentConversationId: remaining.length > 0 ? remaining[0].id : null,
          messages: [],
        };
      });
      console.log('✅ Conversation deleted:', conversationId);
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      set({ error: error.message });
    }
  },

  /**
   * Set current conversation
   */
  setCurrentConversation: (conversationId) => {
    set({ currentConversationId: conversationId });
    console.log('📌 Current conversation set to:', conversationId);
  },

  // ============================================
  // MESSAGES ACTIONS
  // ============================================

  /**
   * Load messages for a conversation
   */
  loadMessages: async (conversationId) => {
    // Validate conversationId
    if (!conversationId || typeof conversationId !== 'string') {
      console.warn('⚠️ Invalid conversationId:', conversationId);
      set({ messages: [], loading: false });
      return;
    }

    // Check if it's a local conversation
    if (conversationId.startsWith('local-')) {
      console.log('📦 Local conversation - skipping load from Supabase');
      set({ messages: [], loading: false });
      return;
    }

    set({ loading: true, error: null });
    try {
      const messages = await messagesService.fetchByConversation(conversationId);
      set({ messages, loading: false });
      console.log(`✅ Loaded ${messages.length} messages for conversation ${conversationId}`);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      // FALLBACK: Start with empty messages (local mode)
      console.warn('⚠️ Supabase failed, starting with empty messages (local mode)');
      set({ messages: [], loading: false });
    }
  },

  /**
   * Add message to Supabase (for when backend doesn't persist)
   * Used only if you need manual persistence
   */
  addMessage: async (conversationId, role, content) => {
    // Check if it's a local conversation
    if (conversationId && typeof conversationId === 'string' && conversationId.startsWith('local-')) {
      console.log('📦 Local conversation - adding message to local state only');
      const fallbackMessage = {
        id: `local-msg-${Date.now()}-${Math.random()}`,
        conversation_id: conversationId,
        role: role,
        content: content,
        created_at: new Date().toISOString(),
      };
      set(prevState => ({
        messages: [...prevState.messages, fallbackMessage],
      }));
      return fallbackMessage;
    }

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

      console.log('✅ Message added to Supabase:', newMessage.id);
      return newMessage;
    } catch (error) {
      console.error('❌ Error adding message:', error);

      // FALLBACK: Créer un message local si Supabase échoue
      console.warn('⚠️ Supabase failed, creating local fallback message...');
      const fallbackMessage = {
        id: `local-msg-${Date.now()}-${Math.random()}`,
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

    console.log('📝 Message added to local state');
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
  // UTILITY ACTIONS
  // ============================================

  /**
   * Reset all state (for logout)
   */
  reset: () => {
    set({
      conversations: [],
      currentConversationId: null,
      messages: [],
      loading: false,
      error: null,
    });
    console.log('🔄 Store reset');
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },
}));
