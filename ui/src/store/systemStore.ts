import { create } from 'zustand';
import type { Notification, Theme, User } from '../types';

interface SystemStore {
  isLoggedIn: boolean;
  user: User | null;
  theme: Theme;
  notifications: Notification[];
  showLaunchPad: boolean;
  showNotifications: boolean;

  login: (username: string, password: string) => boolean;
  logout: () => void;
  toggleTheme: () => void;
  addNotification: (title: string, message: string, type?: Notification['type']) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  toggleLaunchPad: () => void;
  closeLaunchPad: () => void;
  toggleNotifications: () => void;
}

let notifId = 1;

const USERS: Record<string, { password: string; displayName: string; isAdmin: boolean }> = {
  admin: { password: 'admin', displayName: 'Administrador', isAdmin: true },
  lgm: { password: 'lgm', displayName: 'LGM User', isAdmin: false },
};

export const useSystemStore = create<SystemStore>((set, get) => ({
  isLoggedIn: false,
  user: null,
  theme: 'light',
  notifications: [],
  showLaunchPad: false,
  showNotifications: false,

  login: (username, password) => {
    const record = USERS[username.toLowerCase()];
    if (record && record.password === password) {
      set({
        isLoggedIn: true,
        user: { username, displayName: record.displayName, isAdmin: record.isAdmin },
        showLaunchPad: false,
      });
      setTimeout(() => {
        get().addNotification('Bienvenido a LGM OS', `Sesión iniciada como ${record.displayName}`, 'success');
      }, 800);
      return true;
    }
    return false;
  },

  logout: () => set({ isLoggedIn: false, user: null, showLaunchPad: false, showNotifications: false }),

  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

  addNotification: (title, message, type = 'info') => {
    const notif: Notification = {
      id: `notif-${notifId++}`,
      title,
      message,
      type,
      timestamp: new Date(),
      read: false,
    };
    set((state) => ({ notifications: [notif, ...state.notifications].slice(0, 25) }));
  },

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearNotifications: () => set({ notifications: [] }),

  toggleLaunchPad: () =>
    set((state) => ({ showLaunchPad: !state.showLaunchPad, showNotifications: false })),

  closeLaunchPad: () => set({ showLaunchPad: false }),

  toggleNotifications: () =>
    set((state) => ({ showNotifications: !state.showNotifications, showLaunchPad: false })),
}));
