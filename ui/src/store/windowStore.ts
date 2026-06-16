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
    const id = `window-${nextWindowId++}`;
    const x = 80 + (nextWindowId % 8) * 30;
    const y = 40 + (nextWindowId % 6) * 25;

    set((state) => ({
      windows: [
        ...state.windows.map((w) => ({ ...w, isFocused: false })),
        {
          id,
          appId,
          title,
          icon,
          x,
          y,
          width,
          height,
          minWidth,
          minHeight,
          isMinimized: false,
          isMaximized: false,
          isFocused: true,
          zIndex: ++nextZIndex,
        },
      ],
    }));

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
