/**
 * Streaming version of useZyronChat
 * For backends that return SSE streaming instead of JSON
 */
import { useState, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { createLogger } from '../utils/logger';

const TEMP_USER = { id: 'test-user-123' };
const logger = createLogger('StreamingChat');

export const useStreamingZyronChat = () => {
  const user = TEMP_USER;
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (userMessage: string) => {
    setIsLoading(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    const payload = {
      message: userMessage,
      user_id: user.id,
    };

    logger.debug('Sending streaming message');

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
  }, [user]);

  return {
    messages,
    isLoading,
    sendMessage,
  };
};
