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
        if (currentCount >= MAX_GUEST_MESSAGES) {
          return false; // Limite atteinte
        }

        set((state) => ({
          guestMessages: [...state.guestMessages, message],
          messageCount: state.messageCount + 1,
        }));
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
