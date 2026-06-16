import { create } from 'zustand';
import type { PhysicalDisk, StorageVolume, SharedFolder, Permission } from '../types';

/* ─── Initial data ─── */
const INITIAL_DISKS: PhysicalDisk[] = [
  {
    id: 'd1', model: 'WD Red Pro 4TB', serial: 'WD-WCC4N2345678', slot: 1,
    sizeGB: 3815, usedGB: 1520, status: 'healthy', temp: 38, type: 'HDD', rpm: 7200,
    smart: { reallocatedSectors: 0, pendingSectors: 0, powerOnHours: 12450, health: 98 },
    volumeId: 'vol1',
  },
  {
    id: 'd2', model: 'WD Red Pro 4TB', serial: 'WD-WCC4N2345679', slot: 2,
    sizeGB: 3815, usedGB: 1520, status: 'healthy', temp: 40, type: 'HDD', rpm: 7200,
    smart: { reallocatedSectors: 0, pendingSectors: 0, powerOnHours: 12448, health: 98 },
    volumeId: 'vol1',
  },
  {
    id: 'd3', model: 'Seagate IronWolf 8TB', serial: 'ZA12B3CD4567', slot: 3,
    sizeGB: 7452, usedGB: 3200, status: 'healthy', temp: 42, type: 'HDD', rpm: 7200,
    smart: { reallocatedSectors: 0, pendingSectors: 0, powerOnHours: 8820, health: 96 },
    volumeId: 'vol2',
  },
  {
    id: 'd4', model: 'Seagate IronWolf 8TB', serial: 'ZA12B3CD4568', slot: 4,
    sizeGB: 7452, usedGB: 3200, status: 'warning', temp: 55, type: 'HDD', rpm: 7200,
    smart: { reallocatedSectors: 3, pendingSectors: 1, powerOnHours: 8800, health: 72 },
    volumeId: 'vol2',
  },
  {
    id: 'd5', model: 'Samsung 870 EVO 1TB', serial: 'S5EVNX0T123456', slot: 5,
    sizeGB: 953, usedGB: 120, status: 'healthy', temp: 28, type: 'SSD',
    smart: { reallocatedSectors: 0, pendingSectors: 0, powerOnHours: 3200, health: 99 },
    volumeId: 'vol3',
  },
  {
    id: 'd6', model: '(Ranura vacía)', serial: '—', slot: 6,
    sizeGB: 0, usedGB: 0, status: 'unknown', temp: 0, type: 'HDD',
    smart: { reallocatedSectors: 0, pendingSectors: 0, powerOnHours: 0, health: 0 },
  },
];

const INITIAL_VOLUMES: StorageVolume[] = [
  {
    id: 'vol1', name: 'Volumen 1', raidType: 'RAID 1', fsType: 'ext4',
    totalGB: 3815, usedGB: 1520, status: 'normal',
    disks: ['d1', 'd2'], mountPoint: '/volume1',
    createdAt: '01/01/2025', encrypted: true,
    description: 'Almacenamiento principal RAID 1 con espejo',
  },
  {
    id: 'vol2', name: 'Volumen 2', raidType: 'RAID 1', fsType: 'ext4',
    totalGB: 7452, usedGB: 3200, status: 'degraded',
    disks: ['d3', 'd4'], mountPoint: '/volume2',
    createdAt: '15/03/2025', encrypted: false,
    description: 'Almacenamiento multimedia — ¡ADVERTENCIA: disco con sectores defectuosos!',
  },
  {
    id: 'vol3', name: 'Sistema', raidType: 'basic', fsType: 'ext4',
    totalGB: 953, usedGB: 120, status: 'normal',
    disks: ['d5'], mountPoint: '/system',
    createdAt: '01/01/2025', encrypted: false,
    description: 'Disco del sistema operativo',
  },
];

const INITIAL_FOLDERS: SharedFolder[] = [
  {
    id: 'sf-docs', name: 'Documentos', volumeId: 'vol1', path: '/volume1/Documentos',
    description: 'Documentos de trabajo y oficina',
    encrypted: true, hidden: false,
    protocols: ['smb', 'sftp'],
    permissions: [
      { groupId: 'g-administrators', access: 'admin' },
      { groupId: 'g-users',          access: 'write' },
      { groupId: 'g-guests',         access: 'read'  },
    ],
    quotaGB: 200, usedGB: 45,
  },
  {
    id: 'sf-media', name: 'Multimedia', volumeId: 'vol2', path: '/volume2/Multimedia',
    description: 'Fotos, vídeos y música',
    encrypted: false, hidden: false,
    protocols: ['smb', 'nfs'],
    permissions: [
      { groupId: 'g-administrators', access: 'admin' },
      { groupId: 'g-users',          access: 'write' },
      { groupId: 'g-guests',         access: 'read'  },
    ],
    quotaGB: 0, usedGB: 820,
  },
  {
    id: 'sf-backup', name: 'Backup', volumeId: 'vol1', path: '/volume1/Backup',
    description: 'Copias de seguridad automáticas',
    encrypted: true, hidden: true,
    protocols: ['rsync', 'sftp'],
    permissions: [
      { groupId: 'g-administrators', access: 'admin'  },
      { groupId: 'g-services',       access: 'write'  },
      { groupId: 'g-users',          access: 'none'   },
    ],
    quotaGB: 1000, usedGB: 380,
  },
  {
    id: 'sf-web', name: 'Web', volumeId: 'vol3', path: '/system/web',
    description: 'Archivos del servidor web Nginx',
    encrypted: false, hidden: false,
    protocols: ['sftp'],
    permissions: [
      { groupId: 'g-administrators', access: 'admin' },
      { groupId: 'g-users',          access: 'none'  },
    ],
    quotaGB: 50, usedGB: 12,
  },
];

/* ─── Store ─── */
let _fid = 200;
function genFolderId() { return `sf-${_fid++}`; }

interface StorageStore {
  disks:   PhysicalDisk[];
  volumes: StorageVolume[];
  folders: SharedFolder[];

  // Volumes
  createVolume: (data: Omit<StorageVolume, 'id' | 'createdAt' | 'usedGB'>) => { ok: boolean; error?: string };
  deleteVolume: (id: string) => { ok: boolean; error?: string };

  // Shared folders
  addFolder:    (data: Omit<SharedFolder, 'id' | 'usedGB'>) => { ok: boolean; error?: string };
  updateFolder: (id: string, patch: Partial<SharedFolder>) => void;
  deleteFolder: (id: string) => { ok: boolean; error?: string };
  setFolderPermission: (folderId: string, subjectId: string, type: 'user' | 'group', perm: Permission) => void;

  // Queries
  getVolumeDisks:   (volumeId: string) => PhysicalDisk[];
  getVolumeFolders: (volumeId: string) => SharedFolder[];
  getDiskHealthSummary: () => { healthy: number; warning: number; failing: number };
}

export const useStorageStore = create<StorageStore>((set, get) => ({
  disks:   INITIAL_DISKS,
  volumes: INITIAL_VOLUMES,
  folders: INITIAL_FOLDERS,

  createVolume: (data) => {
    if (!data.name.trim()) return { ok: false, error: 'Nombre de volumen requerido' };
    if (data.disks.length === 0) return { ok: false, error: 'Selecciona al menos un disco' };

    const volume: StorageVolume = {
      ...data,
      id: `vol-${Date.now()}`,
      usedGB: 0,
      createdAt: new Date().toLocaleDateString('es-ES'),
    };
    set(s => ({
      volumes: [...s.volumes, volume],
      disks: s.disks.map(d =>
        data.disks.includes(d.id) ? { ...d, volumeId: volume.id } : d
      ),
    }));
    return { ok: true };
  },

  deleteVolume: (id) => {
    const vol = get().volumes.find(v => v.id === id);
    if (!vol) return { ok: false, error: 'Volumen no encontrado' };
    if (vol.mountPoint === '/system') return { ok: false, error: 'No se puede eliminar el volumen del sistema' };
    set(s => ({
      volumes: s.volumes.filter(v => v.id !== id),
      disks:   s.disks.map(d => d.volumeId === id ? { ...d, volumeId: undefined } : d),
      folders: s.folders.filter(f => f.volumeId !== id),
    }));
    return { ok: true };
  },

  addFolder: (data) => {
    if (!data.name.trim()) return { ok: false, error: 'Nombre de carpeta requerido' };
    const name = data.name.trim().replace(/[<>"'`\/\\]/g, '');
    if (get().folders.some(f => f.name === name && f.volumeId === data.volumeId))
      return { ok: false, error: 'Ya existe una carpeta con ese nombre en este volumen' };

    const vol = get().volumes.find(v => v.id === data.volumeId);
    const path = `${vol?.mountPoint ?? '/volume1'}/${name}`;
    set(s => ({
      folders: [...s.folders, { ...data, id: genFolderId(), name, path, usedGB: 0 }],
    }));
    return { ok: true };
  },

  updateFolder: (id, patch) =>
    set(s => ({
      folders: s.folders.map(f => f.id === id ? { ...f, ...patch } : f),
    })),

  deleteFolder: (id) => {
    if (!get().folders.find(f => f.id === id))
      return { ok: false, error: 'Carpeta no encontrada' };
    set(s => ({ folders: s.folders.filter(f => f.id !== id) }));
    return { ok: true };
  },

  setFolderPermission: (folderId, subjectId, type, perm) =>
    set(s => ({
      folders: s.folders.map(f => {
        if (f.id !== folderId) return f;
        const existing = f.permissions.filter(p =>
          type === 'group' ? p.groupId !== subjectId : p.userId !== subjectId
        );
        const entry = type === 'group'
          ? { groupId: subjectId, access: perm }
          : { userId: subjectId,  access: perm };
        return { ...f, permissions: [...existing, entry] };
      }),
    })),

  getVolumeDisks:   (volumeId) => get().disks.filter(d => d.volumeId === volumeId),
  getVolumeFolders: (volumeId) => get().folders.filter(f => f.volumeId === volumeId),

  getDiskHealthSummary: () => {
    const disks = get().disks.filter(d => d.sizeGB > 0);
    return {
      healthy: disks.filter(d => d.status === 'healthy').length,
      warning: disks.filter(d => d.status === 'warning').length,
      failing: disks.filter(d => d.status === 'failing' || d.status === 'failed').length,
    };
  },
}));
