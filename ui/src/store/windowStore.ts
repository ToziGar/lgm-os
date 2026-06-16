import { create } from 'zustand';
import type { WindowState } from '../types';

let nextZIndex = 100;
let nextWindowId = 1;

interface WindowStore {
  windows: WindowState[];
  openWindow: (
    appId: string,
    title: string,
    icon: string,
    width: number,
    height: number,
    minWidth?: number,
    minHeight?: number
  ) => string;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number, x?: number, y?: number) => void;
}

export const useWindowStore = create<WindowStore>((set) => ({
  windows: [],

  openWindow: (appId, title, icon, width, height, minWidth = 400, minHeight = 300) => {
    // Prevent duplicate windows for the same app (just focus existing)
    // (we allow multiple for terminal/text-editor)
    const SINGLE_INSTANCE = ['control-panel','file-station','package-center','system-info',
      'network-services','ssh-manager','task-manager','log-center','vpn-manager',
      'user-manager','storage-manager','zfs-panel','calculator'];

    // Clamp size to viewport minus taskbar
    const vw = window.innerWidth;
    const vh = window.innerHeight - 48; // taskbar height
    const w = Math.min(width, vw - 40);
    const h = Math.min(height, vh - 40);

    // Cascade: offset each new window by 30px
    const offset = (nextWindowId % 10) * 30;
    const x = Math.max(10, Math.min(80 + offset, vw - w - 20));
    const y = Math.max(10, Math.min(30 + offset, vh - h - 20));

    const id = `window-${nextWindowId++}`;

    set((state) => {
      // Single-instance: bring to front if already open
      if (SINGLE_INSTANCE.includes(appId)) {
        const existing = state.windows.find(win => win.appId === appId);
        if (existing) {
          return {
            windows: state.windows.map(win =>
              win.id === existing.id
                ? { ...win, isFocused: true, isMinimized: false, zIndex: ++nextZIndex }
                : { ...win, isFocused: false }
            ),
          };
        }
      }
      return {
        windows: [
          ...state.windows.map(win => ({ ...win, isFocused: false })),
          { id, appId, title, icon, x, y, width: w, height: h,
            minWidth, minHeight, isMinimized: false, isMaximized: false,
            isFocused: true, zIndex: ++nextZIndex },
        ],
      };
    });

    return id;
  },

  closeWindow: (id) =>
    set((state) => ({ windows: state.windows.filter((w) => w.id !== id) })),

  minimizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: !w.isMinimized, isFocused: !w.isMinimized } : w
      ),
    })),

  maximizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized, isMinimized: false } : w
      ),
    })),

  focusWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id
          ? { ...w, isFocused: true, zIndex: ++nextZIndex, isMinimized: false }
          : { ...w, isFocused: false }
      ),
    })),

  moveWindow: (id, x, y) =>
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    })),

  resizeWindow: (id, width, height, x?, y?) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, width, height, ...(x !== undefined ? { x } : {}), ...(y !== undefined ? { y } : {}) } : w
      ),
    })),
}));
