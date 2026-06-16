import { create } from 'zustand';
import type {
  ZFSPool, ZFSDataset, ZFSSnapshot, ZFSSchedule,
  ZFSScrubStatus, ZFSVdev, ZFSCompression, ZFSChecksum,
  ZFSAtime, ZFSRecordsize,
} from '../types';

/* ──────────────────────────────────────────────────────────────────
   ZFS Store
   Simulates a full ZFS stack: pools, datasets, snapshots, schedules.
   All state lives in Zustand — no backend required for the UI demo.
   ────────────────────────────────────────────────────────────────── */

/* ─── Initial data ─── */
const INITIAL_POOLS: ZFSPool[] = [
  {
    id: 'pool-tank',
    name: 'tank',
    status: 'ONLINE',
    totalGB: 14904, // 2× 8TB in mirror = ~7.5TB usable × 2 vdevs
    usedGB: 4820,
    freeGB: 10084,
    dedupRatio: 1.05,
    fragmentation: 8,
    allocatable: 67,
    guid: 'a1b2c3d4e5f60001',
    createdAt: '01/01/2025',
    feature_async_destroy: true,
    feature_encryption: true,
    feature_lz4_compress: true,
    feature_spacemap_v2: true,
    feature_zstd_compress: true,
    feature_device_removal: false,
    scrubStatus: 'idle',
    lastScrub: '10/06/2025',
    vdevs: [
      { id: 'v1', type: 'mirror',  diskIds: ['d3', 'd4'], status: 'DEGRADED', readErrors: 0, writeErrors: 0, checksumErrors: 2 },
    ],
  },
  {
    id: 'pool-rpool',
    name: 'rpool',
    status: 'ONLINE',
    totalGB: 953,
    usedGB: 120,
    freeGB: 833,
    dedupRatio: 1.00,
    fragmentation: 3,
    allocatable: 87,
    guid: 'a1b2c3d4e5f60002',
    createdAt: '01/01/2025',
    feature_async_destroy: true,
    feature_encryption: true,
    feature_lz4_compress: true,
    feature_spacemap_v2: true,
    feature_zstd_compress: true,
    feature_device_removal: true,
    scrubStatus: 'idle',
    lastScrub: '01/06/2025',
    vdevs: [
      { id: 'v2', type: 'disk', diskIds: ['d5'], status: 'ONLINE', readErrors: 0, writeErrors: 0, checksumErrors: 0 },
    ],
  },
  {
    id: 'pool-backup',
    name: 'backup',
    status: 'ONLINE',
    totalGB: 7630, // RAIDZ with 3× 4TB disks
    usedGB: 1520,
    freeGB: 6110,
    dedupRatio: 1.12,
    fragmentation: 5,
    allocatable: 80,
    guid: 'a1b2c3d4e5f60003',
    createdAt: '15/03/2025',
    feature_async_destroy: true,
    feature_encryption: true,
    feature_lz4_compress: true,
    feature_spacemap_v2: true,
    feature_zstd_compress: true,
    feature_device_removal: false,
    scrubStatus: 'idle',
    lastScrub: '15/06/2025',
    vdevs: [
      { id: 'v3', type: 'raidz', diskIds: ['d1', 'd2'], status: 'ONLINE', readErrors: 0, writeErrors: 0, checksumErrors: 0 },
    ],
  },
];

const INITIAL_DATASETS: ZFSDataset[] = [
  /* tank datasets */
  {
    id: 'ds-tank', poolId: 'pool-tank', name: 'tank',
    type: 'filesystem', mountPoint: '/tank',
    usedGB: 4820, availableGB: 10084, referencedGB: 0.001,
    compression: 'lz4', checksum: 'sha256', atime: 'off',
    recordsize: '128K', encryption: false, dedup: false, readonly: false,
    createdAt: '01/01/2025', description: 'Pool raíz',
    sharenfs: 'off', sharesmb: 'off',
  },
  {
    id: 'ds-tank-data', poolId: 'pool-tank', name: 'tank/data',
    type: 'filesystem', mountPoint: '/tank/data',
    usedGB: 3100, availableGB: 10084, referencedGB: 3100,
    compression: 'lz4', checksum: 'sha256', atime: 'off',
    recordsize: '128K', encryption: false, dedup: false, readonly: false,
    createdAt: '01/01/2025', description: 'Datos generales',
    sharesmb: 'on', sharenfs: 'off',
  },
  {
    id: 'ds-tank-docs', poolId: 'pool-tank', name: 'tank/data/documentos',
    type: 'filesystem', mountPoint: '/tank/data/documentos',
    usedGB: 45, availableGB: 10084, referencedGB: 45,
    compression: 'zstd-3', checksum: 'sha256', atime: 'off',
    recordsize: '4K', encryption: true, encrypted: true, keyStatus: 'available',
    quota: 200, reservation: 0, dedup: false, readonly: false,
    createdAt: '02/01/2025', description: 'Documentos cifrados',
    sharesmb: 'on', sharenfs: 'off',
  },
  {
    id: 'ds-tank-media', poolId: 'pool-tank', name: 'tank/media',
    type: 'filesystem', mountPoint: '/tank/media',
    usedGB: 1720, availableGB: 10084, referencedGB: 1720,
    compression: 'off', checksum: 'on', atime: 'off',
    recordsize: '1M', encryption: false, dedup: false, readonly: false,
    createdAt: '01/01/2025', description: 'Películas, fotos, música',
    sharesmb: 'on', sharenfs: 'on',
  },
  {
    id: 'ds-tank-vms', poolId: 'pool-tank', name: 'tank/vms',
    type: 'filesystem', mountPoint: '/tank/vms',
    usedGB: 55, availableGB: 10084, referencedGB: 55,
    compression: 'lz4', checksum: 'sha256', atime: 'off',
    recordsize: '64K', encryption: false, dedup: false, readonly: false,
    quota: 500, reservation: 100,
    createdAt: '10/02/2025', description: 'Imágenes de máquinas virtuales',
  },
  /* rpool datasets */
  {
    id: 'ds-rpool', poolId: 'pool-rpool', name: 'rpool',
    type: 'filesystem', mountPoint: '/',
    usedGB: 120, availableGB: 833, referencedGB: 80,
    compression: 'lz4', checksum: 'sha256', atime: 'off',
    recordsize: '128K', encryption: false, dedup: false, readonly: false,
    createdAt: '01/01/2025', description: 'Sistema raíz',
  },
  {
    id: 'ds-rpool-ROOT', poolId: 'pool-rpool', name: 'rpool/ROOT',
    type: 'filesystem', mountPoint: 'legacy',
    usedGB: 110, availableGB: 833, referencedGB: 110,
    compression: 'lz4', checksum: 'sha256', atime: 'off',
    recordsize: '128K', encryption: false, dedup: false, readonly: false,
    createdAt: '01/01/2025',
  },
  /* backup datasets */
  {
    id: 'ds-backup', poolId: 'pool-backup', name: 'backup',
    type: 'filesystem', mountPoint: '/backup',
    usedGB: 1520, availableGB: 6110, referencedGB: 0.001,
    compression: 'zstd-9', checksum: 'sha256', atime: 'off',
    recordsize: '1M', encryption: true, encrypted: true, keyStatus: 'available',
    dedup: false, readonly: false,
    createdAt: '15/03/2025', description: 'Copias de seguridad',
  },
  {
    id: 'ds-backup-tank', poolId: 'pool-backup', name: 'backup/tank',
    type: 'filesystem', mountPoint: '/backup/tank',
    usedGB: 1380, availableGB: 6110, referencedGB: 1380,
    compression: 'zstd-9', checksum: 'sha256', atime: 'off',
    recordsize: '1M', encryption: true, encrypted: true, keyStatus: 'available',
    dedup: false, readonly: false,
    createdAt: '15/03/2025', description: 'Réplica ZFS de tank',
  },
];

const INITIAL_SNAPSHOTS: ZFSSnapshot[] = [
  { id: 'snap1', poolId: 'pool-tank', datasetName: 'tank/data/documentos', name: 'auto-2025-06-16_0000', fullName: 'tank/data/documentos@auto-2025-06-16_0000', usedGB: 0.8,  referencedGB: 44.2, createdAt: '16/06/2025 00:00', isAutomatic: true  },
  { id: 'snap2', poolId: 'pool-tank', datasetName: 'tank/data/documentos', name: 'auto-2025-06-15_0000', fullName: 'tank/data/documentos@auto-2025-06-15_0000', usedGB: 1.2,  referencedGB: 43.0, createdAt: '15/06/2025 00:00', isAutomatic: true  },
  { id: 'snap3', poolId: 'pool-tank', datasetName: 'tank/data/documentos', name: 'weekly-2025-06-08',    fullName: 'tank/data/documentos@weekly-2025-06-08',    usedGB: 3.4,  referencedGB: 41.6, createdAt: '08/06/2025 00:00', isAutomatic: true  },
  { id: 'snap4', poolId: 'pool-tank', datasetName: 'tank/media',           name: 'auto-2025-06-16_0000', fullName: 'tank/media@auto-2025-06-16_0000',           usedGB: 2.1,  referencedGB: 1718, createdAt: '16/06/2025 00:00', isAutomatic: true  },
  { id: 'snap5', poolId: 'pool-tank', datasetName: 'tank/data',            name: 'before-migration',     fullName: 'tank/data@before-migration',                usedGB: 42,   referencedGB: 3058, createdAt: '01/06/2025 14:30', isAutomatic: false, description: 'Antes de migración de datos' },
  { id: 'snap6', poolId: 'pool-backup', datasetName: 'backup/tank',        name: 'zfs-auto-2025-06-16', fullName: 'backup/tank@zfs-auto-2025-06-16',           usedGB: 4.8,  referencedGB: 1376, createdAt: '16/06/2025 02:00', isAutomatic: true  },
];

const INITIAL_SCHEDULES: ZFSSchedule[] = [
  { id: 'sched1', poolId: 'pool-tank',   datasetPattern: 'tank/data/**', frequency: 'daily',   keepCount: 14, enabled: true,  lastRun: '16/06/2025 00:00', nextRun: '17/06/2025 00:00' },
  { id: 'sched2', poolId: 'pool-tank',   datasetPattern: 'tank/**',      frequency: 'weekly',  keepCount: 8,  enabled: true,  lastRun: '15/06/2025 00:00', nextRun: '22/06/2025 00:00' },
  { id: 'sched3', poolId: 'pool-tank',   datasetPattern: 'tank/**',      frequency: 'monthly', keepCount: 12, enabled: true,  lastRun: '01/06/2025 00:00', nextRun: '01/07/2025 00:00' },
  { id: 'sched4', poolId: 'pool-backup', datasetPattern: 'backup/**',    frequency: 'daily',   keepCount: 7,  enabled: true,  lastRun: '16/06/2025 02:00', nextRun: '17/06/2025 02:00' },
];

/* ─── Helpers ─── */
let _nextId = 1000;
const genId = (prefix: string) => `${prefix}-${_nextId++}`;

function sanitize(s: string): string {
  return String(s).trim().slice(0, 128).replace(/[;<>&|`$\\]/g, '');
}

/* ─── Store interface ─── */
interface ZFSStore {
  pools:     ZFSPool[];
  datasets:  ZFSDataset[];
  snapshots: ZFSSnapshot[];
  schedules: ZFSSchedule[];
  scrubs:    Map<string, ZFSScrubStatus>;

  /* Pool ops */
  createPool:      (name: string, vdevType: string, diskIds: string[], opts?: Partial<ZFSPool>) => { ok: boolean; error?: string };
  destroyPool:     (poolId: string) => { ok: boolean; error?: string };
  exportPool:      (poolId: string) => { ok: boolean; error?: string };
  importPool:      (guid: string) => { ok: boolean; error?: string };
  startScrub:      (poolId: string) => void;
  stopScrub:       (poolId: string) => void;

  /* Dataset ops */
  createDataset:   (data: Omit<ZFSDataset, 'id' | 'createdAt' | 'usedGB' | 'availableGB' | 'referencedGB'>) => { ok: boolean; error?: string };
  destroyDataset:  (datasetId: string, recursive?: boolean) => { ok: boolean; error?: string };
  updateDataset:   (datasetId: string, props: Partial<Pick<ZFSDataset, 'compression'|'checksum'|'atime'|'recordsize'|'quota'|'reservation'|'readonly'|'dedup'|'description'>>) => void;
  mountDataset:    (datasetId: string) => { ok: boolean; error?: string };
  loadKey:         (datasetId: string) => { ok: boolean; error?: string };
  unloadKey:       (datasetId: string) => { ok: boolean; error?: string };
  setShareSMB:     (datasetId: string, share: string) => void;
  setShareNFS:     (datasetId: string, share: string) => void;

  /* Snapshot ops */
  createSnapshot:   (datasetName: string, poolId: string, snapName: string, desc?: string) => { ok: boolean; error?: string };
  destroySnapshot:  (snapId: string) => { ok: boolean; error?: string };
  rollbackSnapshot: (snapId: string) => { ok: boolean; error?: string };
  cloneSnapshot:    (snapId: string, targetName: string) => { ok: boolean; error?: string };
  sendSnapshot:     (snapId: string, targetPoolId: string) => { ok: boolean; error?: string };

  /* Schedule ops */
  createSchedule:   (data: Omit<ZFSSchedule, 'id'>) => void;
  updateSchedule:   (id: string, patch: Partial<ZFSSchedule>) => void;
  deleteSchedule:   (id: string) => void;

  /* Queries */
  getPoolDatasets:   (poolId: string) => ZFSDataset[];
  getDatasetSnapshots: (datasetName: string) => ZFSSnapshot[];
  getPoolScrub:       (poolId: string) => ZFSScrubStatus | null;
  getPoolSchedules:   (poolId: string) => ZFSSchedule[];
  getPoolHealth:      (poolId: string) => { errors: number; warnings: number };
}

let _scrubTimers = new Map<string, ReturnType<typeof setInterval>>();

export const useZFSStore = create<ZFSStore>((set, get) => ({
  pools:     INITIAL_POOLS,
  datasets:  INITIAL_DATASETS,
  snapshots: INITIAL_SNAPSHOTS,
  schedules: INITIAL_SCHEDULES,
  scrubs:    new Map(),

  /* ── Pool ops ── */
  createPool: (name, vdevType, diskIds, opts = {}) => {
    const safeName = sanitize(name).toLowerCase().replace(/\s+/g, '_');
    if (!safeName) return { ok: false, error: 'Nombre de pool inválido' };
    if (safeName.match(/^(mirror|raidz|log|cache|spare|special)$/))
      return { ok: false, error: 'Nombre reservado por ZFS' };
    if (get().pools.some(p => p.name === safeName))
      return { ok: false, error: `Ya existe un pool llamado "${safeName}"` };
    if (diskIds.length === 0)
      return { ok: false, error: 'Selecciona al menos un disco' };

    const diskSizes = diskIds.map(id => {
      const d = (globalThis as any).__disks__?.find((x: any) => x.id === id);
      return d?.sizeGB ?? 4000;
    });

    // Usable capacity estimate
    const smallest = Math.min(...diskSizes);
    let usableGB = smallest;
    if (vdevType === 'mirror')  usableGB = smallest;
    else if (vdevType === 'raidz')  usableGB = smallest * (diskIds.length - 1);
    else if (vdevType === 'raidz2') usableGB = smallest * (diskIds.length - 2);
    else if (vdevType === 'raidz3') usableGB = smallest * (diskIds.length - 3);
    else usableGB = diskSizes.reduce((s, x) => s + x, 0);

    const pool: ZFSPool = {
      id: genId('pool'),
      name: safeName,
      status: 'ONLINE',
      totalGB: Math.round(usableGB),
      usedGB: 0,
      freeGB: Math.round(usableGB),
      dedupRatio: 1.00,
      fragmentation: 0,
      allocatable: 100,
      guid: Math.random().toString(16).slice(2, 18),
      createdAt: new Date().toLocaleDateString('es-ES'),
      feature_async_destroy: true,
      feature_encryption: true,
      feature_lz4_compress: true,
      feature_spacemap_v2: true,
      feature_zstd_compress: true,
      feature_device_removal: true,
      scrubStatus: 'idle',
      vdevs: [{ id: genId('v'), type: vdevType as any, diskIds, status: 'ONLINE', readErrors: 0, writeErrors: 0, checksumErrors: 0 }],
      ...opts,
    };

    // Create root dataset
    const rootDs: ZFSDataset = {
      id: genId('ds'), poolId: pool.id, name: safeName,
      type: 'filesystem', mountPoint: `/${safeName}`,
      usedGB: 0, availableGB: pool.totalGB, referencedGB: 0,
      compression: 'lz4', checksum: 'sha256', atime: 'off',
      recordsize: '128K', encryption: false, dedup: false, readonly: false,
      createdAt: pool.createdAt,
    };

    set(s => ({ pools: [...s.pools, pool], datasets: [...s.datasets, rootDs] }));
    return { ok: true };
  },

  destroyPool: (poolId) => {
    const pool = get().pools.find(p => p.id === poolId);
    if (!pool) return { ok: false, error: 'Pool no encontrado' };
    if (pool.name === 'rpool') return { ok: false, error: 'No se puede destruir el pool del sistema (rpool)' };
    set(s => ({
      pools:     s.pools.filter(p => p.id !== poolId),
      datasets:  s.datasets.filter(d => d.poolId !== poolId),
      snapshots: s.snapshots.filter(sn => sn.poolId !== poolId),
      schedules: s.schedules.filter(sc => sc.poolId !== poolId),
    }));
    return { ok: true };
  },

  exportPool: (poolId) => {
    const pool = get().pools.find(p => p.id === poolId);
    if (!pool) return { ok: false, error: 'Pool no encontrado' };
    if (pool.name === 'rpool') return { ok: false, error: 'No se puede exportar el pool raíz del sistema' };
    set(s => ({ pools: s.pools.map(p => p.id === poolId ? { ...p, status: 'OFFLINE' } : p) }));
    return { ok: true };
  },

  importPool: (guid) => {
    const pool = get().pools.find(p => p.guid === guid);
    if (!pool) return { ok: false, error: 'Pool no encontrado con ese GUID' };
    set(s => ({ pools: s.pools.map(p => p.guid === guid ? { ...p, status: 'ONLINE' } : p) }));
    return { ok: true };
  },

  startScrub: (poolId) => {
    const timer = setInterval(() => {
      set(s => ({
        pools: s.pools.map(p => {
          if (p.id !== poolId) return p;
          const prog = (p.scrubProgress ?? 0) + Math.round(2 + Math.random() * 4);
          if (prog >= 100) {
            clearInterval(_scrubTimers.get(poolId));
            _scrubTimers.delete(poolId);
            return { ...p, scrubStatus: 'idle', scrubProgress: undefined, lastScrub: new Date().toLocaleDateString('es-ES') };
          }
          return { ...p, scrubStatus: 'scrubbing', scrubProgress: prog };
        }),
      }));
    }, 600);
    _scrubTimers.set(poolId, timer);
    set(s => ({ pools: s.pools.map(p => p.id === poolId ? { ...p, scrubStatus: 'scrubbing', scrubProgress: 0 } : p) }));
  },

  stopScrub: (poolId) => {
    const t = _scrubTimers.get(poolId);
    if (t) { clearInterval(t); _scrubTimers.delete(poolId); }
    set(s => ({ pools: s.pools.map(p => p.id === poolId ? { ...p, scrubStatus: 'idle', scrubProgress: undefined } : p) }));
  },

  /* ── Dataset ops ── */
  createDataset: (data) => {
    const safeName = sanitize(data.name).replace(/\s+/g, '_');
    if (!safeName) return { ok: false, error: 'Nombre de dataset inválido' };
    if (get().datasets.some(d => d.name === safeName))
      return { ok: false, error: `Ya existe un dataset llamado "${safeName}"` };

    const pool = get().pools.find(p => p.id === data.poolId);
    const ds: ZFSDataset = {
      ...data,
      name: safeName,
      id: genId('ds'),
      usedGB: 0,
      availableGB: pool?.freeGB ?? 0,
      referencedGB: 0,
      createdAt: new Date().toLocaleDateString('es-ES'),
    };
    set(s => ({ datasets: [...s.datasets, ds] }));
    return { ok: true };
  },

  destroyDataset: (datasetId, recursive = false) => {
    const ds = get().datasets.find(d => d.id === datasetId);
    if (!ds) return { ok: false, error: 'Dataset no encontrado' };
    if (ds.name === 'rpool' || ds.name === 'rpool/ROOT')
      return { ok: false, error: 'No se puede destruir el sistema raíz' };
    const hasChildren = get().datasets.some(d => d.name.startsWith(ds.name + '/') && d.id !== datasetId);
    if (hasChildren && !recursive)
      return { ok: false, error: 'El dataset tiene hijos. Usa la opción recursiva.' };
    const hasSnaps = get().snapshots.some(sn => sn.datasetName === ds.name);
    if (hasSnaps && !recursive)
      return { ok: false, error: 'El dataset tiene snapshots. Usa la opción recursiva o elimínalos primero.' };
    set(s => ({
      datasets:  s.datasets.filter(d => recursive ? !d.name.startsWith(ds.name) : d.id !== datasetId),
      snapshots: s.snapshots.filter(sn => recursive ? !sn.datasetName.startsWith(ds.name) : sn.datasetName !== ds.name),
    }));
    return { ok: true };
  },

  updateDataset: (datasetId, props) =>
    set(s => ({ datasets: s.datasets.map(d => d.id === datasetId ? { ...d, ...props } : d) })),

  mountDataset: (datasetId) => {
    const ds = get().datasets.find(d => d.id === datasetId);
    if (!ds) return { ok: false, error: 'Dataset no encontrado' };
    return { ok: true };
  },

  loadKey: (datasetId) => {
    set(s => ({ datasets: s.datasets.map(d => d.id === datasetId ? { ...d, keyStatus: 'available' } : d) }));
    return { ok: true };
  },

  unloadKey: (datasetId) => {
    set(s => ({ datasets: s.datasets.map(d => d.id === datasetId ? { ...d, keyStatus: 'unavailable' } : d) }));
    return { ok: true };
  },

  setShareSMB: (datasetId, share) =>
    set(s => ({ datasets: s.datasets.map(d => d.id === datasetId ? { ...d, sharesmb: share } : d) })),

  setShareNFS: (datasetId, share) =>
    set(s => ({ datasets: s.datasets.map(d => d.id === datasetId ? { ...d, sharenfs: share } : d) })),

  /* ── Snapshot ops ── */
  createSnapshot: (datasetName, poolId, snapName, desc) => {
    const safeName = sanitize(snapName).replace(/[@\s]/g, '_');
    if (!safeName) return { ok: false, error: 'Nombre de snapshot inválido' };
    const fullName = `${datasetName}@${safeName}`;
    if (get().snapshots.some(sn => sn.fullName === fullName))
      return { ok: false, error: `Ya existe un snapshot "${fullName}"` };

    const ds = get().datasets.find(d => d.name === datasetName);
    const snap: ZFSSnapshot = {
      id: genId('snap'),
      poolId,
      datasetName,
      name: safeName,
      fullName,
      usedGB: 0,
      referencedGB: ds?.referencedGB ?? 0,
      createdAt: new Date().toLocaleString('es-ES'),
      isAutomatic: false,
      description: desc,
    };
    set(s => ({ snapshots: [...s.snapshots, snap] }));
    return { ok: true };
  },

  destroySnapshot: (snapId) => {
    if (!get().snapshots.find(sn => sn.id === snapId))
      return { ok: false, error: 'Snapshot no encontrado' };
    set(s => ({ snapshots: s.snapshots.filter(sn => sn.id !== snapId) }));
    return { ok: true };
  },

  rollbackSnapshot: (snapId) => {
    const snap = get().snapshots.find(sn => sn.id === snapId);
    if (!snap) return { ok: false, error: 'Snapshot no encontrado' };
    // Mark dataset as rolled back (update referenced size)
    set(s => ({
      datasets: s.datasets.map(d =>
        d.name === snap.datasetName ? { ...d, referencedGB: snap.referencedGB, usedGB: snap.referencedGB } : d
      ),
      // Remove snapshots newer than this one
      snapshots: s.snapshots.filter(sn =>
        sn.datasetName !== snap.datasetName ||
        new Date(sn.createdAt.split(' ')[0].split('/').reverse().join('-')) <=
        new Date(snap.createdAt.split(' ')[0].split('/').reverse().join('-'))
      ),
    }));
    return { ok: true };
  },

  cloneSnapshot: (snapId, targetName) => {
    const snap = get().snapshots.find(sn => sn.id === snapId);
    if (!snap) return { ok: false, error: 'Snapshot no encontrado' };
    const safeName = sanitize(targetName);
    if (get().datasets.some(d => d.name === safeName))
      return { ok: false, error: 'Ya existe un dataset con ese nombre' };

    const sourceDs = get().datasets.find(d => d.name === snap.datasetName);
    const clone: ZFSDataset = {
      id: genId('ds'),
      poolId: snap.poolId,
      name: safeName,
      type: 'filesystem',
      mountPoint: `/${safeName.replace(/\//g, '-')}`,
      usedGB: 0,
      availableGB: sourceDs?.availableGB ?? 0,
      referencedGB: snap.referencedGB,
      compression: sourceDs?.compression ?? 'lz4',
      checksum: sourceDs?.checksum ?? 'sha256',
      atime: sourceDs?.atime ?? 'off',
      recordsize: sourceDs?.recordsize ?? '128K',
      encryption: false,
      dedup: false,
      readonly: false,
      origin: snap.fullName,
      createdAt: new Date().toLocaleDateString('es-ES'),
      description: `Clon de ${snap.fullName}`,
    };
    set(s => ({ datasets: [...s.datasets, clone] }));
    return { ok: true };
  },

  sendSnapshot: (snapId, targetPoolId) => {
    const snap = get().snapshots.find(sn => sn.id === snapId);
    if (!snap) return { ok: false, error: 'Snapshot no encontrado' };
    const targetPool = get().pools.find(p => p.id === targetPoolId);
    if (!targetPool) return { ok: false, error: 'Pool destino no encontrado' };
    // Create a receive dataset on the target pool
    const recvName = `${targetPool.name}/${snap.datasetName.replace(/\//g, '-')}-recv`;
    get().createDataset({
      poolId: targetPoolId, name: recvName, type: 'filesystem',
      mountPoint: `/${recvName.replace(/\//g, '-')}`,
      compression: 'lz4', checksum: 'sha256', atime: 'off',
      recordsize: '128K', encryption: false, dedup: false, readonly: false,
    });
    return { ok: true };
  },

  /* ── Schedule ops ── */
  createSchedule: (data) =>
    set(s => ({ schedules: [...s.schedules, { ...data, id: genId('sched') }] })),

  updateSchedule: (id, patch) =>
    set(s => ({ schedules: s.schedules.map(sc => sc.id === id ? { ...sc, ...patch } : sc) })),

  deleteSchedule: (id) =>
    set(s => ({ schedules: s.schedules.filter(sc => sc.id !== id) })),

  /* ── Queries ── */
  getPoolDatasets: (poolId) => get().datasets.filter(d => d.poolId === poolId),

  getDatasetSnapshots: (datasetName) =>
    get().snapshots.filter(sn => sn.datasetName === datasetName)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  getPoolScrub: (poolId) => get().scrubs.get(poolId) ?? null,

  getPoolSchedules: (poolId) => get().schedules.filter(sc => sc.poolId === poolId),

  getPoolHealth: (poolId) => {
    const pool = get().pools.find(p => p.id === poolId);
    if (!pool) return { errors: 0, warnings: 0 };
    const errors   = pool.vdevs.reduce((s, v) => s + v.readErrors + v.writeErrors, 0);
    const warnings = pool.vdevs.reduce((s, v) => s + v.checksumErrors, 0);
    return { errors, warnings };
  },
}));
