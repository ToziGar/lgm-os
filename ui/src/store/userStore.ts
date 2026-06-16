import { create } from 'zustand';
import type { UserProfile, Group, Permission } from '../types';
import { db, type StoredUser, type StoredGroup } from './dbService';

/* ─── Helpers ─── */
let _nextId = 100;
function genId(prefix: string) { return `${prefix}-${_nextId++}`; }

function sanitize(s: string) { return String(s).trim().slice(0, 64).replace(/[<>"'`]/g, ''); }
function sanitizeEmail(s: string) {
  const t = s.trim().slice(0, 128).toLowerCase();
  if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(t)) return '';
  return t;
}

/* ─── Mappers ─── */
function storedToProfile(s: StoredUser): UserProfile {
  const { password: _pw, salt: _s, ...profile } = s;
  return profile as unknown as UserProfile;
}

function storedToGroup(s: StoredGroup): Group {
  return { ...s, permissions: s.permissions as Record<string, Permission> };
}

function profileToStored(p: UserProfile, password = '', salt = ''): StoredUser {
  return { ...p, password, salt } as unknown as StoredUser;
}

/* ─── Initial data from db ─── */
const initialUsers: UserProfile[] = db.getUsers().map(storedToProfile);
const initialGroups: Group[] = db.getGroups().map(storedToGroup);

interface UserStore {
  users:  UserProfile[];
  groups: Group[];

  addUser:    (data: Omit<UserProfile, 'id' | 'createdAt'>) => { ok: boolean; error?: string };
  updateUser: (id: string, patch: Partial<UserProfile>) => { ok: boolean; error?: string };
  deleteUser: (id: string) => { ok: boolean; error?: string };
  setUserStatus: (id: string, status: UserProfile['status']) => void;
  setUserProtocols: (id: string, protocols: Pick<UserProfile, 'canSMB'|'canFTP'|'canSFTP'|'canSSH'>) => void;

  addGroup:    (data: Omit<Group, 'id'>) => { ok: boolean; error?: string };
  updateGroup: (id: string, patch: Partial<Group>) => { ok: boolean; error?: string };
  deleteGroup: (id: string) => { ok: boolean; error?: string };
  addGroupMember:    (groupId: string, userId: string) => void;
  removeGroupMember: (groupId: string, userId: string) => void;
  setGroupPermission: (groupId: string, folderId: string, perm: Permission) => void;

  getUserGroups: (userId: string) => Group[];
  getGroupUsers: (groupId: string) => UserProfile[];
  canAccess:     (userId: string, folderId: string, required: Permission) => boolean;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users:  initialUsers,
  groups: initialGroups,

  /* ─ Users ─ */
  addUser: (data) => {
    const username = sanitize(data.username).toLowerCase();
    const email    = sanitizeEmail(data.email ?? '');
    if (!username) return { ok: false, error: 'Nombre de usuario inválido' };
    if (username.length < 2) return { ok: false, error: 'El nombre debe tener al menos 2 caracteres' };
    if (get().users.some(u => u.username === username))
      return { ok: false, error: `El usuario "${username}" ya existe` };
    if (email === '' && data.email?.trim()) return { ok: false, error: 'Email inválido' };

    const profile: UserProfile = {
      ...data,
      id: genId('u'),
      username,
      email,
      createdAt: new Date().toLocaleDateString('es-ES'),
    };

    const stored = profileToStored(profile);
    db.addUser(stored);
    set(s => ({ users: [...s.users, profile] }));
    return { ok: true };
  },

  updateUser: (id, patch) => {
    const sanitizedPatch = { ...patch };
    if (patch.username) sanitizedPatch.username = sanitize(patch.username).toLowerCase();
    if (patch.email)    sanitizedPatch.email    = sanitizeEmail(patch.email);
    if (patch.displayName) sanitizedPatch.displayName = sanitize(patch.displayName);

    const updated = db.updateUser(id, sanitizedPatch as Partial<StoredUser>);
    if (!updated) return { ok: false, error: 'Usuario no encontrado' };

    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, ...sanitizedPatch } : u),
    }));
    return { ok: true };
  },

  deleteUser: (id) => {
    const user = get().users.find(u => u.id === id);
    if (!user) return { ok: false, error: 'Usuario no encontrado' };
    if (user.username === 'admin') return { ok: false, error: 'No se puede eliminar la cuenta admin' };

    db.deleteUser(id);
    set(s => ({
      users:  s.users.filter(u => u.id !== id),
      groups: s.groups.map(g => ({ ...g, members: g.members.filter(m => m !== id) })),
    }));
    return { ok: true };
  },

  setUserStatus: (id, status) => {
    db.updateUser(id, { status } as Partial<StoredUser>);
    set(s => ({ users: s.users.map(u => u.id === id ? { ...u, status } : u) }));
  },

  setUserProtocols: (id, protos) => {
    db.updateUser(id, protos as Partial<StoredUser>);
    set(s => ({ users: s.users.map(u => u.id === id ? { ...u, ...protos } : u) }));
  },

  /* ─ Groups ─ */
  addGroup: (data) => {
    const name = sanitize(data.name).toLowerCase().replace(/\s+/g, '-');
    if (!name) return { ok: false, error: 'Nombre de grupo inválido' };
    if (get().groups.some(g => g.name === name))
      return { ok: false, error: `El grupo "${name}" ya existe` };
    const group: Group = { ...data, id: genId('g'), name, builtIn: false };
    db.addGroup(group as unknown as StoredGroup);
    set(s => ({ groups: [...s.groups, group] }));
    return { ok: true };
  },

  updateGroup: (id, patch) => {
    db.updateGroup(id, patch as Partial<StoredGroup>);
    set(s => ({
      groups: s.groups.map(g => g.id === id ? { ...g, ...patch } : g),
    }));
    return { ok: true };
  },

  deleteGroup: (id) => {
    const grp = get().groups.find(g => g.id === id);
    if (!grp) return { ok: false, error: 'Grupo no encontrado' };
    if (grp.builtIn) return { ok: false, error: 'Los grupos del sistema no se pueden eliminar' };

    db.deleteGroup(id);
    set(s => ({
      groups: s.groups.filter(g => g.id !== id),
      users:  s.users.map(u => ({ ...u, groups: u.groups.filter(gid => gid !== id) })),
    }));
    return { ok: true };
  },

  addGroupMember: (groupId, userId) => {
    const g = get().groups.find(g => g.id === groupId);
    if (g) {
      const updatedMembers = g.members.includes(userId) ? g.members : [...g.members, userId];
      db.updateGroup(groupId, { members: updatedMembers });
    }
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
    }));
  },

  removeGroupMember: (groupId, userId) => {
    const g = get().groups.find(g => g.id === groupId);
    if (g) {
      db.updateGroup(groupId, { members: g.members.filter(m => m !== userId) });
    }
    set(s => ({
      groups: s.groups.map(g =>
        g.id === groupId ? { ...g, members: g.members.filter(m => m !== userId) } : g
      ),
      users: s.users.map(u =>
        u.id === userId ? { ...u, groups: u.groups.filter(gid => gid !== groupId) } : u
      ),
    }));
  },

  setGroupPermission: (groupId, folderId, perm) => {
    const g = get().groups.find(g => g.id === groupId);
    if (g) {
      const newPerms = { ...g.permissions, [folderId]: perm };
      db.updateGroup(groupId, { permissions: newPerms as unknown as Record<string, string> });
    }
    set(s => ({
      groups: s.groups.map(g =>
        g.id === groupId ? { ...g, permissions: { ...g.permissions, [folderId]: perm } } : g
      ),
    }));
  },

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