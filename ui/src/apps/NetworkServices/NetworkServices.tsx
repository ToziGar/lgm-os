import { useState } from 'react';
import {
  Network, Server, HardDrive, Globe, Lock, RefreshCw,
  Power, Settings, Users, Plus, Trash2, Edit3, Copy, CheckCircle2,
  AlertCircle, Wifi, Shield,
} from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import './NetworkServices.css';

/* ───────────── Types ───────────── */
type Protocol = 'smb' | 'nfs' | 'ftp' | 'sftp' | 'webdav' | 'rsync';
type ServiceStatus = 'running' | 'stopped' | 'starting' | 'error';

interface Service {
  id: Protocol;
  name: string;
  port: number;
  desc: string;
  status: ServiceStatus;
  enabled: boolean;
  icon: React.ReactNode;
  color: string;
}

const INITIAL_SERVICES: Service[] = [
  { id: 'smb',    name: 'SMB / CIFS',   port: 445,  desc: 'Compartición Windows / macOS Finder', status: 'running',  enabled: true,  icon: <Server size={16}/>, color: '#0ea5e9' },
  { id: 'nfs',    name: 'NFS v4',        port: 2049, desc: 'Network File System para Linux',      status: 'stopped',  enabled: false, icon: <HardDrive size={16}/>, color: '#10b981' },
  { id: 'ftp',    name: 'FTP',           port: 21,   desc: 'File Transfer Protocol (inseguro)',    status: 'stopped',  enabled: false, icon: <Globe size={16}/>, color: '#f59e0b' },
  { id: 'sftp',   name: 'SFTP',          port: 22,   desc: 'SSH File Transfer Protocol',          status: 'running',  enabled: true,  icon: <Lock size={16}/>, color: '#6366f1' },
  { id: 'webdav', name: 'WebDAV',        port: 5005, desc: 'Acceso web a archivos (HTTPS)',        status: 'stopped',  enabled: false, icon: <Globe size={16}/>, color: '#ec4899' },
  { id: 'rsync',  name: 'Rsync',         port: 873,  desc: 'Sincronización eficiente de archivos', status: 'stopped',  enabled: false, icon: <RefreshCw size={16}/>, color: '#14b8a6' },
];

interface SharedFolder {
  id: string;
  name: string;
  path: string;
  protocols: Protocol[];
  permissions: { user: string; access: 'rw' | 'ro' | 'none' }[];
  encrypted: boolean;
  hidden: boolean;
}

const INITIAL_SHARES: SharedFolder[] = [
  { id: '1', name: 'Documentos', path: '/volume1/Documentos', protocols: ['smb','sftp'],   permissions: [{ user: 'admin', access: 'rw' }, { user: 'lgm', access: 'ro' }], encrypted: true,  hidden: false },
  { id: '2', name: 'Multimedia',  path: '/volume1/Multimedia',  protocols: ['smb','nfs'],   permissions: [{ user: 'admin', access: 'rw' }, { user: 'lgm', access: 'rw' }], encrypted: false, hidden: false },
  { id: '3', name: 'Backup',      path: '/volume2/Backup',      protocols: ['rsync','sftp'],permissions: [{ user: 'admin', access: 'rw' }],                                encrypted: true,  hidden: true  },
  { id: '4', name: 'Web',         path: '/volume1/web',         protocols: ['sftp'],        permissions: [{ user: 'admin', access: 'rw' }],                                encrypted: false, hidden: false },
];

type NavTab = 'services' | 'shares' | 'users' | 'advanced';

/* ───────────── StatusBadge ───────────── */
function StatusBadge({ status }: { status: ServiceStatus }) {
  const cfg = {
    running:  { label: 'Activo',    cls: 'ns__badge--running' },
    stopped:  { label: 'Detenido',  cls: 'ns__badge--stopped' },
    starting: { label: 'Iniciando', cls: 'ns__badge--starting' },
    error:    { label: 'Error',     cls: 'ns__badge--error' },
  }[status];
  return <span className={`ns__badge ${cfg.cls}`}>{cfg.label}</span>;
}

/* ───────────── Protocol tag ───────────── */
function ProtoTag({ proto }: { proto: Protocol }) {
  const colors: Record<Protocol, string> = {
    smb: '#0ea5e9', nfs: '#10b981', ftp: '#f59e0b',
    sftp: '#6366f1', webdav: '#ec4899', rsync: '#14b8a6',
  };
  return (
    <span className="ns__proto-tag" style={{ background: colors[proto] + '22', color: colors[proto], border: `1px solid ${colors[proto]}55` }}>
      {proto.toUpperCase()}
    </span>
  );
}

/* ───────────── Services tab ───────────── */
function ServicesTab() {
  const { addNotification } = useSystemStore();
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);

  const toggle = (id: Protocol) => {
    const svc = services.find(s => s.id === id)!;
    const wasRunning = svc.status === 'running';
    setServices(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'starting', enabled: !wasRunning } : s
    ));
    setTimeout(() => {
      setServices(prev => prev.map(s =>
        s.id === id ? { ...s, status: wasRunning ? 'stopped' : 'running', enabled: !wasRunning } : s
      ));
      addNotification(
        wasRunning ? `${svc.name} detenido` : `${svc.name} iniciado`,
        wasRunning ? `Puerto ${svc.port} cerrado` : `Escuchando en puerto ${svc.port}`,
        wasRunning ? 'warning' : 'success'
      );
    }, 1200);
  };

  const restartAll = () => {
    addNotification('Reiniciando servicios', 'Reiniciando todos los servicios de red activos…', 'info');
    services.filter(s => s.enabled).forEach(s => {
      setServices(prev => prev.map(x => x.id === s.id ? { ...x, status: 'starting' } : x));
      setTimeout(() => {
        setServices(prev => prev.map(x => x.id === s.id ? { ...x, status: 'running' } : x));
      }, 800 + Math.random() * 600);
    });
  };

  return (
    <div className="ns__section">
      <div className="ns__section-header">
        <h3>Servicios de Red</h3>
        <button className="ns__action-btn" onClick={restartAll}>
          <RefreshCw size={13}/> Reiniciar todos
        </button>
      </div>

      <div className="ns__services-grid">
        {services.map(svc => (
          <div key={svc.id} className={`ns__svc-card ${svc.enabled ? 'ns__svc-card--on' : ''}`}>
            <div className="ns__svc-top">
              <div className="ns__svc-icon" style={{ background: svc.color + '22', color: svc.color }}>
                {svc.icon}
              </div>
              <div className="ns__svc-info">
                <span className="ns__svc-name">{svc.name}</span>
                <span className="ns__svc-port">Puerto {svc.port}</span>
              </div>
              <label className="ns__switch">
                <input
                  type="checkbox"
                  checked={svc.enabled}
                  onChange={() => toggle(svc.id)}
                  disabled={svc.status === 'starting'}
                />
                <span className="ns__switch-slider"/>
              </label>
            </div>
            <p className="ns__svc-desc">{svc.desc}</p>
            <div className="ns__svc-foot">
              <StatusBadge status={svc.status}/>
              {svc.enabled && (
                <div className="ns__svc-indicator"/>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick access URLs */}
      <div className="ns__info-block">
        <div className="ns__info-title"><Wifi size={13}/> Acceso rápido desde la red local</div>
        <div className="ns__url-grid">
          <div className="ns__url-row"><span className="ns__url-label">SMB (Windows)</span><code className="ns__url-val">\\192.168.1.100\</code></div>
          <div className="ns__url-row"><span className="ns__url-label">SMB (macOS/Linux)</span><code className="ns__url-val">smb://lgm-nas-01.local/</code></div>
          <div className="ns__url-row"><span className="ns__url-label">SFTP</span><code className="ns__url-val">sftp://admin@192.168.1.100</code></div>
          <div className="ns__url-row"><span className="ns__url-label">WebDAV (HTTPS)</span><code className="ns__url-val">https://lgm-nas-01.local:5005/</code></div>
          <div className="ns__url-row"><span className="ns__url-label">NFS</span><code className="ns__url-val">mount -t nfs 192.168.1.100:/volume1 /mnt/nas</code></div>
          <div className="ns__url-row"><span className="ns__url-label">SSH</span><code className="ns__url-val">ssh admin@192.168.1.100</code></div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Shared Folders tab ───────────── */
function SharesTab() {
  const { addNotification } = useSystemStore();
  const [shares, setShares] = useState<SharedFolder[]>(INITIAL_SHARES);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPath, setNewPath] = useState('');

  const createShare = () => {
    if (!newName.trim()) return;
    const share: SharedFolder = {
      id: Date.now().toString(),
      name: newName.trim(),
      path: newPath.trim() || `/volume1/${newName.trim()}`,
      protocols: ['smb'],
      permissions: [{ user: 'admin', access: 'rw' }],
      encrypted: false,
      hidden: false,
    };
    setShares(prev => [...prev, share]);
    addNotification('Carpeta compartida', `"${share.name}" creada y compartida por SMB`, 'success');
    setShowNew(false); setNewName(''); setNewPath('');
  };

  const deleteShare = (id: string, name: string) => {
    setShares(prev => prev.filter(s => s.id !== id));
    addNotification('Carpeta eliminada', `"${name}" ya no está compartida`, 'warning');
  };

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path).catch(() => {});
    addNotification('Copiado', path, 'info');
  };

  return (
    <div className="ns__section">
      <div className="ns__section-header">
        <h3>Carpetas Compartidas</h3>
        <button className="ns__action-btn ns__action-btn--primary" onClick={() => setShowNew(true)}>
          <Plus size={13}/> Nueva carpeta
        </button>
      </div>

      {showNew && (
        <div className="ns__new-share-form">
          <input className="ns__input" placeholder="Nombre de carpeta" value={newName} onChange={e => setNewName(e.target.value)} autoFocus/>
          <input className="ns__input" placeholder="Ruta (opcional)" value={newPath} onChange={e => setNewPath(e.target.value)}/>
          <button className="ns__action-btn ns__action-btn--primary" onClick={createShare}>Crear</button>
          <button className="ns__action-btn" onClick={() => setShowNew(false)}>Cancelar</button>
        </div>
      )}

      <div className="ns__shares-table">
        <div className="ns__shares-header">
          <span>Nombre</span><span>Ruta</span><span>Protocolos</span><span>Cifrado</span><span>Acciones</span>
        </div>
        {shares.map(share => (
          <div key={share.id} className="ns__shares-row">
            <div className="ns__share-name">
              <HardDrive size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }}/>
              <span>{share.name}</span>
              {share.hidden && <span className="ns__share-hidden">oculta</span>}
            </div>
            <div className="ns__share-path" onClick={() => copyPath(share.path)} title="Copiar ruta">
              <code>{share.path}</code>
              <Copy size={11} className="ns__share-copy-icon"/>
            </div>
            <div className="ns__share-protos">
              {share.protocols.map(p => <ProtoTag key={p} proto={p}/>)}
            </div>
            <div>
              {share.encrypted
                ? <span className="ns__enc-badge ns__enc-badge--on"><Shield size={11}/> Cifrado</span>
                : <span className="ns__enc-badge ns__enc-badge--off">Sin cifrar</span>
              }
            </div>
            <div className="ns__share-actions">
              <button className="ns__icon-btn" title="Editar"><Edit3 size={13}/></button>
              <button className="ns__icon-btn ns__icon-btn--danger" title="Eliminar" onClick={() => deleteShare(share.id, share.name)}>
                <Trash2 size={13}/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Users & Permissions tab ───────────── */
function UsersTab() {
  const { addNotification } = useSystemStore();
  const [users] = useState([
    { name: 'admin', displayName: 'Administrador', smb: true,  ftp: true,  sftp: true,  quota: '—',    isAdmin: true  },
    { name: 'lgm',   displayName: 'LGM User',       smb: true,  ftp: false, sftp: true,  quota: '50 GB', isAdmin: false },
    { name: 'guest', displayName: 'Invitado',        smb: false, ftp: false, sftp: false, quota: '0',     isAdmin: false },
  ]);

  return (
    <div className="ns__section">
      <div className="ns__section-header">
        <h3>Usuarios y Permisos</h3>
        <button className="ns__action-btn ns__action-btn--primary"
          onClick={() => addNotification('Usuarios', 'Gestiona los usuarios en Panel de Control → Usuarios y grupos', 'info')}>
          <Plus size={13}/> Gestionar usuarios
        </button>
      </div>

      <div className="ns__users-table">
        <div className="ns__users-header">
          <span>Usuario</span><span>SMB</span><span>FTP</span><span>SFTP</span><span>Cuota</span><span>Rol</span>
        </div>
        {users.map(u => (
          <div key={u.name} className="ns__users-row">
            <div className="ns__user-info">
              <div className="ns__user-avatar">{u.displayName[0]}</div>
              <div>
                <span className="ns__user-name">{u.displayName}</span>
                <span className="ns__user-login">@{u.name}</span>
              </div>
            </div>
            {['smb','ftp','sftp'].map(proto => (
              <div key={proto} className="ns__perm-cell">
                {(u as any)[proto]
                  ? <CheckCircle2 size={15} style={{ color: 'var(--color-success)' }}/>
                  : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                }
              </div>
            ))}
            <span className="ns__quota">{u.quota}</span>
            <span className={`ns__role-badge ${u.isAdmin ? 'ns__role-badge--admin' : ''}`}>
              {u.isAdmin ? 'Admin' : 'Usuario'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Advanced tab ───────────── */
function AdvancedTab() {
  const { addNotification } = useSystemStore();
  const [smbConfig, setSmbConfig] = useState({
    workgroup: 'WORKGROUP',
    description: 'LGM OS NAS',
    minProto: 'SMB2',
    maxProto: 'SMB3',
    signing: true,
    encryption: false,
    guestAccess: false,
    recyclebin: true,
  });

  const save = () => addNotification('Configuración guardada', 'Parámetros SMB aplicados correctamente', 'success');

  return (
    <div className="ns__section">
      <div className="ns__section-header">
        <h3>Configuración Avanzada SMB</h3>
        <button className="ns__action-btn ns__action-btn--primary" onClick={save}><Settings size={13}/> Guardar</button>
      </div>

      <div className="ns__advanced-grid">
        <div className="ns__form-row">
          <label className="ns__label">Grupo de trabajo</label>
          <input className="ns__input" value={smbConfig.workgroup} onChange={e => setSmbConfig(p => ({...p, workgroup: e.target.value}))}/>
        </div>
        <div className="ns__form-row">
          <label className="ns__label">Descripción del servidor</label>
          <input className="ns__input" value={smbConfig.description} onChange={e => setSmbConfig(p => ({...p, description: e.target.value}))}/>
        </div>
        <div className="ns__form-row">
          <label className="ns__label">Protocolo mínimo</label>
          <select className="ns__input" value={smbConfig.minProto} onChange={e => setSmbConfig(p => ({...p, minProto: e.target.value}))}>
            <option>SMB1</option><option>SMB2</option><option>SMB2.1</option><option>SMB3</option>
          </select>
        </div>
        <div className="ns__form-row">
          <label className="ns__label">Protocolo máximo</label>
          <select className="ns__input" value={smbConfig.maxProto} onChange={e => setSmbConfig(p => ({...p, maxProto: e.target.value}))}>
            <option>SMB2</option><option>SMB2.1</option><option>SMB3</option><option>SMB3.1.1</option>
          </select>
        </div>
        {([
          ['signing',     'Firma de paquetes (Packet Signing)'],
          ['encryption',  'Cifrado SMB3'],
          ['guestAccess', 'Acceso de invitados'],
          ['recyclebin',  'Papelera de reciclaje'],
        ] as [keyof typeof smbConfig, string][]).map(([key, label]) => (
          <div key={key} className="ns__form-row ns__form-row--switch">
            <label className="ns__label">{label}</label>
            <label className="ns__switch">
              <input type="checkbox" checked={smbConfig[key] as boolean}
                onChange={e => setSmbConfig(p => ({...p, [key]: e.target.checked}))}/>
              <span className="ns__switch-slider"/>
            </label>
          </div>
        ))}
      </div>

      {/* mDNS/Bonjour */}
      <div className="ns__info-block" style={{ marginTop: 16 }}>
        <div className="ns__info-title"><Globe size={13}/> mDNS / Bonjour</div>
        <p className="ns__info-text">El servidor anuncia sus servicios en la red local automáticamente. Los usuarios de macOS verán <strong>LGM-NAS-01</strong> en el Finder bajo «Red».</p>
        <div className="ns__url-row" style={{ marginTop: 8 }}>
          <span className="ns__url-label">Hostname mDNS</span>
          <code className="ns__url-val">lgm-nas-01.local</code>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Main component ───────────── */
const TABS: { id: NavTab; label: string; icon: React.ReactNode }[] = [
  { id: 'services', label: 'Servicios',          icon: <Network size={14}/> },
  { id: 'shares',   label: 'Carpetas compartidas', icon: <HardDrive size={14}/> },
  { id: 'users',    label: 'Usuarios',            icon: <Users size={14}/> },
  { id: 'advanced', label: 'Avanzado',            icon: <Settings size={14}/> },
];

export function NetworkServices({ initialTab }: { initialTab?: NavTab } = {}) {
  const [tab, setTab] = useState<NavTab>(initialTab ?? 'services');

  return (
    <div className="ns">
      <div className="ns__sidebar">
        <div className="ns__sidebar-logo">
          <div className="ns__sidebar-logo-icon"><Network size={18}/></div>
          <span>Servicios de Red</span>
        </div>
        {TABS.map(t => (
          <button key={t.id} className={`ns__nav-item ${tab === t.id ? 'ns__nav-item--active' : ''}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div className="ns__main">
        {tab === 'services'  && <ServicesTab/>}
        {tab === 'shares'    && <SharesTab/>}
        {tab === 'users'     && <UsersTab/>}
        {tab === 'advanced'  && <AdvancedTab/>}
      </div>
    </div>
  );
}
