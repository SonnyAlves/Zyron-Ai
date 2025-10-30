/**
 * VERSION TEMPORAIRE pour tests sans Clerk
 * Utilise un user_id en dur : 'test-user-123'
 *
 * Pour l'utiliser :
 * 1. Renomme useZyronChat.ts en useZyronChat.clerk.ts
 * 2. Renomme useZyronChat.temp.ts en useZyronChat.ts
 */
import { useState, useCallback } from 'react';
import type { Node, Edge, Message } from '../types/nodes';
import { apiService } from '../services/apiService';
import { createLogger } from '../utils/logger';

// User temporaire pour tests
const TEMP_USER = { id: 'test-user-123' };
const logger = createLogger('useZyronChat');

export const useZyronChat = () => {
  const user = TEMP_USER; // Remplace Clerk
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (userMessage: string) => {
    setIsLoading(true);

    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    const payload = {
      message: userMessage,
      user_id: user.id,
      conversation_id: conversationId,
    };
    logger.debug('Sending message', payload);

    try {
      const data = await apiService.sendChatMessage(payload);

      // Update conversation ID
      setConversationId(data.conversation_id);

      // Add assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);

      // Update graph (if provided)
      if (data.graph_update) {
        const update = data.graph_update;

        // Add new nodes
        if (update.new_nodes && update.new_nodes.length > 0) {
          setNodes(prev => [...prev, ...update.new_nodes!]);
        }

        // Activate existing nodes
        if (update.activate_nodes && update.activate_nodes.length > 0) {
          setNodes(prev => prev.map(node =>
            update.activate_nodes!.includes(node.id)
              ? { ...node, energy: 0.9 }
              : node
          ));
        }

        // Add new edges
        if (update.new_edges && update.new_edges.length > 0) {
          setEdges(prev => [...prev, ...update.new_edges!]);
        }
      }

    } catch (error) {
      logger.error('Chat error:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.slice(0, -1));
      alert('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  }, [user, conversationId]);

  const loadConversation = useCallback(async (convId: string) => {
    try {
      const graphData = await apiService.loadConversationGraph(convId);

      setNodes(graphData.nodes || []);
      setEdges(graphData.edges || []);
      setConversationId(convId);
      logger.success('Conversation loaded');
    } catch (error) {
      logger.error('Failed to load conversation:', error);
    }
  }, []);

  const newConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setNodes([]);
    setEdges([]);
  }, []);

  return {
    messages,
    nodes,
    edges,
    isLoading,
    conversationId,
    sendMessage,
    loadConversation,
    newConversation,
  };
};
