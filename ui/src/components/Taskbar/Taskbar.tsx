import { useState, useEffect, useRef } from 'react';
import {
  LayoutGrid, Bell, Sun, Moon, LogOut, User, Wifi, HardDrive,
} from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import { useWindowStore } from '../../store/windowStore';
import { useStorageStore } from '../../store/storageStore';
import { APPS } from '../../apps/appRegistry';
import { AppIconSVG } from '../AppIcon/AppIcon';
import './Taskbar.css';

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = time.getHours().toString().padStart(2, '0');
  const mm = time.getMinutes().toString().padStart(2, '0');
  const date = time.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  return (
    <div className="taskbar__clock">
      <span className="taskbar__clock-time">{hh}:{mm}</span>
      <span className="taskbar__clock-date">{date}</span>
    </div>
  );
}

function CpuIndicator() {
  const [cpu, setCpu] = useState(() => Math.round(15 + Math.random() * 20));
  const prevRef = useRef(cpu);
  useEffect(() => {
    const id = setInterval(() => {
      // Smooth random walk: max ±8 per tick, clamp to 5-75
      const delta = Math.round((Math.random() - 0.5) * 16);
      const next  = Math.max(5, Math.min(75, prevRef.current + delta));
      prevRef.current = next;
      setCpu(next);
    }, 3000);
    return () => clearInterval(id);
  }, []);
  const color = cpu > 75 ? '#ef4444' : cpu > 55 ? '#f59e0b' : '#00b87c';
  return (
    <div className="taskbar__perf" title={`CPU: ${cpu}%`}>
      <span className="taskbar__perf-label">CPU</span>
      <div className="taskbar__perf-bar">
        <div className="taskbar__perf-fill" style={{ width: `${cpu}%`, background: color }} />
      </div>
      <span className="taskbar__perf-val" style={{ color }}>{cpu}%</span>
    </div>
  );
}

export function Taskbar() {
  const { user, theme, notifications, toggleTheme, toggleLaunchPad, toggleNotifications, logout } =
    useSystemStore();
  const { windows, focusWindow, minimizeWindow, openWindow } = useWindowStore();
  const { volumes } = useStorageStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showStorage,  setShowStorage]  = useState(false);
  const [showNetwork,  setShowNetwork]  = useState(false);

  const unread = notifications.filter((n) => !n.read).length;

  const handleAppClick = (appId: string, winId: string | undefined) => {
    if (winId) {
      const win = windows.find((w) => w.id === winId);
      if (win?.isMinimized || !win?.isFocused) {
        focusWindow(winId);
      } else {
        minimizeWindow(winId);
      }
    } else {
      const app = APPS.find((a) => a.id === appId);
      if (app) {
        openWindow(app.id, app.name, app.icon, app.defaultWidth, app.defaultHeight, app.minWidth, app.minHeight);
      }
    }
  };

  const runningApps = APPS.filter((app) => windows.some((w) => w.appId === app.id));

  return (
    <div className="taskbar">
      {/* Left: Main menu */}
      <div className="taskbar__left">
        <button className="taskbar__menu-btn" onClick={toggleLaunchPad} title="Menú principal">
          <LayoutGrid size={18} />
        </button>
      </div>

      {/* Center: Running apps */}
      <div className="taskbar__center">
        {runningApps.map((app) => {
          const appWindows = windows.filter((w) => w.appId === app.id);
          const focused = appWindows.some((w) => w.isFocused && !w.isMinimized);
          const minimized = appWindows.every((w) => w.isMinimized);
          return (
            <button
              key={app.id}
              className={`taskbar__app${focused ? ' taskbar__app--focused' : ''}${minimized ? ' taskbar__app--minimized' : ''}`}
              onClick={() => handleAppClick(app.id, appWindows[0]?.id)}
              title={app.name}
            >
              <span className="taskbar__app-icon" style={{ background: app.color, overflow: 'hidden', padding: 0 }}>
                <AppIconSVG appId={app.id} size={20} />
                {!['file-station','control-panel','package-center','terminal','text-editor',
                    'system-info','calculator','network-services','ssh-manager',
                    'shared-folders','vpn','vpn-manager','task-manager','log-center',
                    'user-manager','storage-manager','zfs-panel'].includes(app.id) && (
                  <span style={{ fontSize: 12 }}>{app.icon}</span>
                )}
              </span>
              <span className="taskbar__app-name">{app.name}</span>
              {appWindows.length > 1 && (
                <span className="taskbar__app-badge">{appWindows.length}</span>
              )}
              <span className="taskbar__app-dot" />
            </button>
          );
        })}
      </div>

      {/* Right: System tray */}
      <div className="taskbar__right">
        <CpuIndicator />

        <div className="taskbar__tray-sep" />

        <button className="taskbar__tray-btn" title="Red: 192.168.1.100" onClick={() => { setShowNetwork(v => !v); setShowStorage(false); setShowUserMenu(false); }}>
          <Wifi size={14} />
        </button>

        {/* Network popup */}
        {showNetwork && (
          <>
            <div className="taskbar__popup-overlay" onClick={() => setShowNetwork(false)}/>
            <div className="taskbar__popup" style={{ right: 180 }}>
              <div className="taskbar__popup-title"><Wifi size={13}/> Red</div>
              {[['Interfaz','eth0'],['IP','192.168.1.100'],['Máscara','255.255.255.0'],['Gateway','192.168.1.1'],['DNS','8.8.8.8'],['Hostname','lgm-nas-01.local']].map(([k,v]) => (
                <div key={k} className="taskbar__popup-row"><span>{k}</span><code>{v}</code></div>
              ))}
            </div>
          </>
        )}

        <div style={{ position: 'relative' }}>
          <button className="taskbar__tray-btn" title="Almacenamiento" onClick={() => { setShowStorage(v => !v); setShowNetwork(false); setShowUserMenu(false); }}>
            <HardDrive size={14} />
          </button>

          {/* Storage popup */}
          {showStorage && (
            <>
              <div className="taskbar__popup-overlay" onClick={() => setShowStorage(false)}/>
              <div className="taskbar__popup">
                <div className="taskbar__popup-title"><HardDrive size={13}/> Almacenamiento</div>
                {volumes.map(v => {
                  const pct = Math.round((v.usedGB / v.totalGB) * 100);
                  return (
                    <div key={v.id} className="taskbar__popup-vol">
                      <div className="taskbar__popup-vol-header">
                        <span>{v.name}</span>
                        <span style={{ color: pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : 'var(--text-muted)' }}>{pct}%</span>
                      </div>
                      <div className="taskbar__popup-vol-bar">
                        <div style={{ width: `${pct}%`, background: pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#3b82f6' }}/>
                      </div>
                      <div className="taskbar__popup-vol-meta">{v.usedGB} / {v.totalGB} GB · {v.raidType}</div>
                    </div>
                  );
                })}
                <button className="taskbar__popup-btn" onClick={() => { setShowStorage(false); openWindow('storage-manager','Almacenamiento','💿',1040,660,780,500); }}>
                  → Abrir administrador
                </button>
              </div>
            </>
          )}
        </div>

        <button
          className="taskbar__tray-btn"
          onClick={toggleNotifications}
          title="Notificaciones"
        >
          <Bell size={14} />
          {unread > 0 && <span className="taskbar__notif-badge">{unread > 9 ? '9+' : unread}</span>}
        </button>

        <button className="taskbar__tray-btn" onClick={toggleTheme} title="Cambiar tema">
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        <div className="taskbar__tray-sep" />

        {/* User menu */}
        <div style={{ position: 'relative' }}>
          <button
            className="taskbar__user"
            onClick={() => setShowUserMenu((v) => !v)}
          >
            <div className="taskbar__user-avatar">
              {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <span className="taskbar__user-name">{user?.displayName}</span>
          </button>

          {showUserMenu && (
            <>
              <div className="taskbar__user-overlay" onClick={() => setShowUserMenu(false)} />
              <div className="taskbar__user-menu">
                <div className="taskbar__user-menu-header">
                  <div className="taskbar__user-avatar taskbar__user-avatar--lg">
                    {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div>
                    <p className="taskbar__user-menu-name">{user?.displayName}</p>
                    <p className="taskbar__user-menu-role">{user?.isAdmin ? 'Administrador' : 'Usuario'}</p>
                  </div>
                </div>
                <div className="taskbar__user-menu-sep" />
                <button
                  className="taskbar__user-menu-item"
                  onClick={() => { logout(); setShowUserMenu(false); }}
                >
                  <LogOut size={14} />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>

        <div className="taskbar__tray-sep" />
        <Clock />
      </div>
    </div>
  );
}
