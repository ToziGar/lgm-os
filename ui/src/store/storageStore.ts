import { create } from 'zustand';
import type { PhysicalDisk, StorageVolume, SharedFolder, Permission } from '../types';
import { db, type StoredPhysicalDisk, type StoredVolume, type StoredSharedFolder } from './dbService';

/* ─── Helpers ─── */
let _fid = 200;
function genFolderId() { return `sf-${_fid++}`; }

function sanitize(s: string) { return String(s).trim().slice(0, 64).replace(/[<>"'`]/g, ''); }

/* ─── Initial data from db ─── */
const initialDisks: PhysicalDisk[] = db.getDisks() as unknown as PhysicalDisk[];
const initialVolumes: StorageVolume[] = db.getVolumes() as unknown as StorageVolume[];
const initialFolders: SharedFolder[] = db.getSharedFolders() as unknown as SharedFolder[];

interface StorageStore {
  disks: PhysicalDisk[];
  volumes: StorageVolume[];
  folders: SharedFolder[];

  /* Storage actions */
  createVolume: (vol: Omit<StorageVolume, 'id' | 'createdAt' | 'status' | 'usedGB'>) => { ok: boolean; error?: string };
  deleteVolume: (id: string) => { ok: boolean; error?: string };
  updateVolume: (id: string, patch: Partial<StorageVolume>) => void;
  updateDisk: (id: string, patch: Partial<PhysicalDisk>) => void;

  /* Shared folder actions */
  addFolder: (data: Omit<SharedFolder, 'id'>) => { ok: boolean; error?: string };
  updateFolder: (id: string, patch: Partial<SharedFolder>) => { ok: boolean; error?: string };
  deleteFolder: (id: string) => { ok: boolean; error?: string };
  setFolderPermission: (folderId: string, userId: string | undefined, groupId: string | undefined, access: Permission) => void;

  /* Queries */
  getVolumeDisks: (volId: string) => PhysicalDisk[];
  getVolumeFolders: (volId: string) => SharedFolder[];
  getDiskHealthSummary: () => { total: number; healthy: number; warning: number; failing: number };
  getFreeDiskSpace: () => { total: number; used: number };
}

export const useStorageStore = create<StorageStore>((set, get) => ({
  disks: initialDisks,
  volumes: initialVolumes,
  folders: initialFolders,

  createVolume: (data) => {
    const name = sanitize(data.name);
    if (!name) return { ok: false, error: 'Nombre de volumen inválido' };
    if (get().volumes.some(v => v.name === name))
      return { ok: false, error: `El volumen "${name}" ya existe` };

    const vol: StorageVolume = {
      ...data,
      id: `vol-${Date.now()}`,
      name,
      status: 'normal',
      usedGB: 0,
      createdAt: new Date().toISOString(),
    };
    const newVols = [...get().volumes, vol];
    db.setVolumes(newVols as unknown as StoredVolume[]);
    set({ volumes: newVols });
    return { ok: true };
  },

  deleteVolume: (id) => {
    const vol = get().volumes.find(v => v.id === id);
    if (!vol) return { ok: false, error: 'Volumen no encontrado' };
    const newVols = get().volumes.filter(v => v.id !== id);
    db.setVolumes(newVols as unknown as StoredVolume[]);
    set({ volumes: newVols });
    return { ok: true };
  },

  updateVolume: (id, patch) => {
    const newVols = get().volumes.map(v => v.id === id ? { ...v, ...patch } : v);
    db.setVolumes(newVols as unknown as StoredVolume[]);
    set({ volumes: newVols });
  },

  updateDisk: (id, patch) => {
    const newDisks = get().disks.map(d => d.id === id ? { ...d, ...patch } : d);
    db.setDisks(newDisks as unknown as StoredPhysicalDisk[]);
    set({ disks: newDisks });
  },

  addFolder: (data) => {
    const name = sanitize(data.name);
    if (!name) return { ok: false, error: 'Nombre de carpeta inválido' };
    if (get().folders.some(f => f.name === name && f.volumeId === data.volumeId))
      return { ok: false, error: `La carpeta "${name}" ya existe en este volumen` };

    const folder: SharedFolder = { ...data, id: genFolderId(), name, usedGB: 0 };
    const newFolders = [...get().folders, folder];
    db.setSharedFolders(newFolders as unknown as StoredSharedFolder[]);
    set({ folders: newFolders });
    return { ok: true };
  },

  updateFolder: (id, patch) => {
    const newFolders = get().folders.map(f => f.id === id ? { ...f, ...patch } : f);
    db.setSharedFolders(newFolders as unknown as StoredSharedFolder[]);
    set({ folders: newFolders });
    return { ok: true };
  },

  deleteFolder: (id) => {
    const folder = get().folders.find(f => f.id === id);
    if (!folder) return { ok: false, error: 'Carpeta no encontrada' };
    const newFolders = get().folders.filter(f => f.id !== id);
    db.setSharedFolders(newFolders as unknown as StoredSharedFolder[]);
    set({ folders: newFolders });
    return { ok: true };
  },

  setFolderPermission: (folderId, userId, groupId, access) => {
    const newFolders = get().folders.map(f => {
      if (f.id !== folderId) return f;
      const perms = f.permissions.filter(p =>
        !(p.userId === userId && p.groupId === groupId)
      );
      perms.push({ userId, groupId, access });
      return { ...f, permissions: perms };
    });
    db.setSharedFolders(newFolders as unknown as StoredSharedFolder[]);
    set({ folders: newFolders });
  },

  getVolumeDisks: (volId) => get().disks.filter(d => d.volumeId === volId),
  getVolumeFolders: (volId) => get().folders.filter(f => f.volumeId === volId),
  getDiskHealthSummary: () => {
    const disks = get().disks;
    return {
      total: disks.length,
      healthy: disks.filter(d => d.status === 'healthy').length,
      warning: disks.filter(d => d.status === 'warning').length,
      failing: disks.filter(d => d.status === 'failing' || d.status === 'failed').length,
    };
  },
  getFreeDiskSpace: () => ({
    total: get().disks.reduce((sum, d) => sum + d.sizeGB, 0),
    used: get().disks.reduce((sum, d) => sum + d.usedGB, 0),
  }),
}));