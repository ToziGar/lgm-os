import { create } from 'zustand';
import type { Notification, Theme, User } from '../types';
import { db, hashPassword, type StoredUser } from './dbService';

/* ─── Security helpers ─── */
function djb2Hash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) { h = (h * 33) ^ str.charCodeAt(i); h = h >>> 0; }
  return h.toString(16).padStart(8, '0');
}

// Input sanitization
function sanitize(input: string): string {
  return input.trim().slice(0, 64).replace(/[<>"'`]/g, '');
}

// Validate password strength
function validatePassword(pw: string): string | null {
  if (pw.length < 4) return 'La contraseña debe tener al menos 4 caracteres';
  if (pw.length > 64) return 'La contraseña es demasiado larga';
  return null;
}

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

/** Check if system needs initial setup */
export function needsSetup(): boolean {
  const config = db.getConfig();
  return !config.adminCreated;
}

interface SystemStore {
  isLoggedIn: boolean;
  user: User | null;
  theme: Theme;
  notifications: Notification[];
  showLaunchPad: boolean;
  showNotifications: boolean;
  loginError: string;
  setupStep: 'welcome' | 'admin' | 'complete';

  /* ─── Setup ─── */
  setSetupStep: (step: 'welcome' | 'admin' | 'complete') => void;
  createAdmin: (username: string, password: string, confirmPassword: string, email: string) => string | null;

  /* ─── Auth ─── */
  login: (username: string, password: string) => boolean;
  logout: () => void;
  toggleTheme: () => void;

  /* ─── Notifications ─── */
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
  } catch { /* corrupted */ }
  return { isLoggedIn: false, user: null };
}

function saveSession(user: User) {
  try { localStorage.setItem('lgmos-session', JSON.stringify({ isLoggedIn: true, user })); } catch { /* ignore */ }
}

function clearSession() {
  try { localStorage.removeItem('lgmos-session'); } catch { /* ignore */ }
}

const savedSession = loadSession();

export const useSystemStore = create<SystemStore>((set, get) => ({
  isLoggedIn: savedSession.isLoggedIn,
  user: savedSession.user,
  theme: (localStorage.getItem('lgmos-theme') as Theme) || 'dark',
  notifications: [],
  showLaunchPad: false,
  showNotifications: false,
  loginError: '',
  setupStep: 'welcome',

  /* ─── Setup: create admin account ─── */
  setSetupStep: (step) => set({ setupStep: step }),

  createAdmin: (rawUsername, rawPassword, confirmPassword, email) => {
    const username = sanitize(rawUsername).toLowerCase();
    const password = sanitize(rawPassword);

    if (!username || !password) return 'Usuario y contraseña requeridos';
    if (username.length < 3) return 'El usuario debe tener al menos 3 caracteres';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden';

    const pwErr = validatePassword(password);
    if (pwErr) return pwErr;

    // Check if user already exists
    if (db.findUserByUsername(username)) return 'El usuario ya existe';

    const salt = djb2Hash(username + 'lgmos2025');
    const hashedPw = hashPassword(password, salt);

    const newUser: StoredUser = {
      id: 'user-admin',
      username,
      displayName: 'Administrador',
      password: hashedPw,
      salt,
      email: email || '',
      isAdmin: true,
      status: 'active',
      groups: ['administrators', 'users'],
      createdAt: new Date().toISOString(),
      description: 'Cuenta de administrador creada durante la instalación',
      quota: 0,
      usedQuota: 0,
      canSMB: true,
      canFTP: true,
      canSFTP: true,
      canSSH: true,
    };

    db.addUser(newUser);

    // Add admin to built-in groups
    const groups = db.getGroups();
    const admins = groups.find(g => g.id === 'administrators');
    const usersGroup = groups.find(g => g.id === 'users');
    if (admins && !admins.members.includes('user-admin')) admins.members.push('user-admin');
    if (usersGroup && !usersGroup.members.includes('user-admin')) usersGroup.members.push('user-admin');
    db.setGroups(groups);

    // Mark system as initialized
    db.setConfig({ adminCreated: true, initialized: true });

    // Auto-login
    const user: User = { username, displayName: 'Administrador', isAdmin: true };
    saveSession(user);
    set({ isLoggedIn: true, user, loginError: '', setupStep: 'complete' });

    db.addLog({
      id: 'log-setup-' + Date.now(),
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'system',
      message: `Instalación completada. Administrador "${username}" creado.`,
    });

    setTimeout(() => {
      get().addNotification('Bienvenido a LGM OS', 'Instalación completada. El sistema está listo.', 'success');
    }, 500);

    return null;
  },

  /* ─── Login ─── */
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

    const storedUser = db.findUserByUsername(username);
    const valid = !!(storedUser && storedUser.password === hashPassword(password, storedUser.salt));
    recordAttempt(username, valid);

    if (valid && storedUser) {
      if (storedUser.status === 'locked') {
        set({ loginError: 'Cuenta bloqueada. Contacta al administrador.' });
        return false;
      }
      if (storedUser.status === 'inactive') {
        set({ loginError: 'Cuenta desactivada.' });
        return false;
      }

      const user: User = { username: storedUser.username, displayName: storedUser.displayName, isAdmin: storedUser.isAdmin };
      saveSession(user);

      // Update last login
      db.updateUser(storedUser.id, { lastLogin: new Date().toISOString() });

      set({ isLoggedIn: true, loginError: '', user, showLaunchPad: false });
      setTimeout(() => {
        get().addNotification('Bienvenido a LGM OS', `Sesión iniciada como ${storedUser.displayName}`, 'success');
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
    const safeTitle = String(title).slice(0, 80).replace(/[<>]/g, '');
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