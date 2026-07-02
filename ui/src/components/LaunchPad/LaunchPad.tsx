import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import { useWindowStore } from '../../store/windowStore';
import { AppIconSVG } from '../AppIcon/AppIcon';
import './LaunchPad.css';

/* All available apps — desktop + system tools */
const ALL_APPS = [
  /* ─ Productivity ─ */
  { id: 'file-station',   name: 'File Station',           icon: '📁', description: 'Administrador de archivos', color: '#f59e0b',  group: 'Productividad', defaultWidth: 920,  defaultHeight: 620,  minWidth: 640,  minHeight: 420 },
  { id: 'text-editor',    name: 'Editor de Texto',        icon: '📝', description: 'Editor con múltiples pestañas', color: '#3b82f6', group: 'Productividad', defaultWidth: 760,  defaultHeight: 560,  minWidth: 420,  minHeight: 320 },
  { id: 'calculator',     name: 'Calculadora',            icon: '🧮', description: 'Calculadora científica',  color: '#8b5cf6',  group: 'Productividad', defaultWidth: 300,  defaultHeight: 460,  minWidth: 260,  minHeight: 400 },
  { id: 'terminal',       name: 'Terminal',               icon: '💻', description: 'Consola del sistema',    color: '#1e293b',  group: 'Productividad', defaultWidth: 720,  defaultHeight: 460,  minWidth: 400,  minHeight: 300 },
  /* ─ System ─ */
  { id: 'control-panel',  name: 'Panel de Control',       icon: '⚙️', description: 'Configuración del sistema', color: '#6366f1', group: 'Sistema',       defaultWidth: 980,  defaultHeight: 660,  minWidth: 760,  minHeight: 520 },
  { id: 'system-info',    name: 'Monitor del Sistema',    icon: '📊', description: 'CPU, RAM, red y disco',  color: '#ef4444',  group: 'Sistema',       defaultWidth: 700,  defaultHeight: 540,  minWidth: 540,  minHeight: 400 },
  { id: 'task-manager',   name: 'Administrador de Tareas',icon: '📊', description: 'Procesos y rendimiento',  color: '#0f172a',  group: 'Sistema',       defaultWidth: 860,  defaultHeight: 580,  minWidth: 640,  minHeight: 440 },
  { id: 'log-center',     name: 'Centro de Registros',    icon: '📃', description: 'Logs del sistema',       color: '#1e40af',  group: 'Sistema',       defaultWidth: 900,  defaultHeight: 580,  minWidth: 640,  minHeight: 420 },
  { id: 'package-center', name: 'Centro de Paquetes',     icon: '📦', description: 'Instalar aplicaciones',  color: '#10b981',  group: 'Sistema',       defaultWidth: 880,  defaultHeight: 620,  minWidth: 640,  minHeight: 420 },
  /* ─ Network ─ */
  { id: 'network-services',name: 'Servicios de Red',      icon: '🌐', description: 'SMB, NFS, FTP, SFTP…',   color: '#0ea5e9',  group: 'Red',           defaultWidth: 960,  defaultHeight: 640,  minWidth: 700,  minHeight: 480 },
  { id: 'ssh-manager',    name: 'SSH Manager',            icon: '🖥️', description: 'Conexiones SSH + terminal', color: '#374151', group: 'Red',           defaultWidth: 920,  defaultHeight: 600,  minWidth: 680,  minHeight: 440 },
  { id: 'vpn-manager',    name: 'VPN Manager',            icon: '🔐', description: 'WireGuard, OpenVPN…',    color: '#065f46',  group: 'Red',           defaultWidth: 860,  defaultHeight: 580,  minWidth: 640,  minHeight: 440 },
  /* ─ Storage ─ */
  { id: 'storage-manager',name: 'Almacenamiento',         icon: '💿', description: 'Volúmenes, RAID, carpetas',  color: '#1d4ed8',  group: 'Almacenamiento', defaultWidth: 1040, defaultHeight: 660,  minWidth: 780,  minHeight: 500 },
  { id: 'zfs-panel',      name: 'ZFS Panel',              icon: '💾', description: 'Pools ZFS y snapshots',  color: '#0f172a',  group: 'Almacenamiento', defaultWidth: 1100, defaultHeight: 700,  minWidth: 840,  minHeight: 540 },
  /* ─ Users ─ */
  { id: 'user-manager',   name: 'Usuarios y Grupos',      icon: '👥', description: 'Usuarios, grupos, permisos', color: '#4f46e5', group: 'Usuarios',     defaultWidth: 1020, defaultHeight: 640,  minWidth: 760,  minHeight: 480 },
  /* ─ Nuevas Apps v1.1 ─ */
  { id: 'photo-station',  name: 'Photo Station',          icon: '🖼️', description: 'Galería de fotos con álbumes', color: '#ec4899', group: 'Multimedia',   defaultWidth: 960,  defaultHeight: 680,  minWidth: 720,  minHeight: 500 },
  { id: 'note-station',   name: 'Note Station',           icon: '📝', description: 'Bloc de notas con libretas',  color: '#8b5cf6', group: 'Productividad', defaultWidth: 920,  defaultHeight: 640,  minWidth: 700,  minHeight: 480 },
  { id: 'music-player',   name: 'Música',                  icon: '🎵', description: 'Reproductor de música',     color: '#10b981', group: 'Multimedia',   defaultWidth: 860,  defaultHeight: 600,  minWidth: 640,  minHeight: 440 },
];

const SVG_APPS = new Set(['file-station','control-panel','package-center','terminal','text-editor',
  'system-info','calculator','network-services','ssh-manager','shared-folders','vpn',
  'vpn-manager','task-manager','log-center','user-manager','storage-manager','zfs-panel',
  'photo-station','note-station','music-player']);

export function LaunchPad() {
  const { showLaunchPad, closeLaunchPad } = useSystemStore();
  const { openWindow } = useWindowStore();
  const [search, setSearch] = useState('');

  if (!showLaunchPad) return null;

  const filtered = ALL_APPS.filter(
    (a) => !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.group.toLowerCase().includes(search.toLowerCase())
  );

  const groups = search
    ? [{ label: `Resultados (${filtered.length})`, apps: filtered }]
    : [
        { label: 'Productividad', apps: filtered.filter(a => a.group === 'Productividad') },
        { label: 'Sistema',       apps: filtered.filter(a => a.group === 'Sistema') },
        { label: 'Red',           apps: filtered.filter(a => a.group === 'Red') },
        { label: 'Almacenamiento',apps: filtered.filter(a => a.group === 'Almacenamiento') },
        { label: 'Usuarios',      apps: filtered.filter(a => a.group === 'Usuarios') },
        { label: 'Multimedia',    apps: filtered.filter(a => a.group === 'Multimedia') },
      ].filter(g => g.apps.length > 0);

  const launch = (app: typeof ALL_APPS[0]) => {
    openWindow(app.id, app.name, app.icon, app.defaultWidth, app.defaultHeight, app.minWidth, app.minHeight);
    closeLaunchPad();
    setSearch('');
  };

  return (
    <div className="launchpad" onClick={closeLaunchPad}>
      <div className="launchpad__inner" onClick={(e) => e.stopPropagation()}>
        <div className="launchpad__header">
          <div className="launchpad__logo">
            <svg width="22" height="22" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="12" fill="#2d7bff"/>
              <path d="M32 10l18 8v14c0 10-8 18-18 22C22 50 14 42 14 32V18l18-8z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
              <circle cx="32" cy="32" r="5" fill="white"/>
            </svg>
            <span>LGM OS</span>
          </div>
          <button className="launchpad__close" onClick={closeLaunchPad}><X size={16} /></button>
        </div>

        <div className="launchpad__search-wrap">
          <Search size={15} className="launchpad__search-icon" />
          <input
            type="text"
            className="launchpad__search"
            placeholder="Buscar aplicación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button className="launchpad__search-clear" onClick={() => setSearch('')}>
              <X size={12}/>
            </button>
          )}
        </div>

        <div className="launchpad__groups">
          {groups.map(group => (
            <div key={group.label} className="launchpad__group">
              {!search && <div className="launchpad__group-label">{group.label}</div>}
              <div className="launchpad__grid">
                {group.apps.map((app) => (
                  <button key={app.id} className="launchpad__item" onClick={() => launch(app)}>
                    <div className="launchpad__item-icon" style={{ background: app.color }}>
                      <AppIconSVG appId={app.id} size={32} />
                      {!SVG_APPS.has(app.id) && <span style={{ fontSize: 20 }}>{app.icon}</span>}
                    </div>
                    <span className="launchpad__item-name">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="launchpad__empty">Sin resultados para "{search}"</div>
          )}
        </div>
      </div>
    </div>
  );
}

