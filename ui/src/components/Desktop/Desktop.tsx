import { useState, useCallback } from 'react';
import { useSystemStore } from '../../store/systemStore';
import { useWindowStore } from '../../store/windowStore';
import { APPS } from '../../apps/appRegistry';
import './Desktop.css';

const WALLPAPERS = [
  { name: 'Océano Profundo',  bg: 'linear-gradient(145deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
  { name: 'Noche Estrellada', bg: 'linear-gradient(145deg, #0d1b2a 0%, #1b263b 50%, #415a77 100%)' },
  { name: 'Bosque Oscuro',    bg: 'linear-gradient(145deg, #0a1628 0%, #0d2137 50%, #1a3a4a 100%)' },
  { name: 'Amanecer',        bg: 'linear-gradient(145deg, #1a0533 0%, #2d1b69 40%, #11998e 100%)' },
  { name: 'Volcán',          bg: 'linear-gradient(145deg, #200122 0%, #6f0000 100%)' },
  { name: 'Ártico',          bg: 'linear-gradient(145deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)' },
];

export function Desktop() {
  const { toggleLaunchPad, closeLaunchPad, showLaunchPad, addNotification } = useSystemStore();
  const { openWindow } = useWindowStore();
  const [wallpaper, setWallpaper] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);

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
    setShowWallpaperPicker(false);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    setShowWallpaperPicker(false);
  };

  const handleWallpaperChange = (idx: number) => {
    setWallpaper(idx);
    addNotification('Fondo cambiado', `Fondo "${WALLPAPERS[idx].name}" aplicado`, 'success');
    closeContextMenu();
  };

  return (
    <div
      className="desktop"
      style={{ background: WALLPAPERS[wallpaper].bg }}
      onContextMenu={handleContextMenu}
      onClick={closeContextMenu}
    >
      <div className="desktop__overlay" />

      {/* Desktop icons — left column */}
      <div className="desktop__icons">
        {APPS.map((app) => (
          <button
            key={app.id}
            className="desktop__icon"
            onDoubleClick={() => launchApp(app.id)}
            onClick={(e) => e.stopPropagation()}
            title={`${app.name} — doble clic para abrir`}
          >
            <span className="desktop__icon-badge" style={{ background: app.color }}>
              {app.icon}
            </span>
            <span className="desktop__icon-label">{app.name}</span>
          </button>
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="desktop__context"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 220),
            top: Math.min(contextMenu.y, window.innerHeight - 280),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="desktop__context-item" onClick={() => { toggleLaunchPad(); closeContextMenu(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Abrir Lanzador
          </button>
          <div className="desktop__context-sep" />
          <button
            className="desktop__context-item"
            onClick={(e) => { e.stopPropagation(); setShowWallpaperPicker((v) => !v); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            Cambiar fondo
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          {showWallpaperPicker && (
            <div className="desktop__wallpaper-submenu">
              {WALLPAPERS.map((w, i) => (
                <button
                  key={i}
                  className={`desktop__wallpaper-item ${wallpaper === i ? 'desktop__wallpaper-item--active' : ''}`}
                  onClick={() => handleWallpaperChange(i)}
                >
                  <span className="desktop__wallpaper-preview" style={{ background: w.bg }} />
                  <span>{w.name}</span>
                  {wallpaper === i && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 'auto', color: '#2d7bff' }}><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              ))}
            </div>
          )}

          <div className="desktop__context-sep" />
          <button className="desktop__context-item" onClick={() => { launchApp('system-info'); closeContextMenu(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Monitor del sistema
          </button>
          <button className="desktop__context-item" onClick={() => { launchApp('control-panel'); closeContextMenu(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
            Panel de control
          </button>
        </div>
      )}
    </div>
  );
}
