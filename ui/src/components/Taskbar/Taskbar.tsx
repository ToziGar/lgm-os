import { useState, useEffect } from 'react';
import {
  LayoutGrid, Bell, Sun, Moon, LogOut, User, Wifi, HardDrive,
} from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import { useWindowStore } from '../../store/windowStore';
import { APPS } from '../../apps/appRegistry';import { AppIconSVG } from '../AppIcon/AppIcon';import './Taskbar.css';

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
  const [cpu, setCpu] = useState(Math.round(15 + Math.random() * 30));
  useEffect(() => {
    const id = setInterval(() => setCpu(Math.round(8 + Math.random() * 55)), 3000);
    return () => clearInterval(id);
  }, []);
  const color = cpu > 80 ? '#ef4444' : cpu > 60 ? '#f59e0b' : '#00b87c';
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
  const [showUserMenu, setShowUserMenu] = useState(false);

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
                    'shared-folders','vpn'].includes(app.id) && (
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

        <button className="taskbar__tray-btn" title="Red: Conectado">
          <Wifi size={14} />
        </button>

        <button className="taskbar__tray-btn" title="Almacenamiento">
          <HardDrive size={14} />
        </button>

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
