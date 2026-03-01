import { create } from 'zustand';
import { MULTIPLAYER } from '@/constants/multiplayer';
import type { ChatMessage } from '@/types/multiplayer';

interface ChatStore {
  messages: ChatMessage[];
  activeChannel: 'global' | 'proximity';
  isOpen: boolean;
  unreadCount: number;

  addMessage: (msg: ChatMessage) => void;
  setChannel: (ch: 'global' | 'proximity') => void;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  resetUnread: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  activeChannel: 'global',
  isOpen: false,
  unreadCount: 0,

  addMessage: (msg) => {
    const { messages, isOpen } = get();
    const updated = [...messages, msg];
    // Keep only the latest N messages
    if (updated.length > MULTIPLAYER.chatMaxMessages) {
      updated.splice(0, updated.length - MULTIPLAYER.chatMaxMessages);
    }
    set({
      messages: updated,
      unreadCount: isOpen ? 0 : get().unreadCount + 1,
    });
  },

  setChannel: (ch) => set({ activeChannel: ch }),

  toggleChat: () => {
    const { isOpen } = get();
    set({ isOpen: !isOpen, unreadCount: isOpen ? get().unreadCount : 0 });
  },

  openChat: () => set({ isOpen: true, unreadCount: 0 }),
  closeChat: () => set({ isOpen: false }),
  resetUnread: () => set({ unreadCount: 0 }),
}));
