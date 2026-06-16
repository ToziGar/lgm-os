import { create } from 'zustand';
import type {
  ZFSPool, ZFSDataset, ZFSSnapshot, ZFSSchedule,
  ZFSScrubStatus, ZFSVdev, ZFSCompression, ZFSChecksum,
  ZFSAtime, ZFSRecordsize,
} from '../types';
import { db, type StoredZFSPool, type StoredZFSDataset, type StoredZFSSnapshot, type StoredZFSSchedule } from './dbService';

/* ─── Helpers ─── */
let _nextId = 1000;
const genId = (prefix: string) => `${prefix}-${_nextId++}`;

function sanitize(s: string): string {
  return String(s).trim().slice(0, 128).replace(/[;<>&|`$\\]/g, '');
}

/* ─── Initial data from db ─── */
const initialPools: ZFSPool[] = db.getZFSPools() as unknown as ZFSPool[];
const initialDatasets: ZFSDataset[] = db.getZFSDatasets() as unknown as ZFSDataset[];
const initialSnapshots: ZFSSnapshot[] = db.getZFSSnapshots() as unknown as ZFSSnapshot[];
const initialSchedules: ZFSSchedule[] = db.getZFSSchedules() as unknown as ZFSSchedule[];

interface ZFSStore {
  pools:     ZFSPool[];
  datasets:  ZFSDataset[];
  snapshots: ZFSSnapshot[];
  schedules: ZFSSchedule[];
  scrubs:    Map<string, ZFSScrubStatus>;

  createPool:      (name: string, vdevType: string, diskIds: string[], opts?: Partial<ZFSPool>) => { ok: boolean; error?: string };
  destroyPool:     (poolId: string) => { ok: boolean; error?: string };
  exportPool:      (poolId: string) => { ok: boolean; error?: string };
  importPool:      (guid: string) => { ok: boolean; error?: string };
  startScrub:      (poolId: string) => void;
  stopScrub:       (poolId: string) => void;

  createDataset:   (data: Omit<ZFSDataset, 'id' | 'createdAt' | 'usedGB' | 'availableGB' | 'referencedGB'>) => { ok: boolean; error?: string };
  destroyDataset:  (datasetId: string, recursive?: boolean) => { ok: boolean; error?: string };
  updateDataset:   (datasetId: string, props: Partial<Pick<ZFSDataset, 'compression'|'checksum'|'atime'|'recordsize'|'quota'|'reservation'|'readonly'|'dedup'|'description'>>) => void;
  mountDataset:    (datasetId: string) => { ok: boolean; error?: string };
  loadKey:         (datasetId: string) => { ok: boolean; error?: string };
  unloadKey:       (datasetId: string) => { ok: boolean; error?: string };
  setShareSMB:     (datasetId: string, share: string) => void;
  setShareNFS:     (datasetId: string, share: string) => void;

  createSnapshot:   (datasetName: string, poolId: string, snapName: string, desc?: string) => { ok: boolean; error?: string };
  destroySnapshot:  (snapId: string) => { ok: boolean; error?: string };
  rollbackSnapshot: (snapId: string) => { ok: boolean; error?: string };
  cloneSnapshot:    (snapId: string, targetName: string) => { ok: boolean; error?: string };
  sendSnapshot:     (snapId: string, targetPoolId: string) => { ok: boolean; error?: string };

  createSchedule:   (data: Omit<ZFSSchedule, 'id'>) => void;
  updateSchedule:   (id: string, patch: Partial<ZFSSchedule>) => void;
  deleteSchedule:   (id: string) => void;

  getPoolDatasets:   (poolId: string) => ZFSDataset[];
  getDatasetSnapshots: (datasetName: string) => ZFSSnapshot[];
  getPoolScrub:       (poolId: string) => ZFSScrubStatus | null;
  getPoolSchedules:   (poolId: string) => ZFSSchedule[];
  getPoolHealth:      (poolId: string) => { errors: number; warnings: number };
}

/* ─── Helpers for persistence ─── */
function persistAll() {
  const s = useZFSStore.getState();
  if (s.pools)     db.setZFSPools(s.pools as unknown as StoredZFSPool[]);
  if (s.datasets)  db.setZFSDatasets(s.datasets as unknown as StoredZFSDataset[]);
  if (s.snapshots) db.setZFSSnapshots(s.snapshots as unknown as StoredZFSSnapshot[]);
  if (s.schedules) db.setZFSSchedules(s.schedules as unknown as StoredZFSSchedule[]);
}

let _scrubTimers = new Map<string, ReturnType<typeof setInterval>>();

export const useZFSStore = create<ZFSStore>((set, get) => ({
  pools:     initialPools,
  datasets:  initialDatasets,
  snapshots: initialSnapshots,
  schedules: initialSchedules,
  scrubs:    new Map(),

  /* ─── Pool ops ─── */
  createPool: (name, vdevType, diskIds, opts) => {
    const n = sanitize(name);
    if (!n) return { ok: false, error: 'Nombre inválido' };
    if (get().pools.some(p => p.name === n))
      return { ok: false, error: `El pool "${n}" ya existe` };

    const totalGB = 4000; // simulated
    const pool: ZFSPool = {
      id: genId('pool'),
      name: n,
      status: 'ONLINE',
      totalGB, usedGB: 0, freeGB: totalGB,
      dedupRatio: 1.00, fragmentation: 0, allocatable: 100,
      guid: crypto.randomUUID?.() || genId('guid'),
      createdAt: new Date().toLocaleDateString('es-ES'),
      feature_async_destroy: true,
      feature_encryption: true,
      feature_lz4_compress: true,
      feature_spacemap_v2: true,
      feature_zstd_compress: true,
      feature_device_removal: false,
      scrubStatus: 'idle',
      vdevs: [{ id: genId('vd'), type: vdevType as ZFSVdev['type'], diskIds, status: 'ONLINE', readErrors: 0, writeErrors: 0, checksumErrors: 0 }],
      ...opts,
    };
    const newPools = [...get().pools, pool];
    set({ pools: newPools });
    persistAll();
    return { ok: true };
  },

  destroyPool: (poolId) => {
    const pool = get().pools.find(p => p.id === poolId);
    if (!pool) return { ok: false, error: 'Pool no encontrado' };
    set(s => ({
      pools:     s.pools.filter(p => p.id !== poolId),
      datasets:  s.datasets.filter(d => d.poolId !== poolId),
      snapshots: s.snapshots.filter(sn => sn.poolId !== poolId),
      schedules: s.schedules.filter(sc => sc.poolId !== poolId),
    }));
    persistAll();
    return { ok: true };
  },

  exportPool: (poolId) => {
    set(s => ({
      pools: s.pools.map(p => p.id === poolId ? { ...p, status: 'EXPORTED' as ZFSPool['status'] } : p),
    }));
    persistAll();
    return { ok: true };
  },

  importPool: (guid) => {
    set(s => ({
      pools: s.pools.map(p => p.guid === guid ? { ...p, status: 'ONLINE' } : p),
    }));
    persistAll();
    return { ok: true };
  },

  startScrub: (poolId) => {
    set(s => ({
      pools: s.pools.map(p => p.id === poolId ? { ...p, scrubStatus: 'scrubbing', scrubProgress: 0 } : p),
    }));
    persistAll();
    // Simulate scrub progress
    const timer = setInterval(() => {
      const st = useZFSStore.getState();
      const pool = st.pools.find(p => p.id === poolId);
      if (!pool || (pool.scrubProgress ?? 0) >= 100) {
        clearInterval(timer);
        _scrubTimers.delete(poolId);
        set(s => ({
          pools: s.pools.map(p => p.id === poolId ? { ...p, scrubStatus: 'idle', lastScrub: new Date().toLocaleDateString('es-ES') } : p),
        }));
        persistAll();
        return;
      }
      set(s => ({
        pools: s.pools.map(p => p.id === poolId ? { ...p, scrubProgress: (p.scrubProgress ?? 0) + 5 } : p),
      }));
    }, 500);
    _scrubTimers.set(poolId, timer);
  },

  stopScrub: (poolId) => {
    const timer = _scrubTimers.get(poolId);
    if (timer) { clearInterval(timer); _scrubTimers.delete(poolId); }
    set(s => ({
      pools: s.pools.map(p => p.id === poolId ? { ...p, scrubStatus: 'idle', scrubProgress: undefined } : p),
    }));
    persistAll();
  },

  /* ─── Dataset ops ─── */
  createDataset: (data) => {
    const name = sanitize(data.name);
    if (!name) return { ok: false, error: 'Nombre inválido' };
    if (get().datasets.some(d => d.name === name))
      return { ok: false, error: `El dataset "${name}" ya existe` };

    const ds: ZFSDataset = {
      ...data,
      id: genId('ds'),
      name,
      usedGB: 0, availableGB: 0, referencedGB: 0,
      createdAt: new Date().toLocaleDateString('es-ES'),
      encryption: data.encryption ?? false,
      encrypted: data.encrypted ?? false,
      keyStatus: data.encrypted ? 'available' : undefined,
      dedup: data.dedup ?? false,
      readonly: data.readonly ?? false,
      clones: [],
      origin: '',
    };
    set(s => ({ datasets: [...s.datasets, ds] }));
    persistAll();
    return { ok: true };
  },

  destroyDataset: (datasetId, recursive) => {
    const ds = get().datasets.find(d => d.id === datasetId);
    if (!ds) return { ok: false, error: 'Dataset no encontrado' };
    if (recursive) {
      set(s => ({
        datasets: s.datasets.filter(d => !d.name.startsWith(ds.name + '/') && d.id !== datasetId),
      }));
    } else {
      set(s => ({ datasets: s.datasets.filter(d => d.id !== datasetId) }));
    }
    persistAll();
    return { ok: true };
  },

  updateDataset: (datasetId, props) => {
    set(s => ({
      datasets: s.datasets.map(d => d.id === datasetId ? { ...d, ...props } : d),
    }));
    persistAll();
  },

  mountDataset: (datasetId) => {
    set(s => ({
      datasets: s.datasets.map(d => d.id === datasetId ? { ...d, mountPoint: `/${d.name.replace(/\//g, '/')}` } : d),
    }));
    persistAll();
    return { ok: true };
  },

  loadKey: (datasetId) => {
    set(s => ({
      datasets: s.datasets.map(d => d.id === datasetId ? { ...d, keyStatus: 'available' as const } : d),
    }));
    persistAll();
    return { ok: true };
  },

  unloadKey: (datasetId) => {
    set(s => ({
      datasets: s.datasets.map(d => d.id === datasetId ? { ...d, keyStatus: 'unavailable' as const } : d),
    }));
    persistAll();
    return { ok: true };
  },

  setShareSMB: (datasetId, share) => {
    set(s => ({
      datasets: s.datasets.map(d => d.id === datasetId ? { ...d, sharesmb: share } : d),
    }));
    persistAll();
  },

  setShareNFS: (datasetId, share) => {
    set(s => ({
      datasets: s.datasets.map(d => d.id === datasetId ? { ...d, sharenfs: share } : d),
    }));
    persistAll();
  },

  /* ─── Snapshot ops ─── */
  createSnapshot: (datasetName, poolId, snapName, desc) => {
    const n = sanitize(snapName);
    if (!n) return { ok: false, error: 'Nombre inválido' };
    const snap: ZFSSnapshot = {
      id: genId('snap'),
      poolId,
      datasetName,
      name: n,
      fullName: `${datasetName}@${n}`,
      usedGB: 0,
      referencedGB: 0,
      createdAt: new Date().toLocaleDateString('es-ES'),
      description: desc,
      isAutomatic: false,
    };
    set(s => ({ snapshots: [...s.snapshots, snap] }));
    persistAll();
    return { ok: true };
  },

  destroySnapshot: (snapId) => {
    set(s => ({ snapshots: s.snapshots.filter(sn => sn.id !== snapId) }));
    persistAll();
    return { ok: true };
  },

  rollbackSnapshot: (snapId) => {
    const snap = get().snapshots.find(s => s.id === snapId);
    if (!snap) return { ok: false, error: 'Snapshot no encontrado' };
    set(s => ({
      datasets: s.datasets.map(d =>
        d.name === snap.datasetName ? { ...d, usedGB: snap.referencedGB } : d
      ),
    }));
    persistAll();
    return { ok: true };
  },

  cloneSnapshot: (snapId, targetName) => {
    const snap = get().snapshots.find(s => s.id === snapId);
    if (!snap) return { ok: false, error: 'Snapshot no encontrado' };
    const clone: ZFSDataset = {
      id: genId('ds'),
      poolId: snap.poolId,
      name: targetName,
      type: 'filesystem',
      mountPoint: `/${targetName}`,
      usedGB: 0, availableGB: 0, referencedGB: 0,
      compression: 'lz4', checksum: 'on', atime: 'off',
      recordsize: '128K', encryption: false, encrypted: false,
      dedup: false, readonly: false,
      origin: snap.fullName, clones: [],
      createdAt: new Date().toLocaleDateString('es-ES'),
      description: `Clon de ${snap.fullName}`,
    };
    set(s => ({ datasets: [...s.datasets, clone] }));
    persistAll();
    return { ok: true };
  },

  sendSnapshot: (snapId, targetPoolId) => {
    return { ok: true };
  },

  /* ─── Schedule ops ─── */
  createSchedule: (data) => {
    const schedule: ZFSSchedule = { ...data, id: genId('sched') };
    set(s => ({ schedules: [...s.schedules, schedule] }));
    persistAll();
  },

  updateSchedule: (id, patch) => {
    set(s => ({
      schedules: s.schedules.map(sc => sc.id === id ? { ...sc, ...patch } : sc),
    }));
    persistAll();
  },

  deleteSchedule: (id) => {
    set(s => ({ schedules: s.schedules.filter(sc => sc.id !== id) }));
    persistAll();
  },

  /* ─── Queries ─── */
  getPoolDatasets: (poolId) => get().datasets.filter(d => d.poolId === poolId),
  getDatasetSnapshots: (datasetName) => get().snapshots.filter(s => s.datasetName === datasetName),
  getPoolScrub: (poolId) => get().scrubs.get(poolId) ?? null,
  getPoolSchedules: (poolId) => get().schedules.filter(s => s.poolId === poolId),
  getPoolHealth: (poolId) => {
    const pool = get().pools.find(p => p.id === poolId);
    if (!pool) return { errors: 0, warnings: 0 };
    return {
      errors: pool.vdevs.reduce((s, v) => s + v.readErrors + v.writeErrors + v.checksumErrors, 0),
      warnings: pool.status === 'DEGRADED' ? pool.vdevs.filter(v => v.status !== 'ONLINE').length : 0,
    };
  },
}));