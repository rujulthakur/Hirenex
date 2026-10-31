import { create } from 'zustand';

interface NotificationState {
  panelOpen: boolean;
  /** Mirrors the unread count from the notifications query so the bell badge is cheap to read. */
  unreadCount: number;
  setPanelOpen: (v: boolean) => void;
  togglePanel: () => void;
  setUnreadCount: (n: number) => void;
}

/** UI state only. The notification list itself is server data and lives in TanStack Query. */
export const useNotificationStore = create<NotificationState>((set) => ({
  panelOpen: false,
  unreadCount: 0,
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
}));
