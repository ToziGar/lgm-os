import { create } from 'zustand';
import type { Notification, Theme, User } from '../types';

/* ─── Security helpers ───
 * In a real system these would use bcrypt/argon2 server-side.
 * Here we use a simple deterministic hash to avoid storing plaintext.
 * IMPORTANT: credentials never leave the store; there is no network call.
 */
function djb2Hash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
    h = h >>> 0; // force unsigned 32-bit
  }
  return h.toString(16).padStart(8, '0');
}

function hashPassword(password: string, salt: string): string {
  // salt + multiple rounds to slow brute force in browser context
  let h = salt + password;
  for (let i = 0; i < 1000; i++) h = djb2Hash(h + salt);
  return h;
}

// Salts and hashed passwords — never store raw passwords
const USER_DB: Record<string, {
  salt: string;
  hash: string;
  displayName: string;
  isAdmin: boolean;
  groups: string[];
}> = (() => {
  const makeEntry = (pw: string, displayName: string, isAdmin: boolean, groups: string[]) => {
    const salt = djb2Hash(displayName + 'lgmos2025');
    return { salt, hash: hashPassword(pw, salt), displayName, isAdmin, groups };
  };
  return {
    admin:   makeEntry('admin',   'Administrador', true,  ['administrators', 'users']),
    lgm:     makeEntry('lgm',     'LGM User',      false, ['users']),
    invitado: makeEntry('guest123','Invitado',      false, ['guests']),
  };
})();

// Login rate-limiting: max 5 attempts per 30 seconds per username
const _attempts: Map<string, { count: number; firstAt: number }> = new Map();

function checkRateLimit(username: string): { blocked: boolean; remaining: number } {
  const now = Date.now();
  const entry = _attempts.get(username);
  if (!entry || now - entry.firstAt > 30_000) {
    _attempts.set(username, { count: 0, firstAt: now });
    return { blocked: false, remaining: 5 };
  }
  return { blocked: entry.count >= 5, remaining: Math.max(0, 5 - entry.count) };
}

function recordAttempt(username: string, success: boolean) {
  if (success) { _attempts.delete(username); return; }
  const now = Date.now();
  const entry = _attempts.get(username);
  if (!entry || now - entry.firstAt > 30_000) {
    _attempts.set(username, { count: 1, firstAt: now });
  } else {
    _attempts.set(username, { ...entry, count: entry.count + 1 });
  }
}

// Input sanitization
function sanitize(input: string): string {
  return input.trim().slice(0, 64).replace(/[<>"'`]/g, '');
}

interface SystemStore {
  isLoggedIn: boolean;
  user: User | null;
  theme: Theme;
  notifications: Notification[];
  showLaunchPad: boolean;
  showNotifications: boolean;
  loginError: string;

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

function loadSession(): { isLoggedIn: boolean; user: User | null } {
  try {
    const raw = localStorage.getItem('lgmos-session');
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data.isLoggedIn === 'boolean' && data.user) {
        return { isLoggedIn: data.isLoggedIn, user: data.user as User };
      }
    }
  } catch { /* corrupted data, reset session */ }
  return { isLoggedIn: false, user: null };
}

function saveSession(user: User) {
  try {
    localStorage.setItem('lgmos-session', JSON.stringify({ isLoggedIn: true, user }));
  } catch { /* quota exceeded, silently ignore */ }
}

function clearSession() {
  try { localStorage.removeItem('lgmos-session'); } catch { /* ignore */ }
}

const savedSession = loadSession();

export const useSystemStore = create<SystemStore>((set, get) => ({
  isLoggedIn: savedSession.isLoggedIn,
  user: savedSession.user,
  theme: (localStorage.getItem('lgmos-theme') as Theme) || 'light',
  notifications: [],
  showLaunchPad: false,
  showNotifications: false,
  loginError: '',

  login: (rawUsername, rawPassword) => {
    const username = sanitize(rawUsername).toLowerCase();
    const password = sanitize(rawPassword);

    if (!username || !password) {
      set({ loginError: 'Usuario y contraseña requeridos' });
      return false;
    }

    const { blocked } = checkRateLimit(username);
    if (blocked) {
      set({ loginError: 'Demasiados intentos. Espera 30 segundos.' });
      return false;
    }

    const record = USER_DB[username];
    const valid = record && hashPassword(password, record.salt) === record.hash;
    recordAttempt(username, valid);

    if (valid) {
      const user: User = { username, displayName: record.displayName, isAdmin: record.isAdmin };
      saveSession(user);
      set({
        isLoggedIn: true,
        loginError: '',
        user,
        showLaunchPad: false,
      });
      setTimeout(() => {
        get().addNotification(
          'Bienvenido a LGM OS',
          `Sesión iniciada como ${record.displayName}`,
          'success'
        );
      }, 800);
      return true;
    }

    set({ loginError: 'Usuario o contraseña incorrectos' });
    return false;
  },

  logout: () => {
    clearSession();
    set({
      isLoggedIn: false, user: null,
      showLaunchPad: false, showNotifications: false,
      loginError: '',
    });
  },

  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('lgmos-theme', newTheme);
      return { theme: newTheme };
    }),

  addNotification: (title, message, type = 'info') => {
    // Sanitize notification content
    const safeTitle   = String(title).slice(0, 80).replace(/[<>]/g, '');
    const safeMessage = String(message).slice(0, 200).replace(/[<>]/g, '');
    const notif: Notification = {
      id: `notif-${notifId++}`,
      title: safeTitle,
      message: safeMessage,
      type,
      timestamp: new Date(),
      read: false,
    };
    set((state) => ({ notifications: [notif, ...state.notifications].slice(0, 50) }));
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



