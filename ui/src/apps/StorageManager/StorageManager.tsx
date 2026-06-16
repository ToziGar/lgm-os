import { useState } from 'react';
import {
  HardDrive, Database, FolderOpen, Plus, Trash2, Edit3,
  RefreshCw, AlertTriangle, CheckCircle2, AlertCircle,
  Shield, Lock, Unlock, Info, Server,
} from 'lucide-react';
import { useStorageStore } from '../../store/storageStore';
import { useUserStore } from '../../store/userStore';
import { useSystemStore } from '../../store/systemStore';
import type { StorageVolume, PhysicalDisk, SharedFolder, Permission } from '../../types';
import './StorageManager.css';

/* ─── Status helpers ─── */
function DiskStatusIcon({ status }: { status: PhysicalDisk['status'] }) {
  if (status === 'healthy') return <CheckCircle2 size={14} style={{ color: '#00b87c' }}/>;
  if (status === 'warning') return <AlertTriangle size={14} style={{ color: '#f59e0b' }}/>;
  if (status === 'failing' || status === 'failed') return <AlertCircle size={14} style={{ color: '#ef4444' }}/>;
  return <Info size={14} style={{ color: 'var(--text-muted)' }}/>;
}

function VolumeStatusBadge({ status }: { status: StorageVolume['status'] }) {
  const cfg = {
    normal:     ['Normal',      '#00b87c'],
    degraded:   ['Degradado',   '#f59e0b'],
    rebuilding: ['Reconstruyendo','#3b82f6'],
    crashed:    ['Error',       '#ef4444'],
    readonly:   ['Solo lectura','#6b7280'],
  }[status];
  return <span className="sm__vol-badge" style={{ color: cfg[1], background: cfg[1] + '18' }}>{cfg[0]}</span>;
}

/* ─── Disk bay visual ─── */
function DiskBay({ disk }: { disk: PhysicalDisk }) {
  const empty = disk.sizeGB === 0;
  const pct   = empty ? 0 : Math.round((disk.usedGB / disk.sizeGB) * 100);

  const tempColor = disk.temp > 50 ? '#ef4444' : disk.temp > 45 ? '#f59e0b' : '#6b7280';

  return (
    <div className={`sm__bay ${!empty ? `sm__bay--${disk.status}` : 'sm__bay--empty'}`}>
      <div className="sm__bay-slot">Ranura {disk.slot}</div>
      <div className="sm__bay-icon">
        <HardDrive size={empty ? 20 : 24} style={{ color: empty ? 'var(--text-muted)' : 'var(--text-primary)', opacity: empty ? 0.3 : 1 }}/>
      </div>
      {!empty ? (
        <>
          <div className="sm__bay-model">{disk.model.split(' ').slice(0, 2).join(' ')}</div>
          <div className="sm__bay-size">{(disk.sizeGB / 1024).toFixed(1)} TB · {disk.type}</div>
          <div className="sm__bay-bar">
            <div className="sm__bay-fill" style={{ width: `${pct}%`, background: pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#3b82f6' }}/>
          </div>
          <div className="sm__bay-stats">
            <span style={{ color: tempColor }}>{disk.temp}°C</span>
            <span>{pct}%</span>
          </div>
          <div className="sm__bay-status"><DiskStatusIcon status={disk.status}/></div>
        </>
      ) : (
        <div className="sm__bay-empty-label">Vacío</div>
      )}
    </div>
  );
}

/* ─── Volume card ─── */
function VolumeCard({ volume, onClick }: { volume: StorageVolume; onClick: () => void }) {
  const { getVolumeDisks, getVolumeFolders } = useStorageStore();
  const disks   = getVolumeDisks(volume.id);
  const folders = getVolumeFolders(volume.id);
  const pct     = Math.round((volume.usedGB / volume.totalGB) * 100);

  return (
    <div className={`sm__vol-card sm__vol-card--${volume.status}`} onClick={onClick}>
      <div className="sm__vol-header">
        <div className="sm__vol-icon">
          <Database size={18} style={{ color: 'var(--color-primary)' }}/>
        </div>
        <div className="sm__vol-info">
          <span className="sm__vol-name">{volume.name}</span>
          <span className="sm__vol-mount">{volume.mountPoint}</span>
        </div>
        <VolumeStatusBadge status={volume.status}/>
      </div>

      {volume.status === 'rebuilding' && volume.rebuildProgress !== undefined && (
        <div className="sm__rebuild-bar">
          <div className="sm__rebuild-fill" style={{ width: `${volume.rebuildProgress}%` }}/>
          <span>Reconstruyendo… {volume.rebuildProgress}%</span>
        </div>
      )}

      <div className="sm__vol-usage">
        <div className="sm__vol-bar">
          <div className="sm__vol-fill" style={{
            width: `${pct}%`,
            background: pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#3b82f6',
          }}/>
        </div>
        <span>{volume.usedGB} / {volume.totalGB} GB ({pct}%)</span>
      </div>

      <div className="sm__vol-meta">
        <span className="sm__vol-raid">{volume.raidType}</span>
        <span className="sm__vol-fs">{volume.fsType}</span>
        {volume.encrypted && <span className="sm__vol-enc"><Lock size={11}/> Cifrado</span>}
        <span className="sm__vol-disks">{disks.length} disco{disks.length !== 1 ? 's' : ''}</span>
        <span className="sm__vol-folders">{folders.length} carpeta{folders.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

/* ─── Shared folder row ─── */
function FolderRow({ folder, onEdit, onDelete }: {
  folder: SharedFolder;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { groups } = useUserStore();

  return (
    <div className="sm__folder-row">
      <div className="sm__folder-name">
        <FolderOpen size={14} style={{ color: '#f59e0b', flexShrink: 0 }}/>
        <span>{folder.name}</span>
        {folder.hidden && <span className="sm__folder-hidden">oculta</span>}
        {folder.encrypted && <Lock size={11} style={{ color: 'var(--color-primary)' }}/>}
      </div>
      <code className="sm__folder-path">{folder.path}</code>
      <div className="sm__folder-protos">
        {folder.protocols.map(p => (
          <span key={p} className={`sm__proto-tag sm__proto-tag--${p}`}>{p.toUpperCase()}</span>
        ))}
      </div>
      <div className="sm__folder-perms">
        {folder.permissions.slice(0, 3).map((p, i) => {
          const grp = groups.find(g => g.id === p.groupId);
          const label = grp?.name ?? p.userId ?? '?';
          return (
            <span key={i} className={`sm__perm-chip sm__perm-chip--${p.access}`}>
              {label}: {p.access}
            </span>
          );
        })}
      </div>
      <div className="sm__folder-quota">
        {folder.quotaGB ? `${folder.usedGB ?? 0}/${folder.quotaGB} GB` : '—'}
      </div>
      <div className="sm__folder-actions">
        <button className="sm__icon-btn" onClick={onEdit}><Edit3 size={12}/></button>
        <button className="sm__icon-btn sm__icon-btn--danger" onClick={onDelete}><Trash2 size={12}/></button>
      </div>
    </div>
  );
}

/* ─── New folder form ─── */
function NewFolderForm({ volumeId, onDone }: { volumeId: string; onDone: () => void }) {
  const { addFolder } = useStorageStore();
  const { addNotification } = useSystemStore();
  const [name, setName]   = useState('');
  const [desc, setDesc]   = useState('');
  const [proto, setProto] = useState<SharedFolder['protocols']>(['smb']);
  const [enc, setEnc]     = useState(false);
  const [error, setError] = useState('');

  const toggleProto = (p: SharedFolder['protocols'][number]) => {
    setProto(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const submit = () => {
    if (!name.trim()) { setError('El nombre es requerido'); return; }
    const res = addFolder({
      name, description: desc, volumeId,
      path: '', protocols: proto, encrypted: enc, hidden: false,
      permissions: [
        { groupId: 'g-administrators', access: 'admin' },
        { groupId: 'g-users', access: 'write' },
      ],
    });
    if (!res.ok) { setError(res.error!); return; }
    addNotification('Carpeta creada', `"${name}" en volumen`, 'success');
    onDone();
  };

  return (
    <div className="sm__new-folder">
      <h4>Nueva carpeta compartida</h4>
      {error && <div className="sm__error">{error}</div>}
      <input className="sm__input" placeholder="Nombre de carpeta *" value={name} onChange={e => setName(e.target.value)} autoFocus/>
      <input className="sm__input" placeholder="Descripción" value={desc} onChange={e => setDesc(e.target.value)}/>
      <div className="sm__proto-toggles">
        {(['smb','nfs','ftp','sftp','webdav','rsync'] as SharedFolder['protocols']).map(p => (
          <button key={p} className={`sm__proto-toggle ${proto.includes(p) ? 'sm__proto-toggle--on' : ''}`}
            onClick={() => toggleProto(p)}>
            {p.toUpperCase()}
          </button>
        ))}
      </div>
      <label className="sm__check-row">
        <input type="checkbox" checked={enc} onChange={e => setEnc(e.target.checked)}/>
        <span>Cifrar carpeta</span>
      </label>
      <div className="sm__new-actions">
        <button className="sm__btn sm__btn--primary" onClick={submit}><Plus size={13}/> Crear</button>
        <button className="sm__btn" onClick={onDone}>Cancelar</button>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
type Tab = 'overview' | 'volumes' | 'folders' | 'health';

export function StorageManager() {
  const { disks, volumes, folders, deleteFolder, deleteVolume } = useStorageStore();
  const { addNotification } = useSystemStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [selVolume, setSelVolume] = useState<StorageVolume | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);

  const totalGB = volumes.reduce((s, v) => s + v.totalGB, 0);
  const usedGB  = volumes.reduce((s, v) => s + v.usedGB,  0);
  const freePct = Math.round(((totalGB - usedGB) / totalGB) * 100);

  const handleDeleteFolder = (f: SharedFolder) => {
    deleteFolder(f.id);
    addNotification('Carpeta eliminada', f.name, 'warning');
  };

  const handleDeleteVolume = (v: StorageVolume) => {
    const res = deleteVolume(v.id);
    if (!res.ok) addNotification('Error', res.error!, 'error');
    else { addNotification('Volumen eliminado', v.name, 'warning'); setSelVolume(null); }
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Resumen' },
    { id: 'volumes',  label: `Volúmenes (${volumes.length})` },
    { id: 'folders',  label: `Carpetas (${folders.length})` },
    { id: 'health',   label: 'Discos' },
  ];

  return (
    <div className="sm">
      {/* Sidebar */}
      <div className="sm__sidebar">
        <div className="sm__sidebar-logo">
          <div className="sm__sidebar-logo-icon"><Server size={18}/></div>
          <span>Almacenamiento</span>
        </div>
        {TABS.map(t => (
          <button key={t.id} className={`sm__nav-item ${tab === t.id ? 'sm__nav-item--active' : ''}`}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}

        {/* Storage summary */}
        <div className="sm__sidebar-summary">
          <div className="sm__summary-bar">
            <div className="sm__summary-fill" style={{ width: `${100 - freePct}%` }}/>
          </div>
          <div className="sm__summary-stats">
            <span>{usedGB} GB usados</span>
            <span>{totalGB - usedGB} GB libres</span>
          </div>
          <div className="sm__summary-total">{(totalGB / 1024).toFixed(1)} TB total</div>
        </div>

        {/* Disk health */}
        <div className="sm__health-mini">
          {disks.filter(d => d.sizeGB > 0).map(d => (
            <div key={d.id} title={`Ranura ${d.slot}: ${d.model}`}
              className={`sm__health-dot sm__health-dot--${d.status}`}/>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="sm__main">

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div className="sm__section">
            <div className="sm__kpis">
              <div className="sm__kpi">
                <Database size={20} style={{ color: '#3b82f6' }}/>
                <div><span className="sm__kpi-val">{volumes.length}</span><span className="sm__kpi-label">Volúmenes</span></div>
              </div>
              <div className="sm__kpi">
                <HardDrive size={20} style={{ color: '#10b981' }}/>
                <div><span className="sm__kpi-val">{disks.filter(d => d.sizeGB > 0).length}</span><span className="sm__kpi-label">Discos instalados</span></div>
              </div>
              <div className="sm__kpi">
                <FolderOpen size={20} style={{ color: '#f59e0b' }}/>
                <div><span className="sm__kpi-val">{folders.length}</span><span className="sm__kpi-label">Carpetas compartidas</span></div>
              </div>
              <div className="sm__kpi">
                <Shield size={20} style={{ color: '#8b5cf6' }}/>
                <div><span className="sm__kpi-val">{folders.filter(f => f.encrypted).length}</span><span className="sm__kpi-label">Carpetas cifradas</span></div>
              </div>
            </div>

            <div className="sm__overview-grid">
              {volumes.map(v => <VolumeCard key={v.id} volume={v} onClick={() => { setSelVolume(v); setTab('volumes'); }}/>)}
            </div>

            {/* Alerts */}
            {disks.some(d => d.status === 'warning' || d.status === 'failing') && (
              <div className="sm__alert">
                <AlertTriangle size={16}/>
                <span>
                  <strong>Atención:</strong> {disks.filter(d => d.status !== 'healthy' && d.sizeGB > 0).length} disco(s) necesitan revisión.{' '}
                  <button className="sm__alert-link" onClick={() => setTab('health')}>Ver detalles →</button>
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Volumes ── */}
        {tab === 'volumes' && (
          <div className="sm__section">
            <div className="sm__section-header">
              <h3>Volúmenes de almacenamiento</h3>
            </div>
            {volumes.map(v => (
              <div key={v.id} className={`sm__vol-detail-card ${selVolume?.id === v.id ? 'sm__vol-detail-card--selected' : ''}`}>
                <div className="sm__vol-detail-header" onClick={() => setSelVolume(selVolume?.id === v.id ? null : v)}>
                  <Database size={16} style={{ color: 'var(--color-primary)' }}/>
                  <span className="sm__vol-detail-name">{v.name}</span>
                  <code className="sm__vol-detail-mount">{v.mountPoint}</code>
                  <VolumeStatusBadge status={v.status}/>
                  <span className="sm__vol-detail-raid">{v.raidType} · {v.fsType}</span>
                  {v.encrypted && <Lock size={12} style={{ color: 'var(--color-primary)' }}/>}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                    {v.mountPoint !== '/system' && (
                      <button className="sm__icon-btn sm__icon-btn--danger"
                        onClick={e => { e.stopPropagation(); handleDeleteVolume(v); }}>
                        <Trash2 size={12}/>
                      </button>
                    )}
                  </div>
                </div>

                {selVolume?.id === v.id && (
                  <div className="sm__vol-expanded">
                    <div className="sm__vol-expanded-bar">
                      <div className="sm__vol-expanded-fill" style={{
                        width: `${Math.round((v.usedGB / v.totalGB) * 100)}%`,
                        background: '#3b82f6',
                      }}/>
                    </div>
                    <div className="sm__vol-expanded-stats">
                      <span>Usado: <strong>{v.usedGB} GB</strong></span>
                      <span>Libre: <strong>{v.totalGB - v.usedGB} GB</strong></span>
                      <span>Total: <strong>{v.totalGB} GB</strong></span>
                      <span>Creado: <strong>{v.createdAt}</strong></span>
                    </div>
                    {v.description && <p className="sm__vol-expanded-desc">{v.description}</p>}
                    <div className="sm__vol-disks-list">
                      {useStorageStore.getState().getVolumeDisks(v.id).map(d => (
                        <div key={d.id} className="sm__vol-disk-chip">
                          <HardDrive size={11}/>
                          <span>Ranura {d.slot}</span>
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{(d.sizeGB / 1024).toFixed(1)}TB</span>
                          <DiskStatusIcon status={d.status}/>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Shared Folders ── */}
        {tab === 'folders' && (
          <div className="sm__section">
            <div className="sm__section-header">
              <h3>Carpetas compartidas</h3>
              <button className="sm__btn sm__btn--primary" onClick={() => setShowNewFolder(v => !v)}>
                <Plus size={13}/> Nueva carpeta
              </button>
            </div>

            {showNewFolder && (
              <NewFolderForm
                volumeId={volumes[0]?.id ?? ''}
                onDone={() => setShowNewFolder(false)}
              />
            )}

            <div className="sm__folders-table">
              <div className="sm__folders-header">
                <span>Nombre</span>
                <span>Ruta</span>
                <span>Protocolos</span>
                <span>Permisos</span>
                <span>Cuota</span>
                <span></span>
              </div>
              {folders.map(f => (
                <FolderRow
                  key={f.id}
                  folder={f}
                  onEdit={() => {}}
                  onDelete={() => handleDeleteFolder(f)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Disk Health ── */}
        {tab === 'health' && (
          <div className="sm__section">
            <div className="sm__section-header">
              <h3>Estado de los discos</h3>
              <button className="sm__btn" onClick={() => addNotification('SMART', 'Escaneando discos…', 'info')}>
                <RefreshCw size={13}/> Escanear SMART
              </button>
            </div>

            {/* Disk bays grid */}
            <div className="sm__bays-grid">
              {disks.map(d => <DiskBay key={d.id} disk={d}/>)}
            </div>

            {/* SMART table */}
            <div className="sm__smart-table">
              <div className="sm__smart-header">
                <span>Disco</span><span>Modelo</span><span>Tipo</span>
                <span>Temp.</span><span>Horas</span><span>Salud</span>
                <span>Realloc.</span><span>Pendientes</span><span>Estado</span>
              </div>
              {disks.filter(d => d.sizeGB > 0).map(d => (
                <div key={d.id} className={`sm__smart-row sm__smart-row--${d.status}`}>
                  <span>Ranura {d.slot}</span>
                  <span className="sm__smart-model">{d.model}</span>
                  <span>{d.type}</span>
                  <span style={{ color: d.temp > 50 ? '#ef4444' : d.temp > 45 ? '#f59e0b' : 'inherit' }}>
                    {d.temp}°C
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{d.smart.powerOnHours.toLocaleString()}h</span>
                  <div className="sm__smart-health">
                    <div className="sm__smart-health-bar">
                      <div className="sm__smart-health-fill" style={{
                        width: `${d.smart.health}%`,
                        background: d.smart.health < 60 ? '#ef4444' : d.smart.health < 80 ? '#f59e0b' : '#00b87c',
                      }}/>
                    </div>
                    <span>{d.smart.health}%</span>
                  </div>
                  <span style={{ color: d.smart.reallocatedSectors > 0 ? '#ef4444' : 'inherit', fontWeight: d.smart.reallocatedSectors > 0 ? 700 : 400 }}>
                    {d.smart.reallocatedSectors}
                  </span>
                  <span style={{ color: d.smart.pendingSectors > 0 ? '#f59e0b' : 'inherit', fontWeight: d.smart.pendingSectors > 0 ? 700 : 400 }}>
                    {d.smart.pendingSectors}
                  </span>
                  <DiskStatusIcon status={d.status}/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
