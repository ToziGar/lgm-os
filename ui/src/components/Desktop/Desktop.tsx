import { useState, useCallback } from 'react';
import { useSystemStore } from '../../store/systemStore';
import { useWindowStore } from '../../store/windowStore';
import { APPS } from '../../apps/appRegistry';
import './Desktop.css';

interface DesktopIcon {
  appId: string;
  name: string;
  icon: string;
  color: string;
}

const WALLPAPERS = [
  'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #232526 0%, #414345 100%)',
  'linear-gradient(135deg, #0c3547 0%, #00416a 50%, #1c92d2 100%)',
  'linear-gradient(135deg, #1d0030 0%, #0f0c29 50%, #302b63 100%)',
];

export function Desktop() {
  const { toggleLaunchPad, closeLaunchPad, showLaunchPad } = useSystemStore();
  const { openWindow } = useWindowStore();
  const [wallpaper] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const desktopIcons: DesktopIcon[] = APPS.map((a) => ({
    appId: a.id,
    name: a.name,
    icon: a.icon,
    color: a.color,
  }));

  const launchApp = useCallback(
    (appId: string) => {
      const app = APPS.find((a) => a.id === appId);
      if (!app) return;
      openWindow(app.id, app.name, app.icon, app.defaultWidth, app.defaultHeight, app.minWidth, app.minHeight);
      if (showLaunchPad) closeLaunchPad();
    },
    [openWindow, closeLaunchPad, showLaunchPad]
  );

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  return (
    <div
      className="desktop"
      style={{ background: WALLPAPERS[wallpaper] }}
      onContextMenu={handleContextMenu}
      onClick={closeContextMenu}
    >
      {/* Wallpaper overlay */}
      <div className="desktop__overlay" />

      {/* Desktop icons */}
      <div className="desktop__icons">
        {desktopIcons.map((icon) => (
          <button
            key={icon.appId}
            className="desktop__icon"
            onDoubleClick={() => launchApp(icon.appId)}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="desktop__icon-badge"
              style={{ background: icon.color }}
            >
              {icon.icon}
            </span>
            <span className="desktop__icon-label">{icon.name}</span>
          </button>
        ))}
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          className="desktop__context"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="desktop__context-item" onClick={() => { toggleLaunchPad(); closeContextMenu(); }}>
            🚀 Abrir Lanzador
          </button>
          <div className="desktop__context-sep" />
          <button className="desktop__context-item" onClick={closeContextMenu}>
            🖼️ Cambiar fondo
          </button>
          <button className="desktop__context-item" onClick={closeContextMenu}>
            ℹ️ Acerca de LGM OS
          </button>
        </div>
      )}
    </div>
  );
}
