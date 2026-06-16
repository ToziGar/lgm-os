import { useState, useEffect } from 'react';
import {
  LayoutGrid, Bell, Sun, Moon, LogOut, User, ChevronUp,
} from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import { useWindowStore } from '../../store/windowStore';
import { APPS } from '../../apps/appRegistry';
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

export function Taskbar() {
  const { user, theme, notifications, toggleTheme, toggleLaunchPad, toggleNotifications, logout } =
    useSystemStore();
  const { windows, focusWindow, minimizeWindow, openWindow } = useWindowStore();

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
      {/* Left: Main menu button */}
      <div className="taskbar__left">
        <button className="taskbar__menu-btn" onClick={toggleLaunchPad} title="Menú principal">
          <LayoutGrid size={20} />
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
              className={`taskbar__app ${focused ? 'taskbar__app--focused' : ''} ${minimized ? 'taskbar__app--minimized' : ''}`}
              onClick={() => handleAppClick(app.id, appWindows[0]?.id)}
              title={app.name}
            >
              <span
                className="taskbar__app-icon"
                style={{ background: app.color }}
              >
                {app.icon}
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
        <button
          className="taskbar__tray-btn"
          onClick={toggleNotifications}
          title="Notificaciones"
        >
          <Bell size={16} />
          {unread > 0 && <span className="taskbar__notif-badge">{unread}</span>}
        </button>

        <button className="taskbar__tray-btn" onClick={toggleTheme} title="Cambiar tema">
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        <div className="taskbar__user">
          <User size={15} />
          <span>{user?.displayName}</span>
          <button className="taskbar__logout-btn" onClick={logout} title="Cerrar sesión">
            <LogOut size={14} />
          </button>
        </div>

        <Clock />
      </div>
    </div>
  );
}
