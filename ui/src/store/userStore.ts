import { create } from 'zustand';
import type { UserProfile, Group, Permission } from '../types';

/* ─── Initial data ─── */
const INITIAL_USERS: UserProfile[] = [
  {
    id: 'u-admin', username: 'admin', displayName: 'Administrador',
    email: 'admin@lgmos.local', isAdmin: true, status: 'active',
    groups: ['g-administrators', 'g-users'],
    createdAt: '01/01/2025', lastLogin: '16/06/2025 14:32',
    description: 'Cuenta de administrador del sistema',
    quota: 0, usedQuota: 0,
    canSMB: true, canFTP: true, canSFTP: true, canSSH: true,
  },
  {
    id: 'u-lgm', username: 'lgm', displayName: 'LGM User',
    email: 'lgm@lgmos.local', isAdmin: false, status: 'active',
    groups: ['g-users'],
    createdAt: '15/01/2025', lastLogin: '15/06/2025 09:10',
    description: 'Usuario estándar',
    quota: 51200, usedQuota: 12400,
    canSMB: true, canFTP: false, canSFTP: true, canSSH: false,
  },
  {
    id: 'u-guest', username: 'invitado', displayName: 'Invitado',
    email: 'guest@lgmos.local', isAdmin: false, status: 'inactive',
    groups: ['g-guests'],
    createdAt: '01/03/2025',
    description: 'Cuenta de invitado con acceso limitado',
    quota: 5120, usedQuota: 0,
    canSMB: false, canFTP: false, canSFTP: false, canSSH: false,
  },
  {
    id: 'u-backup', username: 'backup', displayName: 'Backup Service',
    email: 'backup@lgmos.local', isAdmin: false, status: 'active',
    groups: ['g-services'],
    createdAt: '01/01/2025',
    description: 'Cuenta de servicio para backups automatizados',
    quota: 0, usedQuota: 0,
    canSMB: false, canFTP: false, canSFTP: true, canSSH: true,
  },
];

const INITIAL_GROUPS: Group[] = [
  {
    id: 'g-administrators', name: 'administrators', builtIn: true,
    description: 'Acceso completo al sistema',
    members: ['u-admin'],
    permissions: { 'sf-docs': 'admin', 'sf-media': 'admin', 'sf-backup': 'admin', 'sf-web': 'admin' },
  },
  {
    id: 'g-users', name: 'users', builtIn: true,
    description: 'Usuarios estándar del sistema',
    members: ['u-admin', 'u-lgm'],
    permissions: { 'sf-docs': 'write', 'sf-media': 'read', 'sf-backup': 'none', 'sf-web': 'none' },
  },
  {
    id: 'g-guests', name: 'guests', builtIn: true,
    description: 'Acceso de solo lectura para invitados',
    members: ['u-guest'],
    permissions: { 'sf-docs': 'read', 'sf-media': 'read', 'sf-backup': 'none', 'sf-web': 'none' },
  },
  {
    id: 'g-services', name: 'services', builtIn: true,
    description: 'Cuentas de servicio del sistema',
    members: ['u-backup'],
    permissions: { 'sf-docs': 'none', 'sf-media': 'none', 'sf-backup': 'write', 'sf-web': 'none' },
  },
  {
    id: 'g-media', name: 'media', builtIn: false,
    description: 'Acceso a archivos multimedia',
    members: ['u-lgm'],
    permissions: { 'sf-docs': 'none', 'sf-media': 'write', 'sf-backup': 'none', 'sf-web': 'none' },
  },
];

/* ─── Store ─── */
let _nextId = 100;
function genId(prefix: string) { return `${prefix}-${_nextId++}`; }

// Input sanitization (OWASP A3)
function sanitize(s: string) { return String(s).trim().slice(0, 64).replace(/[<>"'`]/g, ''); }
function sanitizeEmail(s: string) {
  const t = s.trim().slice(0, 128).toLowerCase();
  // Very basic check — only allow reasonable email chars
  if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(t)) return '';
  return t;
}

interface UserStore {
  users:  UserProfile[];
  groups: Group[];

  // Users
  addUser:    (data: Omit<UserProfile, 'id' | 'createdAt'>) => { ok: boolean; error?: string };
  updateUser: (id: string, patch: Partial<UserProfile>) => { ok: boolean; error?: string };
  deleteUser: (id: string) => { ok: boolean; error?: string };
  setUserStatus: (id: string, status: UserProfile['status']) => void;
  setUserProtocols: (id: string, protocols: Pick<UserProfile, 'canSMB'|'canFTP'|'canSFTP'|'canSSH'>) => void;

  // Groups
  addGroup:    (data: Omit<Group, 'id'>) => { ok: boolean; error?: string };
  updateGroup: (id: string, patch: Partial<Group>) => { ok: boolean; error?: string };
  deleteGroup: (id: string) => { ok: boolean; error?: string };
  addGroupMember:    (groupId: string, userId: string) => void;
  removeGroupMember: (groupId: string, userId: string) => void;
  setGroupPermission: (groupId: string, folderId: string, perm: Permission) => void;

  // Queries
  getUserGroups: (userId: string) => Group[];
  getGroupUsers: (groupId: string) => UserProfile[];
  canAccess:     (userId: string, folderId: string, required: Permission) => boolean;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users:  INITIAL_USERS,
  groups: INITIAL_GROUPS,

  /* ─ Users ─ */
  addUser: (data) => {
    const username = sanitize(data.username).toLowerCase();
    const email    = sanitizeEmail(data.email ?? '');
    if (!username) return { ok: false, error: 'Nombre de usuario inválido' };
    if (username.length < 2) return { ok: false, error: 'El nombre debe tener al menos 2 caracteres' };
    if (get().users.some(u => u.username === username))
      return { ok: false, error: `El usuario "${username}" ya existe` };
    if (email === '' && data.email?.trim()) return { ok: false, error: 'Email inválido' };

    const user: UserProfile = {
      ...data,
      id: genId('u'),
      username,
      email,
      createdAt: new Date().toLocaleDateString('es-ES'),
    };
    set(s => ({ users: [...s.users, user] }));
    return { ok: true };
  },

  updateUser: (id, patch) => {
    const sanitizedPatch = { ...patch };
    if (patch.username) sanitizedPatch.username = sanitize(patch.username).toLowerCase();
    if (patch.email)    sanitizedPatch.email    = sanitizeEmail(patch.email);
    if (patch.displayName) sanitizedPatch.displayName = sanitize(patch.displayName);
    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, ...sanitizedPatch } : u),
    }));
    return { ok: true };
  },

  deleteUser: (id) => {
    const user = get().users.find(u => u.id === id);
    if (!user) return { ok: false, error: 'Usuario no encontrado' };
    if (user.username === 'admin') return { ok: false, error: 'No se puede eliminar la cuenta admin' };
    set(s => ({
      users:  s.users.filter(u => u.id !== id),
      groups: s.groups.map(g => ({ ...g, members: g.members.filter(m => m !== id) })),
    }));
    return { ok: true };
  },

  setUserStatus: (id, status) =>
    set(s => ({ users: s.users.map(u => u.id === id ? { ...u, status } : u) })),

  setUserProtocols: (id, protos) =>
    set(s => ({ users: s.users.map(u => u.id === id ? { ...u, ...protos } : u) })),

  /* ─ Groups ─ */
  addGroup: (data) => {
    const name = sanitize(data.name).toLowerCase().replace(/\s+/g, '-');
    if (!name) return { ok: false, error: 'Nombre de grupo inválido' };
    if (get().groups.some(g => g.name === name))
      return { ok: false, error: `El grupo "${name}" ya existe` };
    const group: Group = { ...data, id: genId('g'), name, builtIn: false };
    set(s => ({ groups: [...s.groups, group] }));
    return { ok: true };
  },

  updateGroup: (id, patch) => {
    set(s => ({
      groups: s.groups.map(g => g.id === id ? { ...g, ...patch } : g),
    }));
    return { ok: true };
  },

  deleteGroup: (id) => {
    const grp = get().groups.find(g => g.id === id);
    if (!grp) return { ok: false, error: 'Grupo no encontrado' };
    if (grp.builtIn) return { ok: false, error: 'Los grupos del sistema no se pueden eliminar' };
    set(s => ({
      groups: s.groups.filter(g => g.id !== id),
      users:  s.users.map(u => ({ ...u, groups: u.groups.filter(gid => gid !== id) })),
    }));
    return { ok: true };
  },

  addGroupMember: (groupId, userId) =>
    set(s => ({
      groups: s.groups.map(g =>
        g.id === groupId && !g.members.includes(userId)
          ? { ...g, members: [...g.members, userId] }
          : g
      ),
      users: s.users.map(u =>
        u.id === userId && !u.groups.includes(groupId)
          ? { ...u, groups: [...u.groups, groupId] }
          : u
      ),
    })),

  removeGroupMember: (groupId, userId) =>
    set(s => ({
      groups: s.groups.map(g =>
        g.id === groupId ? { ...g, members: g.members.filter(m => m !== userId) } : g
      ),
      users: s.users.map(u =>
        u.id === userId ? { ...u, groups: u.groups.filter(gid => gid !== groupId) } : u
      ),
    })),

  setGroupPermission: (groupId, folderId, perm) =>
    set(s => ({
      groups: s.groups.map(g =>
        g.id === groupId ? { ...g, permissions: { ...g.permissions, [folderId]: perm } } : g
      ),
    })),

  /* ─ Queries ─ */
  getUserGroups: (userId) => get().groups.filter(g => g.members.includes(userId)),

  getGroupUsers: (groupId) => {
    const grp = get().groups.find(g => g.id === groupId);
    if (!grp) return [];
    return get().users.filter(u => grp.members.includes(u.id));
  },

  canAccess: (userId, folderId, required) => {
    const user = get().users.find(u => u.id === userId);
    if (!user || user.status !== 'active') return false;
    if (user.isAdmin) return true;
    const ORDER: Permission[] = ['none', 'read', 'write', 'admin'];
    const userGroups = get().groups.filter(g => user.groups.includes(g.id));
    let highest: Permission = 'none';
    for (const g of userGroups) {
      const p = g.permissions[folderId] ?? 'none';
      if (ORDER.indexOf(p) > ORDER.indexOf(highest)) highest = p;
    }
    return ORDER.indexOf(highest) >= ORDER.indexOf(required);
  },
}));
