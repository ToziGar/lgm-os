import { useState, useEffect } from 'react';
import {
  Info, Network, HardDrive, Database, Users, Shield,
  Bell, Palette, Server, Terminal, Key, Activity,
  FileText, Lock, Globe, ChevronRight,
} from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import { useStorageStore } from '../../store/storageStore';
import { NetworkServices } from '../NetworkServices/NetworkServices';
import { SSHManager }      from '../SSHManager/SSHManager';
import { VPNManager }      from '../VPNManager/VPNManager';
import { UserManager }     from '../UserManager/UserManager';
import { StorageManager }  from '../StorageManager/StorageManager';
import { ZFSPanel }        from '../ZFSPanel/ZFSPanel';
import { LogCenter }       from '../LogCenter/LogCenter';
import { TaskManager }     from '../TaskManager/TaskManager';
import './ControlPanel.css';

/* ─── Nav structure ─── */
type Section =
  | 'info' | 'network' | 'shared-folders' | 'storage' | 'zfs'
  | 'users' | 'ssh' | 'vpn' | 'logs' | 'tasks'
  | 'security' | 'notifications' | 'appearance';

interface NavGroup { label: string; items: { id: Section; label: string; icon: React.ReactNode }[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Sistema',
    items: [
      { id: 'info',   label: 'Información',     icon: <Info size={14}/> },
      { id: 'tasks',  label: 'Procesos',         icon: <Activity size={14}/> },
      { id: 'logs',   label: 'Registros',        icon: <FileText size={14}/> },
    ],
  },
  {
    label: 'Red y acceso',
    items: [
      { id: 'network',         label: 'Servicios de red',   icon: <Network size={14}/> },
      { id: 'shared-folders',  label: 'Carpetas compartidas', icon: <Globe size={14}/> },
      { id: 'ssh',             label: 'SSH',                icon: <Terminal size={14}/> },
      { id: 'vpn',             label: 'VPN',                icon: <Lock size={14}/> },
    ],
  },
  {
    label: 'Almacenamiento',
    items: [
      { id: 'storage', label: 'Volúmenes y discos', icon: <HardDrive size={14}/> },
      { id: 'zfs',     label: 'ZFS Pool',           icon: <Database size={14}/> },
    ],
  },
  {
    label: 'Usuarios',
    items: [
      { id: 'users', label: 'Usuarios y grupos', icon: <Users size={14}/> },
    ],
  },
  {
    label: 'Configuración',
    items: [
      { id: 'security',      label: 'Seguridad',       icon: <Shield size={14}/> },
      { id: 'notifications', label: 'Notificaciones',  icon: <Bell size={14}/> },
      { id: 'appearance',    label: 'Apariencia',      icon: <Palette size={14}/> },
    ],
  },
];

/* ─── System info section ─── */
function SysInfo() {
  const { volumes, getDiskHealthSummary } = useStorageStore();
  const { user } = useSystemStore();
  const health = getDiskHealthSummary();
  const total  = volumes.reduce((s, v) => s + v.totalGB, 0);
  const used   = volumes.reduce((s, v) => s + v.usedGB,  0);

  // Live uptime since page load
  const [uptime, setUptime] = useState(0);
  useEffect(() => {
    // Simulate server was on for 3d7h + time since page loaded
    const BASE_SECS = 3 * 86400 + 7 * 3600 + 12 * 60;
    setUptime(BASE_SECS);
    const t = setInterval(() => setUptime(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmtUptime = (s: number) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${d}d ${h}h ${m}m ${ss}s`;
  };

  const rows = [
    ['Sistema',           'LGM OS 1.0 (Debian GNU/Linux 12)'],
    ['Kernel',            'Linux 6.1.0-lgm-amd64 #1 SMP x86_64'],
    ['Arquitectura',      'x86_64 (64-bit)'],
    ['CPU',               'Intel Core i7-12700 @ 2.10GHz × 8 cores'],
    ['RAM total',         '16 GB DDR4-3200'],
    ['RAM en uso',        '6.2 GB / 16 GB (39%)'],
    ['Disco del sistema', 'Samsung 870 EVO 1TB (NVMe)'],
    ['IP local',          '192.168.1.100'],
    ['Hostname',          'lgm-nas-01.local'],
    ['Usuario actual',    user?.displayName ?? 'admin'],
    ['Tiempo encendido',  fmtUptime(uptime)],
    ['Versión UI',        '1.0.0 (Vite 8 + React 18)'],
  ];

  return (
    <div className="cp__section">
      <h3 className="cp__section-title">Información del sistema</h3>

      <div className="cp__info-health">
        <div className="cp__info-health-item">
          <span>Discos físicos</span>
          <div className="cp__info-health-dots">
            {health.healthy > 0 && <span className="cp__info-hdot cp__info-hdot--ok">{health.healthy} OK</span>}
            {health.warning > 0 && <span className="cp__info-hdot cp__info-hdot--warn">{health.warning} aviso</span>}
            {health.failing > 0 && <span className="cp__info-hdot cp__info-hdot--err">{health.failing} fallo</span>}
          </div>
        </div>
        <div className="cp__info-health-item">
          <span>Almacenamiento total</span>
          <strong>{used} / {total} GB ({Math.round((used / total) * 100)}%)</strong>
        </div>
        <div className="cp__info-health-item">
          <span>Volúmenes activos</span>
          <strong>{volumes.filter(v => v.status === 'normal').length} / {volumes.length}</strong>
        </div>
      </div>

      <div className="cp__info-grid">
        {rows.map(([k, v]) => (
          <div key={k} className="cp__info-row">
            <span className="cp__info-key">{k}</span>
            <span className="cp__info-val">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Security section ─── */
function SecuritySection() {
  const { addNotification } = useSystemStore();
  const [settings, setSettings] = useState({
    firewall: true,
    autoUpdates: true,
    ssh: false,
    twoFactor: false,
    readonly: false,
    inactivity: 'Nunca',
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings(p => ({ ...p, [key]: !p[key as keyof typeof settings] }));

  return (
    <div className="cp__section">
      <h3 className="cp__section-title">Seguridad</h3>
      <div className="cp__form">
        {([
          ['firewall',    'Firewall activo'],
          ['autoUpdates', 'Actualizaciones automáticas'],
          ['ssh',         'Acceso SSH habilitado'],
          ['twoFactor',   '2FA para administradores'],
          ['readonly',    'Modo de solo lectura'],
        ] as [keyof typeof settings, string][]).map(([key, label]) => (
          <div key={key} className="cp__form-row">
            <label className="cp__label">{label}</label>
            <label className="cp__switch">
              <input type="checkbox" checked={settings[key] as boolean}
                onChange={() => toggle(key)}/>
              <span className="cp__switch-slider"/>
            </label>
          </div>
        ))}
        <div className="cp__form-row">
          <label className="cp__label">Bloqueo tras inactividad</label>
          <select className="cp__input" value={settings.inactivity}
            onChange={e => setSettings(p => ({ ...p, inactivity: e.target.value }))}>
            <option>Nunca</option><option>5 min</option>
            <option>15 min</option><option>30 min</option><option>1 hora</option>
          </select>
        </div>
        <button className="cp__save-btn"
          onClick={() => addNotification('Seguridad', 'Configuración de seguridad guardada', 'success')}>
          Guardar
        </button>
      </div>
    </div>
  );
}

/* ─── Notifications section ─── */
function NotifSection() {
  const { addNotification } = useSystemStore();
  const [settings, setSettings] = useState({
    system:    true,
    email:     true,
    diskFull:  true,
    raidFault: true,
  });

  const LABELS: Record<keyof typeof settings, string> = {
    system:    'Notificaciones del sistema',
    email:     'Email al administrador',
    diskFull:  'Alerta de disco lleno',
    raidFault: 'Alerta de fallo RAID',
  };

  return (
    <div className="cp__section">
      <h3 className="cp__section-title">Notificaciones</h3>
      <div className="cp__form">
        {(Object.keys(settings) as (keyof typeof settings)[]).map(key => (
          <div key={key} className="cp__form-row">
            <label className="cp__label">{LABELS[key]}</label>
            <label className="cp__switch">
              <input type="checkbox" checked={settings[key]}
                onChange={() => setSettings(p => ({ ...p, [key]: !p[key] }))}/>
              <span className="cp__switch-slider"/>
            </label>
          </div>
        ))}
      </div>
      <button className="cp__save-btn" style={{ marginTop: 16 }}
        onClick={() => addNotification('Prueba', 'Notificación de prueba enviada', 'info')}>
        Enviar notificación de prueba
      </button>
    </div>
  );
}

/* ─── Appearance section ─── */
function AppearanceSection() {
  const { theme, toggleTheme } = useSystemStore();
  return (
    <div className="cp__section">
      <h3 className="cp__section-title">Apariencia</h3>
      <div className="cp__form">
        <div className="cp__form-row">
          <label className="cp__label">Tema del sistema</label>
          <div className="cp__toggle-group">
            <button className={`cp__toggle ${theme === 'light' ? 'cp__toggle--on' : ''}`} onClick={() => theme !== 'light' && toggleTheme()}>☀️ Claro</button>
            <button className={`cp__toggle ${theme === 'dark'  ? 'cp__toggle--on' : ''}`} onClick={() => theme !== 'dark'  && toggleTheme()}>🌙 Oscuro</button>
          </div>
        </div>
        <div className="cp__form-row">
          <label className="cp__label">Idioma</label>
          <select className="cp__input">
            <option>Español (ES)</option>
            <option>English (US)</option>
            <option>Português (BR)</option>
          </select>
        </div>
        <div className="cp__form-row">
          <label className="cp__label">Fuente de interfaz</label>
          <select className="cp__input">
            <option>SF Pro / System UI</option>
            <option>Inter</option>
            <option>Roboto</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/* ─── Embedded full-app wrapper ─── */
function EmbeddedApp({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '100%',
    }}>
      {children}
    </div>
  );
}

/* ─── Section renderer ─── */
function renderSection(section: Section): React.ReactNode {
  switch (section) {
    case 'info':            return <SysInfo/>;
    case 'network':         return <EmbeddedApp><NetworkServices/></EmbeddedApp>;
    case 'shared-folders':  return <EmbeddedApp><NetworkServices initialTab="shares"/></EmbeddedApp>;
    case 'storage':         return <EmbeddedApp><StorageManager/></EmbeddedApp>;
    case 'zfs':             return <EmbeddedApp><ZFSPanel/></EmbeddedApp>;
    case 'users':           return <EmbeddedApp><UserManager/></EmbeddedApp>;
    case 'ssh':             return <EmbeddedApp><SSHManager/></EmbeddedApp>;
    case 'vpn':             return <EmbeddedApp><VPNManager/></EmbeddedApp>;
    case 'logs':            return <EmbeddedApp><LogCenter/></EmbeddedApp>;
    case 'tasks':           return <EmbeddedApp><TaskManager/></EmbeddedApp>;
    case 'security':        return <SecuritySection/>;
    case 'notifications':   return <NotifSection/>;
    case 'appearance':      return <AppearanceSection/>;
  }
}

/* ─── Main ─── */
export function ControlPanel() {
  const [active, setActive] = useState<Section>('info');
  const isFullApp = !['info','security','notifications','appearance'].includes(active);

  return (
    <div className="cp">
      {/* Left sidebar */}
      <aside className="cp__nav cp__nav--wide">
        <div className="cp__nav-header">
          <Server size={13}/> Panel de Control
        </div>
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="cp__nav-group">
            <div className="cp__nav-group-label">{group.label}</div>
            {group.items.map(item => (
              <button
                key={item.id}
                className={`cp__nav-item ${active === item.id ? 'cp__nav-item--active' : ''}`}
                onClick={() => setActive(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
                {['network','storage','zfs','users','ssh','vpn','logs','tasks','shared-folders'].includes(item.id) && (
                  <ChevronRight size={11} style={{ marginLeft: 'auto', opacity: 0.4 }}/>
                )}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Content — full height for embedded apps */}
      <div className={`cp__content ${isFullApp ? 'cp__content--full' : ''}`}>
        {renderSection(active)}
      </div>
    </div>
  );
}
