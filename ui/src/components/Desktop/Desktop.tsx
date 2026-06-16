import { useState, useCallback } from 'react';
import { useSystemStore } from '../../store/systemStore';
import { useWindowStore } from '../../store/windowStore';
import { APPS } from '../../apps/appRegistry';
import { AppIconSVG } from '../AppIcon/AppIcon';
import './Desktop.css';

/* ─── Wallpaper definitions ─── */
const WALLPAPERS = [
  {
    name: 'Synology Blue',
    style: {
      background: 'linear-gradient(160deg, #0b1e3e 0%, #0d3060 30%, #1a5496 60%, #2d7bff 100%)',
    },
    dots: '#ffffff18',
  },
  {
    name: 'Midnight Dark',
    style: {
      background: 'linear-gradient(160deg, #050810 0%, #0d0f1a 40%, #141627 80%, #1a1f35 100%)',
    },
    dots: '#ffffff10',
  },
  {
    name: 'Emerald',
    style: {
      background: 'linear-gradient(160deg, #042f2e 0%, #065f46 40%, #047857 70%, #10b981 100%)',
    },
    dots: '#ffffff14',
  },
  {
    name: 'Sunset',
    style: {
      background: 'linear-gradient(160deg, #1a0533 0%, #6b21a8 35%, #db2777 70%, #f97316 100%)',
    },
    dots: '#ffffff12',
  },
  {
    name: 'Graphite',
    style: {
      background: 'linear-gradient(160deg, #111111 0%, #1c1c1e 40%, #2c2c2e 70%, #3a3a3c 100%)',
    },
    dots: '#ffffff0d',
  },
  {
    name: 'Aurora',
    style: {
      background: 'linear-gradient(160deg, #05141b 0%, #0a2444 25%, #0d4f6e 50%, #00b4d8 75%, #48cae4 100%)',
    },
    dots: '#ffffff16',
  },
];

export function Desktop() {
  const { toggleLaunchPad, closeLaunchPad, showLaunchPad, addNotification } = useSystemStore();
  const { openWindow } = useWindowStore();
  const [wpIdx, setWpIdx] = useState(0);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [showWpPicker, setShowWpPicker] = useState(false);

  const wp = WALLPAPERS[wpIdx];

  const launchApp = useCallback(
    (appId: string) => {
      const app = APPS.find((a) => a.id === appId);
      if (!app) return;
      openWindow(app.id, app.name, app.icon, app.defaultWidth, app.defaultHeight, app.minWidth, app.minHeight);
      if (showLaunchPad) closeLaunchPad();
    },
    [openWindow, closeLaunchPad, showLaunchPad]
  );

  const openCtx = (e: React.MouseEvent) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
    setShowWpPicker(false);
  };
  const closeCtx = () => { setCtxMenu(null); setShowWpPicker(false); };

  return (
    <div
      className="desktop"
      style={wp.style as React.CSSProperties}
      onContextMenu={openCtx}
      onClick={closeCtx}
    >
      {/* Animated dot-grid overlay */}
      <svg className="desktop__grid-svg" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dotgrid" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill={wp.dots}/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)"/>
      </svg>

      {/* Glowing orbs */}
      <div className="desktop__orb desktop__orb--1"/>
      <div className="desktop__orb desktop__orb--2"/>

      {/* Desktop icons */}
      <div className="desktop__icons">
        {APPS.map((app) => (
          <button
            key={app.id}
            className="desktop__icon"
            onDoubleClick={() => launchApp(app.id)}
            onClick={(e) => e.stopPropagation()}
            title={app.description}
          >
            <div className="desktop__icon-wrap">
              <AppIconSVG appId={app.id} size={44} />
              {/* Fallback emoji icon if no SVG */}
              {!['file-station','control-panel','package-center','terminal','text-editor',
                  'system-info','calculator','network-services','ssh-manager',
                  'shared-folders','vpn','vpn-manager','task-manager','log-center',
                  'user-manager','storage-manager'].includes(app.id) && (
                <span className="desktop__icon-emoji" style={{ background: app.color }}>{app.icon}</span>
              )}
            </div>
            <span className="desktop__icon-label">{app.name}</span>
          </button>
        ))}
      </div>

      {/* Right-click context menu */}
      {ctxMenu && (
        <div
          className="desktop__context"
          style={{
            left: Math.min(ctxMenu.x, window.innerWidth - 230),
            top: Math.min(ctxMenu.y, window.innerHeight - 300),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="desktop__context-item" onClick={() => { toggleLaunchPad(); closeCtx(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Todas las aplicaciones
          </button>
          <div className="desktop__context-sep"/>
          <button className="desktop__context-item" onClick={(e) => { e.stopPropagation(); setShowWpPicker(v => !v); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            Cambiar fondo de escritorio
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          {showWpPicker && (
            <div className="desktop__wp-picker">
              {WALLPAPERS.map((w, i) => (
                <button key={i} className={`desktop__wp-item ${wpIdx === i ? 'desktop__wp-item--active' : ''}`}
                  onClick={() => { setWpIdx(i); addNotification('Fondo cambiado', w.name, 'success'); closeCtx(); }}>
                  <span className="desktop__wp-preview" style={w.style as React.CSSProperties}/>
                  <span>{w.name}</span>
                  {wpIdx === i && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2d7bff" strokeWidth="2.5" style={{ marginLeft: 'auto' }}><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              ))}
            </div>
          )}
          <div className="desktop__context-sep"/>
          <button className="desktop__context-item" onClick={() => { launchApp('system-info'); closeCtx(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Monitor del sistema
          </button>
          <button className="desktop__context-item" onClick={() => { launchApp('network-services'); closeCtx(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><line x1="12" y1="8" x2="5" y2="16"/><line x1="12" y1="8" x2="19" y2="16"/></svg>
            Servicios de red
          </button>
          <button className="desktop__context-item" onClick={() => { launchApp('control-panel'); closeCtx(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
            Panel de control
          </button>
        </div>
      )}
    </div>
  );
}


