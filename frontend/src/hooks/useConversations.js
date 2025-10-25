import { useState, useEffect } from 'react';

const STORAGE_KEY = 'zyron_conversations';

export const useConversations = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger les conversations depuis localStorage au démarrage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConversations(parsed);

        // Charger la dernière conversation active
        const lastActive = parsed.find(c => c.isActive);
        if (lastActive) {
          setCurrentConversationId(lastActive.id);
        } else if (parsed.length > 0) {
          setCurrentConversationId(parsed[0].id);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      }
    }
    setIsLoaded(true);
  }, []);

  // Créer une première conversation si aucune n'existe
  useEffect(() => {
    if (isLoaded && conversations.length === 0) {
      createNewConversation();
    }
  }, [isLoaded]);

  // Sauvegarder les conversations dans localStorage à chaque changement
  useEffect(() => {
    if (isLoaded && conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations, isLoaded]);

  // Créer une nouvelle conversation
  const createNewConversation = () => {
    const newConversation = {
      id: Date.now().toString(),
      title: 'Nouvelle conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    setConversations(prev => {
      // Marquer toutes les autres conversations comme non-actives
      const updated = prev.map(c => ({ ...c, isActive: false }));
      return [newConversation, ...updated];
    });

    setCurrentConversationId(newConversation.id);
    return newConversation.id;
  };

  // Mettre à jour une conversation
  const updateConversation = (conversationId, messages) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        // Générer un titre basé sur le premier message utilisateur
        let title = conv.title;
        if (messages.length > 0 && conv.title === 'Nouvelle conversation') {
          const firstUserMessage = messages.find(m => m.type === 'user');
          if (firstUserMessage) {
            // Prendre les 50 premiers caractères du premier message
            title = firstUserMessage.text.substring(0, 50);
            if (firstUserMessage.text.length > 50) {
              title += '...';
            }
          }
        }

        return {
          ...conv,
          messages,
          title,
          updatedAt: new Date().toISOString(),
          isActive: true,
        };
      }
      return { ...conv, isActive: false };
    }));
  };

  // Charger une conversation
  const loadConversation = (conversationId) => {
    setCurrentConversationId(conversationId);
    setConversations(prev => prev.map(c => ({
      ...c,
      isActive: c.id === conversationId,
    })));
  };

  // Supprimer une conversation
  const deleteConversation = (conversationId) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== conversationId);

      // Si on supprime la conversation active, charger la première
      if (conversationId === currentConversationId) {
        if (filtered.length > 0) {
          setCurrentConversationId(filtered[0].id);
          filtered[0].isActive = true;
        } else {
          // Si plus de conversations, en créer une nouvelle
          const newId = createNewConversation();
          return prev; // createNewConversation va mettre à jour l'état
        }
      }

      return filtered;
    });
  };

  // Obtenir la conversation courante
  const getCurrentConversation = () => {
    return conversations.find(c => c.id === currentConversationId);
  };

  return {
    conversations,
    currentConversationId,
    createNewConversation,
    updateConversation,
    loadConversation,
    deleteConversation,
    getCurrentConversation,
    isLoaded,
  };
};
