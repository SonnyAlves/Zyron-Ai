import { useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import type { Node, Edge, Message, GraphUpdate } from '../types/nodes';
import { apiService } from '../services/apiService';
import { createLogger } from '../utils/logger';

const logger = createLogger('useZyronChat');

export const useZyronChat = () => {
  const { user } = useUser();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!user) {
      logger.error('User not authenticated');
      return;
    }

    setIsLoading(true);

    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    const payload = {
      message: userMessage,
      user_id: user.id,
      conversation_id: conversationId,
    };

    logger.debug('Sending message with Clerk auth', payload);

    try {
      const data = await apiService.sendChatMessage(payload);

      // Update conversation ID
      setConversationId(data.conversation_id);

      // Add assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);

      // Update graph
      const update: GraphUpdate = data.graph_update;

      // Add new nodes
      if (update.new_nodes?.length > 0) {
        setNodes(prev => [...prev, ...update.new_nodes]);
      }

      // Activate existing nodes
      if (update.activate_nodes?.length > 0) {
        setNodes(prev => prev.map(node =>
          update.activate_nodes.includes(node.id)
            ? { ...node, energy: 0.9 }
            : node
        ));
      }

      // Add new edges
      if (update.new_edges?.length > 0) {
        setEdges(prev => [...prev, ...update.new_edges]);
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
