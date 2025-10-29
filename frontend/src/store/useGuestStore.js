import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_GUEST_MESSAGES = 10;

export const useGuestStore = create(
  persist(
    (set, get) => ({
      // État guest
      isGuestMode: false,
      guestMessages: [],
      guestNodes: [],
      guestEdges: [],
      messageCount: 0,

      // Activer le mode guest
      enableGuestMode: () => {
        set({ isGuestMode: true });
      },

      // Ajouter un message guest
      addGuestMessage: (message) => {
        const currentCount = get().messageCount;
        console.log('📝 addGuestMessage called:', {
          role: message.role,
          content: message.content?.substring(0, 50) + '...',
          currentCount,
          currentMessages: get().guestMessages.length,
          limit: MAX_GUEST_MESSAGES
        });

        // Only count USER messages towards the limit (not assistant responses)
        if (message.role === 'user' && currentCount >= MAX_GUEST_MESSAGES) {
          console.warn('⚠️ User message limit reached!', currentCount);
          return false; // Limite atteinte
        }

        set((state) => {
          const newMessages = [...state.guestMessages, message];
          // Only increment counter for USER messages
          const newCount = message.role === 'user' ? state.messageCount + 1 : state.messageCount;
          console.log('✅ Message added to store:', {
            role: message.role,
            totalMessages: newMessages.length,
            userMessageCount: newCount
          });
          return {
            guestMessages: newMessages,
            messageCount: newCount,
          };
        });
        return true;
      },

      // Ajouter un node guest
      addGuestNode: (node) => {
        set((state) => ({
          guestNodes: [...state.guestNodes, node],
        }));
      },

      // Ajouter un edge guest
      addGuestEdge: (edge) => {
        set((state) => ({
          guestEdges: [...state.guestEdges, edge],
        }));
      },

      // Vérifier si limite atteinte
      isLimitReached: () => {
        return get().messageCount >= MAX_GUEST_MESSAGES;
      },

      // Obtenir le nombre de messages restants
      getRemainingMessages: () => {
        return MAX_GUEST_MESSAGES - get().messageCount;
      },

      // Réinitialiser le mode guest (après signup)
      resetGuestMode: () => {
        set({
          isGuestMode: false,
          guestMessages: [],
          guestNodes: [],
          guestEdges: [],
          messageCount: 0,
        });
      },

      // Obtenir les données guest pour migration
      getGuestData: () => {
        return {
          messages: get().guestMessages,
          nodes: get().guestNodes,
          edges: get().guestEdges,
        };
      },
    }),
    {
      name: 'zyron-guest-storage',
    }
  )
);
