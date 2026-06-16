import { useState } from 'react';
import {
  Network, HardDrive, Shield, Users, Info, Bell, Palette, Server,
} from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import './ControlPanel.css';

type Section =
  | 'info'
  | 'network'
  | 'storage'
  | 'users'
  | 'security'
  | 'appearance'
  | 'notifications';

interface NavItem {
  id: Section;
  label: string;
  icon: React.ReactNode;
}

const NAV: NavItem[] = [
  { id: 'info',          label: 'Información',      icon: <Info size={15} /> },
  { id: 'network',       label: 'Red',              icon: <Network size={15} /> },
  { id: 'storage',       label: 'Almacenamiento',   icon: <HardDrive size={15} /> },
  { id: 'users',         label: 'Usuarios',         icon: <Users size={15} /> },
  { id: 'security',      label: 'Seguridad',        icon: <Shield size={15} /> },
  { id: 'notifications', label: 'Notificaciones',   icon: <Bell size={15} /> },
  { id: 'appearance',    label: 'Apariencia',       icon: <Palette size={15} /> },
];

function SysInfo() {
  const rows = [
    ['Sistema', 'LGM OS 1.0'],
    ['Kernel', 'Linux 6.1.0-lgm-amd64'],
    ['Arquitectura', 'x86_64'],
    ['CPU', 'Intel Core i7-12700 @ 2.10GHz × 8'],
    ['RAM Total', '16 GB'],
    ['Disco', '1 TB SSD'],
    ['Tiempo encendido', '3 días, 7 horas'],
    ['Versión UI', '1.0.0 (React 18)'],
  ];
  return (
    <div className="cp__section">
      <h3 className="cp__section-title">Información del Sistema</h3>
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

function NetworkSection() {
  const [dhcp, setDhcp] = useState(true);
  return (
    <div className="cp__section">
      <h3 className="cp__section-title">Configuración de Red</h3>
      <div className="cp__form">
        <div className="cp__form-row">
          <label className="cp__label">Interfaz</label>
          <select className="cp__input">
            <option>eth0 (Ethernet)</option>
            <option>wlan0 (Wi-Fi)</option>
          </select>
        </div>
        <div className="cp__form-row">
          <label className="cp__label">Modo IP</label>
          <div className="cp__toggle-group">
            <button className={`cp__toggle ${dhcp ? 'cp__toggle--on' : ''}`} onClick={() => setDhcp(true)}>DHCP</button>
            <button className={`cp__toggle ${!dhcp ? 'cp__toggle--on' : ''}`} onClick={() => setDhcp(false)}>Estática</button>
          </div>
        </div>
        {!dhcp && (
          <>
            <div className="cp__form-row">
              <label className="cp__label">Dirección IP</label>
              <input className="cp__input" defaultValue="192.168.1.100" />
            </div>
            <div className="cp__form-row">
              <label className="cp__label">Máscara de red</label>
              <input className="cp__input" defaultValue="255.255.255.0" />
            </div>
            <div className="cp__form-row">
              <label className="cp__label">Gateway</label>
              <input className="cp__input" defaultValue="192.168.1.1" />
            </div>
          </>
        )}
        <div className="cp__form-row">
          <label className="cp__label">DNS Primario</label>
          <input className="cp__input" defaultValue="8.8.8.8" />
        </div>
        <div className="cp__form-row">
          <label className="cp__label">DNS Secundario</label>
          <input className="cp__input" defaultValue="8.8.4.4" />
        </div>
        <button className="cp__save-btn">Guardar Configuración</button>
      </div>
    </div>
  );
}

function StorageSection() {
  const volumes = [
    { name: 'Disco Principal', total: 1000, used: 380, label: '/dev/sda' },
    { name: 'Disco Secundario', total: 500, used: 120, label: '/dev/sdb' },
  ];
  return (
    <div className="cp__section">
      <h3 className="cp__section-title">Almacenamiento</h3>
      {volumes.map((v) => {
        const pct = Math.round((v.used / v.total) * 100);
        return (
          <div key={v.name} className="cp__vol">
            <div className="cp__vol-header">
              <span className="cp__vol-name">
                <HardDrive size={14} /> {v.name}
              </span>
              <span className="cp__vol-label">{v.label}</span>
            </div>
            <div className="cp__progress-wrap">
              <div className="cp__progress">
                <div
                  className="cp__progress-bar"
                  style={{ width: `${pct}%`, background: pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#10b981' }}
                />
              </div>
              <span className="cp__vol-info">{v.used} GB / {v.total} GB ({pct}%)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UsersSection() {
  const users = [
    { name: 'admin', role: 'Administrador', status: 'Activo' },
    { name: 'lgm', role: 'Usuario', status: 'Activo' },
    { name: 'invitado', role: 'Invitado', status: 'Inactivo' },
  ];
  return (
    <div className="cp__section">
      <h3 className="cp__section-title">Gestión de Usuarios</h3>
      <div className="cp__user-table">
        <div className="cp__user-header">
          <span>Usuario</span><span>Rol</span><span>Estado</span>
        </div>
        {users.map((u) => (
          <div key={u.name} className="cp__user-row">
            <span className="cp__user-name">👤 {u.name}</span>
            <span className="cp__badge cp__badge--role">{u.role}</span>
            <span className={`cp__badge ${u.status === 'Activo' ? 'cp__badge--active' : 'cp__badge--inactive'}`}>
              {u.status}
            </span>
          </div>
        ))}
      </div>
      <button className="cp__save-btn" style={{ marginTop: 14 }}>+ Nuevo Usuario</button>
    </div>
  );
}

function AppearanceSection() {
  const { theme, toggleTheme } = useSystemStore();
  return (
    <div className="cp__section">
      <h3 className="cp__section-title">Apariencia</h3>
      <div className="cp__form">
        <div className="cp__form-row">
          <label className="cp__label">Tema del sistema</label>
          <div className="cp__toggle-group">
            <button className={`cp__toggle ${theme === 'light' ? 'cp__toggle--on' : ''}`} onClick={() => theme !== 'light' && toggleTheme()}>
              ☀️ Claro
            </button>
            <button className={`cp__toggle ${theme === 'dark' ? 'cp__toggle--on' : ''}`} onClick={() => theme !== 'dark' && toggleTheme()}>
              🌙 Oscuro
            </button>
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
      </div>
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="cp__section">
      <h3 className="cp__section-title">Seguridad</h3>
      <div className="cp__form">
        <div className="cp__form-row">
          <label className="cp__label">Firewall</label>
          <label className="cp__switch">
            <input type="checkbox" defaultChecked />
            <span className="cp__switch-slider" />
          </label>
        </div>
        <div className="cp__form-row">
          <label className="cp__label">Actualizaciones automáticas</label>
          <label className="cp__switch">
            <input type="checkbox" defaultChecked />
            <span className="cp__switch-slider" />
          </label>
        </div>
        <div className="cp__form-row">
          <label className="cp__label">SSH</label>
          <label className="cp__switch">
            <input type="checkbox" />
            <span className="cp__switch-slider" />
          </label>
        </div>
        <div className="cp__form-row">
          <label className="cp__label">Bloqueo tras inactividad</label>
          <select className="cp__input">
            <option>Nunca</option>
            <option>5 minutos</option>
            <option>15 minutos</option>
            <option>30 minutos</option>
            <option>1 hora</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function NotifSection() {
  const { addNotification } = useSystemStore();
  return (
    <div className="cp__section">
      <h3 className="cp__section-title">Notificaciones</h3>
      <div className="cp__form">
        <div className="cp__form-row">
          <label className="cp__label">Notificaciones del sistema</label>
          <label className="cp__switch">
            <input type="checkbox" defaultChecked />
            <span className="cp__switch-slider" />
          </label>
        </div>
        <div className="cp__form-row">
          <label className="cp__label">Sonido</label>
          <label className="cp__switch">
            <input type="checkbox" />
            <span className="cp__switch-slider" />
          </label>
        </div>
      </div>
      <button
        className="cp__save-btn"
        onClick={() => addNotification('Prueba', 'Esta es una notificación de prueba', 'info')}
        style={{ marginTop: 16 }}
      >
        Enviar notificación de prueba
      </button>
    </div>
  );
}

const SECTIONS: Record<Section, React.ReactNode> = {
  info:          <SysInfo />,
  network:       <NetworkSection />,
  storage:       <StorageSection />,
  users:         <UsersSection />,
  security:      <SecuritySection />,
  notifications: <NotifSection />,
  appearance:    <AppearanceSection />,
};

export function ControlPanel() {
  const [active, setActive] = useState<Section>('info');

  return (
    <div className="cp">
      <aside className="cp__nav">
        <div className="cp__nav-header">
          <Server size={14} /> Panel de Control
        </div>
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`cp__nav-item ${active === item.id ? 'cp__nav-item--active' : ''}`}
            onClick={() => setActive(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </aside>
      <div className="cp__content">
        {SECTIONS[active]}
      </div>
    </div>
  );
}
