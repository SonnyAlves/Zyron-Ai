/**
 * Streaming version of useZyronChat
 * For GUEST mode (no authentication)
 * Does NOT send user_id, so backend won't persist to Supabase
 */
import { useState, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { createLogger } from '../utils/logger';

const logger = createLogger('GuestStreamingChat');

export const useStreamingZyronChat = () => {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (userMessage: string) => {
    setIsLoading(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // GUEST MODE: No user_id, no conversation_id
    // Backend will stream but won't persist to Supabase
    const payload = {
      message: userMessage,
      // user_id: undefined → guest mode, no persistence
      // conversation_id: undefined → no context
    };

    logger.debug('Sending guest streaming message (no persistence)');

    try {
      const response = await apiService.sendChatMessageStream(payload);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines[lines.length - 1];

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];
          if (line.startsWith('data: ')) {
            const text = line.slice(6);
            if (text) {
              // Remove JSON quotes if present
              const cleanText = text.replace(/^"(.*)"$/, '$1');
              fullResponse += cleanText;

              // Update last message (assistant)
              setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages[newMessages.length - 1].role === 'assistant') {
                  newMessages[newMessages.length - 1].content = fullResponse;
                }
                return newMessages;
              });
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.startsWith('data: ')) {
        const text = buffer.slice(6);
        if (text) {
          const cleanText = text.replace(/^"(.*)"$/, '$1');
          fullResponse += cleanText;
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[newMessages.length - 1].role === 'assistant') {
              newMessages[newMessages.length - 1].content = fullResponse;
            }
            return newMessages;
          });
        }
      }

      logger.success('Streaming complete');

    } catch (error) {
      logger.error('Streaming error:', error);
      // Remove optimistic messages on error
      setMessages(prev => prev.slice(0, -2));
      alert('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies - guest mode doesn't need user context

  return {
    messages,
    isLoading,
    sendMessage,
  };
};
