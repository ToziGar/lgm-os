import { useState, useRef } from 'react';
import {
  Database, HardDrive, Camera, RefreshCw, Plus, Trash2,
  ChevronRight, ChevronDown, Lock, Unlock, Shield,
  AlertTriangle, CheckCircle2, AlertCircle, Play,
  Square, Copy, RotateCcw, ArrowRight, Settings,
  Clock, BarChart2, Layers, GitBranch, Info,
} from 'lucide-react';
import { useZFSStore } from '../../store/zfsStore';
import { useSystemStore } from '../../store/systemStore';
import type {
  ZFSPool, ZFSDataset, ZFSSnapshot, ZFSSchedule,
  ZFSCompression, ZFSChecksum, ZFSAtime, ZFSRecordsize,
} from '../../types';
import './ZFSPanel.css';

/* ─── Constants ─── */
const COMPRESSIONS: ZFSCompression[] = ['off','lz4','zstd','zstd-1','zstd-3','zstd-9','gzip','gzip-1','gzip-9'];
const CHECKSUMS:    ZFSChecksum[]    = ['on','off','sha256','sha512','blake3'];
const ATIMES:       ZFSAtime[]       = ['off','on','relatime'];
const RECORDSIZES:  ZFSRecordsize[]  = ['4K','8K','16K','32K','64K','128K','256K','512K','1M'];

/* ─── Pool status icon ─── */
function PoolStatusIcon({ status }: { status: ZFSPool['status'] }) {
  if (status === 'ONLINE')   return <CheckCircle2 size={14} style={{ color: '#00b87c' }}/>;
  if (status === 'DEGRADED') return <AlertTriangle size={14} style={{ color: '#f59e0b' }}/>;
  if (status === 'FAULTED')  return <AlertCircle size={14} style={{ color: '#ef4444' }}/>;
  return <Info size={14} style={{ color: '#6b7280' }}/>;
}

function StatusBadge({ status }: { status: ZFSPool['status'] }) {
  const C: Record<string, string> = {
    ONLINE: '#00b87c', DEGRADED: '#f59e0b', FAULTED: '#ef4444',
    OFFLINE: '#6b7280', UNAVAIL: '#ef4444', REMOVED: '#6b7280', SUSPENDED: '#f97316',
  };
  const color = C[status] ?? '#6b7280';
  return <span className="zfs__badge" style={{ color, background: color + '18' }}>{status}</span>;
}

/* ─── Pool Overview card ─── */
function PoolCard({
  pool, selected, onClick,
}: { pool: ZFSPool; selected: boolean; onClick: () => void }) {
  const pct = Math.round((pool.usedGB / pool.totalGB) * 100);
  const { getPoolHealth } = useZFSStore();
  const health = getPoolHealth(pool.id);

  return (
    <div className={`zfs__pool-card ${selected ? 'zfs__pool-card--sel' : ''} zfs__pool-card--${pool.status.toLowerCase()}`}
      onClick={onClick}>
      <div className="zfs__pool-header">
        <PoolStatusIcon status={pool.status}/>
        <span className="zfs__pool-name">{pool.name}</span>
        <StatusBadge status={pool.status}/>
        {pool.scrubStatus === 'scrubbing' && (
          <span className="zfs__scrub-badge">
            <RefreshCw size={10} className="zfs__spin"/> {pool.scrubProgress ?? 0}%
          </span>
        )}
      </div>

      <div className="zfs__pool-bar">
        <div className="zfs__pool-fill" style={{
          width: `${pct}%`,
          background: pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#3b82f6',
        }}/>
      </div>

      <div className="zfs__pool-stats">
        <span>{pool.usedGB} / {pool.totalGB} GB</span>
        <span>{pct}% usado</span>
        <span>Frag: {pool.fragmentation}%</span>
      </div>

      <div className="zfs__pool-meta">
        <span className="zfs__meta-chip">Dedup {pool.dedupRatio.toFixed(2)}×</span>
        <span className="zfs__meta-chip">{pool.vdevs[0]?.type ?? '—'}</span>
        {health.errors > 0 && <span className="zfs__meta-chip zfs__meta-chip--err">{health.errors} errores</span>}
        {health.warnings > 0 && <span className="zfs__meta-chip zfs__meta-chip--warn">{health.warnings} checksums</span>}
      </div>
    </div>
  );
}

/* ─── Dataset tree row ─── */
function DatasetRow({
  ds, depth, expanded, onToggle, selected, onSelect, onSnapshot,
}: {
  ds: ZFSDataset; depth: number; expanded: boolean;
  onToggle: () => void; selected: boolean;
  onSelect: () => void; onSnapshot: () => void;
}) {
  const isRoot = !ds.name.includes('/');

  return (
    <div
      className={`zfs__ds-row ${selected ? 'zfs__ds-row--sel' : ''}`}
      style={{ paddingLeft: 12 + depth * 18 }}
      onClick={onSelect}
    >
      <button className="zfs__ds-toggle" onClick={e => { e.stopPropagation(); onToggle(); }}>
        {isRoot || depth === 0 ? (expanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>) : <span style={{ width: 12 }}/>}
      </button>

      <span className="zfs__ds-icon">
        {ds.type === 'snapshot' ? <Camera size={13} style={{ color: '#8b5cf6' }}/> : <Database size={13} style={{ color: '#3b82f6' }}/>}
      </span>

      <span className="zfs__ds-name">
        {ds.name.split('/').slice(-1)[0]}
      </span>

      {ds.encryption && (
        ds.keyStatus === 'available'
          ? <Lock size={11} style={{ color: '#00b87c' }} aria-label="Cifrado — clave cargada"/>
          : <Lock size={11} style={{ color: '#f59e0b' }} aria-label="Cifrado — clave no cargada"/>
      )}

      {ds.readonly && <span className="zfs__ds-tag">RO</span>}
      {ds.origin && <span title="Clon"><GitBranch size={11} style={{ color: '#8b5cf6' }}/></span>}

      <div className="zfs__ds-right">
        {ds.compression !== 'off' && <span className="zfs__ds-comp">{ds.compression}</span>}
        <span className="zfs__ds-size">{ds.usedGB.toFixed(1)} GB</span>
        {ds.type === 'filesystem' && (
          <button className="zfs__ds-snap-btn" title="Tomar snapshot"
            onClick={e => { e.stopPropagation(); onSnapshot(); }}>
            <Camera size={11}/>
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Create Pool Wizard ─── */
const VDEV_TYPES = [
  { id: 'disk',   label: 'Básico (sin redundancia)', minDisks: 1, desc: 'Un solo disco. Sin tolerancia a fallos.' },
  { id: 'mirror', label: 'Mirror (espejo)',          minDisks: 2, desc: 'Espejo de todos los discos. Tolera N-1 fallos.' },
  { id: 'raidz',  label: 'RAIDZ-1',                 minDisks: 3, desc: 'Paridad simple. 1 disco de paridad. Capacidad: N-1.' },
  { id: 'raidz2', label: 'RAIDZ-2',                 minDisks: 4, desc: 'Doble paridad. Tolera 2 fallos simultáneos.' },
  { id: 'raidz3', label: 'RAIDZ-3',                 minDisks: 5, desc: 'Triple paridad. Tolera 3 fallos. Máxima seguridad.' },
];

const RECOMMENDED: Record<string, { recordsize: ZFSRecordsize; compression: ZFSCompression; atime: ZFSAtime; dedup: boolean; desc: string }> = {
  general:    { recordsize: '128K', compression: 'lz4',    atime: 'off', dedup: false, desc: 'Uso general: archivos, documentos, backups' },
  vm:         { recordsize: '64K',  compression: 'lz4',    atime: 'off', dedup: false, desc: 'Imágenes de VMs y contenedores' },
  database:   { recordsize: '4K',   compression: 'lz4',    atime: 'off', dedup: false, desc: 'Bases de datos (MySQL, PostgreSQL)' },
  media:      { recordsize: '1M',   compression: 'off',    atime: 'off', dedup: false, desc: 'Fotos, vídeos, música (ya comprimidos)' },
  backup:     { recordsize: '1M',   compression: 'zstd-9', atime: 'off', dedup: false, desc: 'Copias de seguridad (máxima compresión)' },
  hpc:        { recordsize: '512K', compression: 'zstd-3', atime: 'off', dedup: false, desc: 'Cálculo científico y ficheros grandes' },
};

function CreatePoolWizard({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [vdevType, setVdevType] = useState('mirror');
  const [selectedDisks, setSelectedDisks] = useState<string[]>([]);
  const [preset, setPreset] = useState('general');
  const [compress, setCompress] = useState<ZFSCompression>('lz4');
  const [checksum, setChecksum] = useState<ZFSChecksum>('sha256');
  const [atime, setAtime] = useState<ZFSAtime>('off');
  const [recordsize, setRecordsize] = useState<ZFSRecordsize>('128K');
  const [dedup, setDedup] = useState(false);
  const [encrypt, setEncrypt] = useState(false);
  const [error, setError] = useState('');

  const { createPool } = useZFSStore();
  const { addNotification } = useSystemStore();

  // Mock free disks (in a real app these come from the disk store)
  const FREE_DISKS = [
    { id: 'free-d1', model: 'WD Red Pro 4TB',       slot: 7,  sizeGB: 3815 },
    { id: 'free-d2', model: 'WD Red Pro 4TB',       slot: 8,  sizeGB: 3815 },
    { id: 'free-d3', model: 'Seagate IronWolf 8TB', slot: 9,  sizeGB: 7452 },
    { id: 'free-d4', model: 'Seagate IronWolf 8TB', slot: 10, sizeGB: 7452 },
    { id: 'free-d5', model: 'Samsung 870 EVO 2TB',  slot: 11, sizeGB: 1907 },
  ];

  const minDisks = VDEV_TYPES.find(v => v.id === vdevType)?.minDisks ?? 1;
  const vdevInfo = VDEV_TYPES.find(v => v.id === vdevType);

  const applyPreset = (key: string) => {
    const p = RECOMMENDED[key];
    if (!p) return;
    setPreset(key);
    setCompress(p.compression);
    setAtime(p.atime);
    setRecordsize(p.recordsize);
    setDedup(p.dedup);
  };

  const toggleDisk = (id: string) =>
    setSelectedDisks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const estimateCapacity = () => {
    const sizes = selectedDisks.map(id => FREE_DISKS.find(d => d.id === id)?.sizeGB ?? 4000);
    if (sizes.length === 0) return 0;
    const min = Math.min(...sizes);
    if (vdevType === 'disk')   return sizes.reduce((s, x) => s + x, 0);
    if (vdevType === 'mirror') return min;
    if (vdevType === 'raidz')  return min * (sizes.length - 1);
    if (vdevType === 'raidz2') return min * (sizes.length - 2);
    if (vdevType === 'raidz3') return min * (sizes.length - 3);
    return min;
  };

  const finish = () => {
    if (!name.trim()) { setError('El nombre del pool es requerido'); return; }
    if (selectedDisks.length < minDisks) { setError(`Necesitas al menos ${minDisks} discos para ${vdevType}`); return; }
    setError('');
    const res = createPool(name, vdevType, selectedDisks, { feature_encryption: encrypt });
    if (!res.ok) { setError(res.error!); return; }
    addNotification('Pool ZFS creado', `zpool "${name}" (${vdevType}) listo`, 'success');
    onDone();
  };

  const STEPS = ['Nombre y topología', 'Selección de discos', 'Propiedades', 'Revisar y crear'];

  return (
    <div className="zfs__wizard">
      <div className="zfs__wizard-header">
        <h3>Crear nuevo pool ZFS</h3>
        <button className="zfs__close-btn" onClick={onDone}>✕</button>
      </div>

      {/* Steps */}
      <div className="zfs__steps">
        {STEPS.map((s, i) => (
          <div key={i} className={`zfs__step ${i === step ? 'zfs__step--active' : ''} ${i < step ? 'zfs__step--done' : ''}`}>
            <div className="zfs__step-num">{i < step ? '✓' : i + 1}</div>
            <span>{s}</span>
          </div>
        ))}
      </div>

      {error && <div className="zfs__wizard-error"><AlertCircle size={13}/> {error}</div>}

      <div className="zfs__wizard-body">
        {/* Step 0: Name & vdev type */}
        {step === 0 && (
          <div className="zfs__wizard-step">
            <div className="zfs__field">
              <label>Nombre del pool</label>
              <input className="zfs__input" placeholder="tank" value={name} onChange={e => setName(e.target.value)} autoFocus/>
              <span className="zfs__hint">Usa nombres cortos como: tank, data, backup, media</span>
            </div>
            <div className="zfs__field">
              <label>Tipo de topología (vdev)</label>
              <div className="zfs__vdev-grid">
                {VDEV_TYPES.map(vt => (
                  <button key={vt.id}
                    className={`zfs__vdev-btn ${vdevType === vt.id ? 'zfs__vdev-btn--sel' : ''}`}
                    onClick={() => setVdevType(vt.id)}>
                    <span className="zfs__vdev-label">{vt.label}</span>
                    <span className="zfs__vdev-min">Mín: {vt.minDisks} disco{vt.minDisks !== 1 ? 's' : ''}</span>
                    <span className="zfs__vdev-desc">{vt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            {vdevInfo && (
              <div className="zfs__wizard-info">
                <Info size={13}/> <span><strong>{vdevInfo.label}</strong>: {vdevInfo.desc}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Disk selection */}
        {step === 1 && (
          <div className="zfs__wizard-step">
            <div className="zfs__field-row">
              <span className="zfs__field-label">Discos disponibles</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedDisks.length}/{FREE_DISKS.length} seleccionados · mín {minDisks}</span>
            </div>
            <div className="zfs__disk-list">
              {FREE_DISKS.map(d => (
                <div key={d.id}
                  className={`zfs__disk-item ${selectedDisks.includes(d.id) ? 'zfs__disk-item--sel' : ''}`}
                  onClick={() => toggleDisk(d.id)}>
                  <div className="zfs__disk-check">{selectedDisks.includes(d.id) ? '✓' : ''}</div>
                  <HardDrive size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }}/>
                  <div className="zfs__disk-info">
                    <span className="zfs__disk-model">{d.model}</span>
                    <span className="zfs__disk-slot">Ranura {d.slot} · {(d.sizeGB / 1024).toFixed(1)} TB</span>
                  </div>
                </div>
              ))}
            </div>
            {selectedDisks.length >= minDisks && (
              <div className="zfs__capacity-est">
                <BarChart2 size={14} style={{ color: '#3b82f6' }}/>
                <span>Capacidad estimada: <strong>{(estimateCapacity() / 1024).toFixed(2)} TB</strong> ({vdevType})</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Properties */}
        {step === 2 && (
          <div className="zfs__wizard-step">
            <div className="zfs__field">
              <label>Perfil de uso (preset)</label>
              <div className="zfs__preset-grid">
                {Object.entries(RECOMMENDED).map(([key, val]) => (
                  <button key={key}
                    className={`zfs__preset-btn ${preset === key ? 'zfs__preset-btn--sel' : ''}`}
                    onClick={() => applyPreset(key)}>
                    <span className="zfs__preset-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    <span className="zfs__preset-desc">{val.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="zfs__props-grid">
              <div className="zfs__prop-row"><label>Compresión</label>
                <select className="zfs__select" value={compress} onChange={e => setCompress(e.target.value as ZFSCompression)}>
                  {COMPRESSIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="zfs__prop-row"><label>Checksum</label>
                <select className="zfs__select" value={checksum} onChange={e => setChecksum(e.target.value as ZFSChecksum)}>
                  {CHECKSUMS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="zfs__prop-row"><label>Record size</label>
                <select className="zfs__select" value={recordsize} onChange={e => setRecordsize(e.target.value as ZFSRecordsize)}>
                  {RECORDSIZES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="zfs__prop-row"><label>Atime</label>
                <select className="zfs__select" value={atime} onChange={e => setAtime(e.target.value as ZFSAtime)}>
                  {ATIMES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="zfs__prop-row zfs__prop-row--toggle"><label>Deduplicación</label>
                <label className="zfs__switch"><input type="checkbox" checked={dedup} onChange={e => setDedup(e.target.checked)}/><span className="zfs__switch-slider"/></label>
                {dedup && <span className="zfs__warn-inline">⚠ Consume mucha RAM</span>}
              </div>
              <div className="zfs__prop-row zfs__prop-row--toggle"><label>Cifrado nativo</label>
                <label className="zfs__switch"><input type="checkbox" checked={encrypt} onChange={e => setEncrypt(e.target.checked)}/><span className="zfs__switch-slider"/></label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="zfs__wizard-step">
            <div className="zfs__review">
              <div className="zfs__review-title">Resumen de configuración</div>
              <table className="zfs__review-table">
                <tbody>
                  <tr><td>Nombre del pool</td><td><code>{name || '(sin nombre)'}</code></td></tr>
                  <tr><td>Topología</td><td>{vdevType} · {selectedDisks.length} disco{selectedDisks.length !== 1 ? 's' : ''}</td></tr>
                  <tr><td>Capacidad estimada</td><td>{(estimateCapacity() / 1024).toFixed(2)} TB</td></tr>
                  <tr><td>Compresión</td><td>{compress}</td></tr>
                  <tr><td>Checksum</td><td>{checksum}</td></tr>
                  <tr><td>Record size</td><td>{recordsize}</td></tr>
                  <tr><td>Atime</td><td>{atime}</td></tr>
                  <tr><td>Deduplicación</td><td>{dedup ? 'Sí ⚠' : 'No'}</td></tr>
                  <tr><td>Cifrado nativo</td><td>{encrypt ? '🔒 Sí' : 'No'}</td></tr>
                </tbody>
              </table>
              <div className="zfs__review-cmd">
                <span className="zfs__cmd-label">Comando equivalente:</span>
                <code className="zfs__cmd-block">zpool create {vdevType !== 'disk' ? vdevType + ' ' : ''}{name} {selectedDisks.slice(0,2).join(' ')} {selectedDisks.length > 2 ? '…' : ''}</code>
                <code className="zfs__cmd-block">zfs set compression={compress} checksum={checksum} atime={atime} recordsize={recordsize} {name}</code>
                {encrypt && <code className="zfs__cmd-block">zfs set encryption=aes-256-gcm keylocation=prompt keyformat=passphrase {name}</code>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="zfs__wizard-footer">
        {step > 0 && <button className="zfs__btn" onClick={() => setStep(s => s - 1)}>← Atrás</button>}
        <div style={{ flex: 1 }}/>
        {step < 3
          ? <button className="zfs__btn zfs__btn--primary" onClick={() => { setError(''); setStep(s => s + 1); }}>
              Siguiente →
            </button>
          : <button className="zfs__btn zfs__btn--create" onClick={finish}>
              <Plus size={13}/> Crear pool ZFS
            </button>
        }
      </div>
    </div>
  );
}

/* ─── Dataset detail panel ─── */
function DatasetDetail({ ds, onClose }: { ds: ZFSDataset; onClose: () => void }) {
  const { updateDataset, destroyDataset, createSnapshot, getDatasetSnapshots, destroySnapshot, rollbackSnapshot, cloneSnapshot, setShareSMB, setShareNFS, loadKey, unloadKey } = useZFSStore();
  const { addNotification } = useSystemStore();
  const [snapName, setSnapName] = useState('');
  const [snapDesc, setSnapDesc] = useState('');
  const [cloneName, setCloneName] = useState('');
  const [activeTab, setActiveTab] = useState<'props' | 'snaps' | 'sharing'>('props');

  const snapshots = getDatasetSnapshots(ds.name);

  const takeSnap = () => {
    if (!snapName.trim()) return;
    const res = createSnapshot(ds.name, ds.poolId, snapName, snapDesc);
    if (res.ok) addNotification('Snapshot creado', `${ds.name}@${snapName}`, 'success');
    else addNotification('Error', res.error!, 'error');
    setSnapName(''); setSnapDesc('');
  };

  const deleteDs = () => {
    const res = destroyDataset(ds.id, true);
    if (!res.ok) addNotification('Error', res.error!, 'error');
    else { addNotification('Dataset eliminado', ds.name, 'warning'); onClose(); }
  };

  return (
    <div className="zfs__detail">
      <div className="zfs__detail-header">
        <Database size={16} style={{ color: '#3b82f6' }}/>
        <div>
          <h4>{ds.name}</h4>
          {ds.mountPoint && <span className="zfs__detail-mount">{ds.mountPoint}</span>}
        </div>
        <button className="zfs__close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="zfs__detail-tabs">
        {(['props','snaps','sharing'] as const).map(t => (
          <button key={t} className={`zfs__detail-tab ${activeTab === t ? 'zfs__detail-tab--active' : ''}`}
            onClick={() => setActiveTab(t)}>
            {t === 'props' ? 'Propiedades' : t === 'snaps' ? `Snapshots (${snapshots.length})` : 'Compartir'}
          </button>
        ))}
      </div>

      <div className="zfs__detail-body">
        {activeTab === 'props' && (
          <>
            {/* Encryption key control */}
            {ds.encryption && (
              <div className="zfs__enc-bar">
                <Lock size={13} style={{ color: ds.keyStatus === 'available' ? '#00b87c' : '#f59e0b' }}/>
                <span>Cifrado · clave {ds.keyStatus === 'available' ? 'cargada' : 'no cargada'}</span>
                {ds.keyStatus === 'available'
                  ? <button className="zfs__btn zfs__btn--sm" onClick={() => { unloadKey(ds.id); addNotification('Clave descargada', ds.name, 'info'); }}>Descargar clave</button>
                  : <button className="zfs__btn zfs__btn--sm zfs__btn--primary" onClick={() => { loadKey(ds.id); addNotification('Clave cargada', ds.name, 'success'); }}>Cargar clave</button>
                }
              </div>
            )}

            <div className="zfs__props-list">
              {[
                ['Usado',       `${ds.usedGB.toFixed(1)} GB`],
                ['Disponible',  `${ds.availableGB.toFixed(0)} GB`],
                ['Referenciado', `${ds.referencedGB.toFixed(1)} GB`],
                ['Creado',       ds.createdAt],
                ...(ds.quota   ? [['Cuota', `${ds.quota} GB`]] : []),
                ...(ds.origin  ? [['Origen (clon)', ds.origin]] : []),
              ].map(([k, v]) => (
                <div key={k} className="zfs__prop-kv"><span>{k}</span><strong>{v}</strong></div>
              ))}
            </div>

            {/* Editable props */}
            <div className="zfs__props-edit">
              <div className="zfs__prop-row"><label>Compresión</label>
                <select className="zfs__select" value={ds.compression}
                  onChange={e => updateDataset(ds.id, { compression: e.target.value as ZFSCompression })}>
                  {COMPRESSIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="zfs__prop-row"><label>Checksum</label>
                <select className="zfs__select" value={ds.checksum}
                  onChange={e => updateDataset(ds.id, { checksum: e.target.value as ZFSChecksum })}>
                  {CHECKSUMS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="zfs__prop-row"><label>Record size</label>
                <select className="zfs__select" value={ds.recordsize}
                  onChange={e => updateDataset(ds.id, { recordsize: e.target.value as ZFSRecordsize })}>
                  {RECORDSIZES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="zfs__prop-row"><label>Atime</label>
                <select className="zfs__select" value={ds.atime}
                  onChange={e => updateDataset(ds.id, { atime: e.target.value as ZFSAtime })}>
                  {ATIMES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="zfs__prop-row zfs__prop-row--toggle"><label>Solo lectura</label>
                <label className="zfs__switch">
                  <input type="checkbox" checked={ds.readonly}
                    onChange={e => updateDataset(ds.id, { readonly: e.target.checked })}/>
                  <span className="zfs__switch-slider"/>
                </label>
              </div>
            </div>

            {ds.name !== 'rpool' && ds.name !== 'rpool/ROOT' && (
              <button className="zfs__btn zfs__btn--danger" onClick={deleteDs} style={{ marginTop: 12 }}>
                <Trash2 size={13}/> Destruir dataset
              </button>
            )}
          </>
        )}

        {activeTab === 'snaps' && (
          <>
            {/* New snapshot form */}
            <div className="zfs__snap-form">
              <input className="zfs__input" placeholder="Nombre del snapshot" value={snapName}
                onChange={e => setSnapName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && takeSnap()}/>
              <input className="zfs__input" placeholder="Descripción (opcional)" value={snapDesc}
                onChange={e => setSnapDesc(e.target.value)}/>
              <button className="zfs__btn zfs__btn--primary" onClick={takeSnap}><Camera size={13}/> Tomar</button>
            </div>

            {/* Snapshot list */}
            {snapshots.length === 0
              ? <div className="zfs__empty">Sin snapshots</div>
              : snapshots.map(sn => (
                <div key={sn.id} className="zfs__snap-row">
                  <Camera size={12} style={{ color: '#8b5cf6', flexShrink: 0 }}/>
                  <div className="zfs__snap-info">
                    <span className="zfs__snap-name">{sn.name}</span>
                    <span className="zfs__snap-meta">{sn.createdAt} · {sn.usedGB.toFixed(1)} GB</span>
                    {sn.description && <span className="zfs__snap-desc">{sn.description}</span>}
                  </div>
                  {sn.isAutomatic && <span className="zfs__auto-badge">auto</span>}
                  <div className="zfs__snap-actions">
                    <button title="Rollback" className="zfs__icon-btn"
                      onClick={() => { const r = rollbackSnapshot(sn.id); r.ok ? addNotification('Rollback OK', sn.fullName, 'success') : addNotification('Error', r.error!, 'error'); }}>
                      <RotateCcw size={12}/>
                    </button>
                    <button title="Clonar" className="zfs__icon-btn"
                      onClick={() => { const t = `${ds.name.split('/')[0]}/clone-${sn.name}`; const r = cloneSnapshot(sn.id, t); r.ok ? addNotification('Clon creado', t, 'success') : addNotification('Error', r.error!, 'error'); }}>
                      <Copy size={12}/>
                    </button>
                    <button title="Eliminar" className="zfs__icon-btn zfs__icon-btn--danger"
                      onClick={() => { destroySnapshot(sn.id); addNotification('Snapshot eliminado', sn.name, 'warning'); }}>
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>
              ))
            }
          </>
        )}

        {activeTab === 'sharing' && (
          <div className="zfs__sharing">
            <div className="zfs__share-row">
              <label>SMB (Windows/macOS)</label>
              <label className="zfs__switch">
                <input type="checkbox" checked={ds.sharesmb === 'on'}
                  onChange={e => setShareSMB(ds.id, e.target.checked ? 'on' : 'off')}/>
                <span className="zfs__switch-slider"/>
              </label>
            </div>
            {ds.sharesmb === 'on' && (
              <div className="zfs__share-info"><code>\\\\lgm-nas-01\\{ds.name.split('/').slice(-1)[0]}</code></div>
            )}
            <div className="zfs__share-row">
              <label>NFS (Linux)</label>
              <label className="zfs__switch">
                <input type="checkbox" checked={ds.sharenfs === 'on'}
                  onChange={e => setShareNFS(ds.id, e.target.checked ? 'on' : 'off')}/>
                <span className="zfs__switch-slider"/>
              </label>
            </div>
            {ds.sharenfs === 'on' && (
              <div className="zfs__share-info"><code>mount -t nfs lgm-nas-01:{ds.mountPoint ?? '/'} /mnt</code></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Pool detail panel ─── */
function PoolDetail({ pool, onClose }: { pool: ZFSPool; onClose: () => void }) {
  const { destroyPool, exportPool, startScrub, stopScrub, createDataset, getPoolSchedules, createSchedule, updateSchedule, deleteSchedule } = useZFSStore();
  const { addNotification } = useSystemStore();
  const [tab, setTab] = useState<'info'|'sched'>('info');
  const [newDs, setNewDs] = useState('');
  const health = useZFSStore(s => s.getPoolHealth(pool.id));

  const doScrub = () => {
    if (pool.scrubStatus === 'scrubbing') { stopScrub(pool.id); addNotification('Scrub detenido', pool.name, 'info'); }
    else { startScrub(pool.id); addNotification('Scrub iniciado', pool.name, 'info'); }
  };

  const doCreate = () => {
    if (!newDs.trim()) return;
    const res = createDataset({
      poolId: pool.id, name: `${pool.name}/${newDs.trim()}`,
      type: 'filesystem', mountPoint: `/${pool.name}/${newDs.trim()}`,
      compression: 'lz4', checksum: 'sha256', atime: 'off',
      recordsize: '128K', encryption: false, dedup: false, readonly: false,
    });
    if (res.ok) addNotification('Dataset creado', `${pool.name}/${newDs}`, 'success');
    else addNotification('Error', res.error!, 'error');
    setNewDs('');
  };

  const schedules = getPoolSchedules(pool.id);

  return (
    <div className="zfs__detail">
      <div className="zfs__detail-header">
        <PoolStatusIcon status={pool.status}/>
        <div>
          <h4>zpool: {pool.name}</h4>
          <span className="zfs__detail-mount">{pool.guid}</span>
        </div>
        <button className="zfs__close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="zfs__detail-tabs">
        <button className={`zfs__detail-tab ${tab === 'info' ? 'zfs__detail-tab--active' : ''}`} onClick={() => setTab('info')}>Información</button>
        <button className={`zfs__detail-tab ${tab === 'sched' ? 'zfs__detail-tab--active' : ''}`} onClick={() => setTab('sched')}>Snapshots automáticos</button>
      </div>

      <div className="zfs__detail-body">
        {tab === 'info' && (
          <>
            <div className="zfs__props-list">
              {[
                ['Total',          `${pool.totalGB} GB`],
                ['Usado',          `${pool.usedGB} GB`],
                ['Libre',          `${pool.freeGB} GB`],
                ['Dedup ratio',    `${pool.dedupRatio.toFixed(2)}×`],
                ['Fragmentación',  `${pool.fragmentation}%`],
                ['Creado',          pool.createdAt],
                ['Último scrub',    pool.lastScrub ?? '—'],
                ['Errores E/S',    health.errors.toString()],
                ['Checksum warns', health.warnings.toString()],
              ].map(([k, v]) => (
                <div key={k} className="zfs__prop-kv"><span>{k}</span><strong>{v}</strong></div>
              ))}
            </div>

            {/* Vdev status */}
            <div className="zfs__vdev-list">
              <div className="zfs__vdev-title">VDEVs</div>
              {pool.vdevs.map(v => (
                <div key={v.id} className={`zfs__vdev-row zfs__vdev-row--${v.status.toLowerCase()}`}>
                  <Layers size={12}/>
                  <span className="zfs__vdev-type">{v.type}</span>
                  <span className="zfs__vdev-disks">{v.diskIds.length} discos</span>
                  <StatusBadge status={v.status}/>
                  {v.checksumErrors > 0 && <span className="zfs__vdev-err">{v.checksumErrors} checksum</span>}
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="zfs__features">
              <div className="zfs__features-title">Funciones habilitadas</div>
              {[
                ['encryption',      pool.feature_encryption],
                ['lz4_compress',    pool.feature_lz4_compress],
                ['zstd_compress',   pool.feature_zstd_compress],
                ['async_destroy',   pool.feature_async_destroy],
                ['spacemap_v2',     pool.feature_spacemap_v2],
                ['device_removal',  pool.feature_device_removal],
              ].map(([k, v]) => (
                <div key={String(k)} className="zfs__feature-row">
                  <span>{String(k).replace(/_/g, '_')}</span>
                  {v ? <CheckCircle2 size={12} style={{ color: '#00b87c' }}/> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="zfs__pool-actions">
              <button className="zfs__btn" onClick={doScrub}>
                {pool.scrubStatus === 'scrubbing'
                  ? <><Square size={13}/> Parar scrub</>
                  : <><Play size={13}/> Iniciar scrub</>
                }
              </button>
              {pool.scrubStatus === 'scrubbing' && (
                <div className="zfs__scrub-progress">
                  <div className="zfs__scrub-fill" style={{ width: `${pool.scrubProgress ?? 0}%` }}/>
                  <span>{pool.scrubProgress ?? 0}%</span>
                </div>
              )}
            </div>

            {/* New dataset */}
            <div className="zfs__new-ds-form">
              <div className="zfs__new-ds-label">Nuevo dataset en {pool.name}/</div>
              <div className="zfs__new-ds-row">
                <input className="zfs__input" placeholder="nombre" value={newDs}
                  onChange={e => setNewDs(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doCreate()}/>
                <button className="zfs__btn zfs__btn--primary" onClick={doCreate}><Plus size={13}/> Crear</button>
              </div>
            </div>

            {pool.name !== 'rpool' && (
              <div className="zfs__danger-zone">
                <button className="zfs__btn zfs__btn--outline" onClick={() => { const r = exportPool(pool.id); r.ok ? addNotification('Pool exportado', pool.name, 'info') : addNotification('Error', r.error!, 'error'); }}>
                  <ArrowRight size={13}/> Exportar pool
                </button>
                <button className="zfs__btn zfs__btn--danger" onClick={() => { const r = destroyPool(pool.id); r.ok ? (onClose(), addNotification('Pool destruido', pool.name, 'warning')) : addNotification('Error', r.error!, 'error'); }}>
                  <Trash2 size={13}/> Destruir pool
                </button>
              </div>
            )}
          </>
        )}

        {tab === 'sched' && (
          <>
            <div className="zfs__sched-list">
              {schedules.map(sc => (
                <div key={sc.id} className="zfs__sched-row">
                  <Clock size={13} style={{ color: sc.enabled ? '#00b87c' : 'var(--text-muted)' }}/>
                  <div className="zfs__sched-info">
                    <span className="zfs__sched-pattern">{sc.datasetPattern}</span>
                    <span className="zfs__sched-meta">{sc.frequency} · Retener {sc.keepCount}</span>
                    {sc.nextRun && <span className="zfs__sched-next">Próximo: {sc.nextRun}</span>}
                  </div>
                  <label className="zfs__switch" style={{ flexShrink: 0 }}>
                    <input type="checkbox" checked={sc.enabled}
                      onChange={e => updateSchedule(sc.id, { enabled: e.target.checked })}/>
                    <span className="zfs__switch-slider"/>
                  </label>
                  <button className="zfs__icon-btn zfs__icon-btn--danger" onClick={() => deleteSchedule(sc.id)}><Trash2 size={12}/></button>
                </div>
              ))}
              {schedules.length === 0 && <div className="zfs__empty">Sin programaciones configuradas</div>}
            </div>

            <button className="zfs__btn zfs__btn--primary" style={{ marginTop: 8 }}
              onClick={() => createSchedule({ poolId: pool.id, datasetPattern: `${pool.name}/**`, frequency: 'daily', keepCount: 14, enabled: true, nextRun: 'mañana 00:00' })}>
              <Plus size={13}/> Añadir programación
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main ZFSPanel component ─── */
type MainTab = 'pools' | 'datasets' | 'snapshots' | 'schedules';

export function ZFSPanel() {
  const { pools, datasets, snapshots, schedules } = useZFSStore();
  const [mainTab, setMainTab]         = useState<MainTab>('pools');
  const [selectedPool, setSelectedPool] = useState<ZFSPool | null>(null);
  const [selectedDs,   setSelectedDs]   = useState<ZFSDataset | null>(null);
  const [expandedDs,   setExpandedDs]   = useState<Set<string>>(new Set(['tank', 'rpool', 'backup']));
  const [showWizard,   setShowWizard]   = useState(false);
  const [snapSearch,   setSnapSearch]   = useState('');

  const toggleExpand = (name: string) =>
    setExpandedDs(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });

  // Build dataset tree for selected pool
  const poolDatasets = selectedPool
    ? datasets.filter(d => d.poolId === selectedPool.id)
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const visibleDatasets = (dss: ZFSDataset[]) => {
    const result: { ds: ZFSDataset; depth: number }[] = [];
    const recurse = (prefix: string, depth: number) => {
      dss.filter(d => {
        const rel = d.name.slice(prefix.length);
        return d.name.startsWith(prefix) && rel.split('/').filter(Boolean).length === 1;
      }).forEach(d => {
        result.push({ ds: d, depth });
        if (expandedDs.has(d.name)) recurse(d.name + '/', depth + 1);
      });
    };
    const root = dss.find(d => !d.name.includes('/'));
    if (root) { result.push({ ds: root, depth: 0 }); if (expandedDs.has(root.name)) recurse(root.name + '/', 1); }
    return result;
  };

  const filteredSnaps = snapshots.filter(sn =>
    !snapSearch || sn.fullName.toLowerCase().includes(snapSearch.toLowerCase())
  );

  const totalPools   = pools.length;
  const totalDs      = datasets.filter(d => d.type === 'filesystem').length;
  const totalSnaps   = snapshots.length;
  const totalScheds  = schedules.length;

  return (
    <div className="zfs">
      {/* Sidebar */}
      <div className="zfs__sidebar">
        <div className="zfs__sidebar-logo">
          <div className="zfs__sidebar-icon"><Database size={18}/></div>
          <div>
            <span className="zfs__sidebar-title">ZFS Panel</span>
            <span className="zfs__sidebar-sub">Administrador nativo</span>
          </div>
        </div>

        {[
          { id: 'pools',     label: 'Pools',     count: totalPools,  icon: <Database size={13}/> },
          { id: 'datasets',  label: 'Datasets',  count: totalDs,     icon: <Layers size={13}/> },
          { id: 'snapshots', label: 'Snapshots', count: totalSnaps,  icon: <Camera size={13}/> },
          { id: 'schedules', label: 'Schedules', count: totalScheds, icon: <Clock size={13}/> },
        ].map(t => (
          <button key={t.id} className={`zfs__nav-item ${mainTab === t.id ? 'zfs__nav-item--active' : ''}`}
            onClick={() => setMainTab(t.id as MainTab)}>
            {t.icon} {t.label}
            <span className="zfs__nav-count">{t.count}</span>
          </button>
        ))}

        {/* Pool list in sidebar */}
        <div className="zfs__sidebar-pools">
          <div className="zfs__sidebar-section">Pools</div>
          {pools.map(p => (
            <button key={p.id}
              className={`zfs__pool-nav ${selectedPool?.id === p.id ? 'zfs__pool-nav--active' : ''}`}
              onClick={() => { setSelectedPool(p); setMainTab('datasets'); setSelectedDs(null); }}>
              <PoolStatusIcon status={p.status}/>
              <span>{p.name}</span>
              {p.scrubStatus === 'scrubbing' && <RefreshCw size={10} className="zfs__spin" style={{ marginLeft: 'auto' }}/>}
            </button>
          ))}
          <button className="zfs__add-pool-btn" onClick={() => setShowWizard(true)}>
            <Plus size={12}/> Nuevo pool
          </button>
        </div>

        {/* Quick stats */}
        <div className="zfs__sidebar-stats">
          {pools.filter(p => p.status !== 'ONLINE').length > 0 && (
            <div className="zfs__stat-warn"><AlertTriangle size={11}/> {pools.filter(p => p.status !== 'ONLINE').length} pool degradado</div>
          )}
          <div className="zfs__stat-row"><span>Total snapshots</span><strong>{totalSnaps}</strong></div>
          <div className="zfs__stat-row"><span>Schedules activos</span><strong>{schedules.filter(s => s.enabled).length}</strong></div>
        </div>
      </div>

      {/* Main area */}
      <div className="zfs__main">
        {/* ── Pools overview ── */}
        {mainTab === 'pools' && (
          <div className="zfs__content">
            <div className="zfs__content-header">
              <h3>Pools ZFS</h3>
              <button className="zfs__btn zfs__btn--primary" onClick={() => setShowWizard(true)}>
                <Plus size={13}/> Crear pool
              </button>
            </div>
            <div className="zfs__pool-grid">
              {pools.map(p => (
                <PoolCard key={p.id} pool={p} selected={selectedPool?.id === p.id}
                  onClick={() => { setSelectedPool(p); setMainTab('datasets'); }}/>
              ))}
            </div>
          </div>
        )}

        {/* ── Datasets tree ── */}
        {mainTab === 'datasets' && (
          <div className="zfs__content">
            <div className="zfs__content-header">
              <div className="zfs__pool-selector">
                {pools.map(p => (
                  <button key={p.id}
                    className={`zfs__pool-tab ${selectedPool?.id === p.id ? 'zfs__pool-tab--active' : ''}`}
                    onClick={() => { setSelectedPool(p); setSelectedDs(null); }}>
                    <PoolStatusIcon status={p.status}/> {p.name}
                  </button>
                ))}
              </div>
              {selectedPool && (
                <button className="zfs__btn zfs__btn--primary" onClick={() => setSelectedDs({ poolId: selectedPool.id } as ZFSDataset)}>
                  <Plus size={13}/> Nuevo dataset
                </button>
              )}
            </div>

            {selectedPool ? (
              <div className="zfs__ds-tree">
                <div className="zfs__ds-tree-header">
                  <span style={{ paddingLeft: 32 }}>Nombre</span>
                  <span style={{ marginLeft: 'auto', paddingRight: 80, fontSize: 11, color: 'var(--text-muted)' }}>Compresión · Tamaño</span>
                </div>
                {visibleDatasets(poolDatasets).map(({ ds, depth }) => (
                  <DatasetRow key={ds.id} ds={ds} depth={depth}
                    expanded={expandedDs.has(ds.name)}
                    onToggle={() => toggleExpand(ds.name)}
                    selected={selectedDs?.id === ds.id}
                    onSelect={() => setSelectedDs(ds)}
                    onSnapshot={() => setSelectedDs(ds)}
                  />
                ))}
                {poolDatasets.length === 0 && <div className="zfs__empty">No hay datasets en este pool</div>}
              </div>
            ) : (
              <div className="zfs__empty">Selecciona un pool</div>
            )}
          </div>
        )}

        {/* ── Snapshots ── */}
        {mainTab === 'snapshots' && (
          <div className="zfs__content">
            <div className="zfs__content-header">
              <h3>Todos los snapshots</h3>
              <input className="zfs__search" placeholder="Buscar snapshots…" value={snapSearch}
                onChange={e => setSnapSearch(e.target.value)}/>
            </div>
            <div className="zfs__snap-table">
              <div className="zfs__snap-thead">
                <span>Snapshot</span><span>Dataset</span><span>Fecha</span><span>Tamaño</span><span>Tipo</span>
              </div>
              {filteredSnaps.map(sn => (
                <div key={sn.id} className="zfs__snap-tr">
                  <span className="zfs__snap-full">{sn.fullName}</span>
                  <span className="zfs__snap-ds">{sn.datasetName}</span>
                  <span className="zfs__snap-date">{sn.createdAt}</span>
                  <span className="zfs__snap-size">{sn.usedGB.toFixed(1)} GB</span>
                  <span>{sn.isAutomatic ? <span className="zfs__auto-badge">auto</span> : <span className="zfs__manual-badge">manual</span>}</span>
                </div>
              ))}
              {filteredSnaps.length === 0 && <div className="zfs__empty">Sin snapshots</div>}
            </div>
          </div>
        )}

        {/* ── Schedules ── */}
        {mainTab === 'schedules' && (
          <div className="zfs__content">
            <div className="zfs__content-header">
              <h3>Programación de snapshots automáticos</h3>
            </div>
            <div className="zfs__sched-table">
              {schedules.map(sc => {
                const pool = pools.find(p => p.id === sc.poolId);
                return (
                  <div key={sc.id} className="zfs__sched-card">
                    <div className="zfs__sched-card-header">
                      <Clock size={14} style={{ color: sc.enabled ? '#00b87c' : 'var(--text-muted)' }}/>
                      <span className="zfs__sched-pool">{pool?.name ?? sc.poolId}</span>
                      <span className="zfs__sched-pat">{sc.datasetPattern}</span>
                      <label className="zfs__switch" style={{ marginLeft: 'auto' }}>
                        <input type="checkbox" checked={sc.enabled}
                          onChange={e => useZFSStore.getState().updateSchedule(sc.id, { enabled: e.target.checked })}/>
                        <span className="zfs__switch-slider"/>
                      </label>
                    </div>
                    <div className="zfs__sched-card-body">
                      <span className={`zfs__freq-badge zfs__freq-badge--${sc.frequency}`}>{sc.frequency}</span>
                      <span>Retener: <strong>{sc.keepCount} snapshots</strong></span>
                      {sc.nextRun && <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 11 }}>Próximo: {sc.nextRun}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create pool wizard */}
      {showWizard && (
        <>
          <div className="zfs__overlay" onClick={() => setShowWizard(false)}/>
          <div className="zfs__wizard-wrap">
            <CreatePoolWizard onDone={() => setShowWizard(false)}/>
          </div>
        </>
      )}

      {/* Pool detail panel */}
      {selectedPool && mainTab === 'datasets' && !selectedDs && (
        <PoolDetail pool={selectedPool} onClose={() => setSelectedPool(null)}/>
      )}

      {/* Dataset detail panel */}
      {selectedDs && selectedDs.id && (
        <DatasetDetail ds={selectedDs} onClose={() => setSelectedDs(null)}/>
      )}
    </div>
  );
}
