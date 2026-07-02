import { useState, useCallback } from 'react';
import { useSystemStore } from '../../store/systemStore';
import { useWindowStore } from '../../store/windowStore';
import { APPS } from '../../apps/appRegistry';
import { AppIconSVG } from '../AppIcon/AppIcon';
import './Desktop.css';

/* ─── Wallpaper definitions ─── */
const WALLPAPERS = [
  {
    name: 'LGM Azul',
    css: 'wp--dsm',
    preview: 'linear-gradient(135deg,#0a2a6e 0%,#1a4fcc 45%,#00c8ff 100%)',
  },
  {
    name: 'Atardecer',
    css: 'wp--monterey',
    preview: 'linear-gradient(135deg,#e8523a 0%,#c03a8c 50%,#6d28d9 100%)',
  },
  {
    name: 'Amanecer',
    css: 'wp--sonoma',
    preview: 'linear-gradient(135deg,#f97316 0%,#ec4899 45%,#8b5cf6 100%)',
  },
  {
    name: 'Bosque',
    css: 'wp--sequoia',
    preview: 'linear-gradient(135deg,#064e3b 0%,#065f46 35%,#0e7490 75%,#1e3a5f 100%)',
  },
  {
    name: 'Medianoche',
    css: 'wp--ventura',
    preview: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 30%,#4f46e5 60%,#7c3aed 100%)',
  },
  {
    name: 'LGM Oscuro',
    css: 'wp--dsm-dark',
    preview: 'linear-gradient(135deg,#020a18 0%,#0a1e3d 45%,#0d2d5e 100%)',
  },
];

export function Desktop() {
  const { toggleLaunchPad, closeLaunchPad, showLaunchPad, addNotification } = useSystemStore();
  const { openWindow } = useWindowStore();
  const savedWp = parseInt(localStorage.getItem('lgmos-wallpaper') ?? '0', 10);
  const [wpIdx, setWpIdx] = useState(isNaN(savedWp) ? 0 : savedWp);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [showWpPicker, setShowWpPicker] = useState(false);

  const wp = WALLPAPERS[wpIdx];

  const launchApp = useCallback(
    (appId: string) => {
      const app = APPS.find((a) => a.id === appId);
      // For system apps not in desktop registry, use fixed sizes
      const SYSTEM_SIZES: Record<string, [number,number,number,number]> = {
        'system-info':    [700, 540, 540, 400],
        'network-services':[960, 640, 700, 480],
        'terminal':       [720, 460, 400, 300],
      };
      if (app) {
        openWindow(app.id, app.name, app.icon, app.defaultWidth, app.defaultHeight, app.minWidth, app.minHeight);
      } else if (SYSTEM_SIZES[appId]) {
        const [w, h, mw, mh] = SYSTEM_SIZES[appId];
        const names: Record<string, string> = { 'system-info': 'Monitor del Sistema', 'network-services': 'Servicios de Red', 'terminal': 'Terminal' };
        openWindow(appId, names[appId] ?? appId, '', w, h, mw, mh);
      }
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
      className={`desktop ${wp.css}`}
      onContextMenu={openCtx}
      onClick={closeCtx}
    >
      {/* Dot-grid overlay */}
      <svg className="desktop__grid-svg" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dotgrid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="rgba(255,255,255,0.05)"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)"/>
      </svg>

      {/* Light beams */}
      <div className="desktop__beam desktop__beam--1"/>
      <div className="desktop__beam desktop__beam--2"/>

      {/* Glowing orbs */}
      <div className="desktop__orb desktop__orb--1"/>
      <div className="desktop__orb desktop__orb--2"/>
      <div className="desktop__orb desktop__orb--3"/>
      <div className="desktop__orb desktop__orb--4"/>

      {/* Desktop icons (skip control-panel, it's accessible from LaunchPad) */}
      <div className="desktop__icons">
        {APPS.filter(app => app.id !== 'control-panel').map((app) => (
          <button
            key={app.id}
            className="desktop__icon"
            onClick={(e) => { e.stopPropagation(); launchApp(app.id); }}
            title={app.description}
          >
            <div className="desktop__icon-wrap">
              <AppIconSVG appId={app.id} size={44} />
              {/* Fallback emoji icon if no SVG */}
              {!['file-station','control-panel','package-center','terminal','text-editor',
                  'system-info','calculator','network-services','ssh-manager',
                  'shared-folders','vpn','vpn-manager','task-manager','log-center',
                  'user-manager','storage-manager','zfs-panel'].includes(app.id) && (
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
            top: Math.min(ctxMenu.y, window.innerHeight - 340),
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
            Cambiar fondo
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          {showWpPicker && (
            <div className="desktop__wp-picker">
              {WALLPAPERS.map((w, i) => (
                <button key={i} className={`desktop__wp-item ${wpIdx === i ? 'desktop__wp-item--active' : ''}`}
                  onClick={() => { setWpIdx(i); localStorage.setItem('lgmos-wallpaper', String(i)); addNotification('Fondo cambiado', w.name, 'success'); closeCtx(); }}>
                  <span className="desktop__wp-preview" style={{ background: w.preview } as React.CSSProperties}/>
                  <span>{w.name}</span>
                  {wpIdx === i && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2d7bff" strokeWidth="2.5" style={{ marginLeft: 'auto' }}><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              ))}
            </div>
          )}
          <div className="desktop__context-sep"/>
          <button className="desktop__context-item" onClick={() => { launchApp('control-panel'); closeCtx(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
            Panel de control
          </button>
          <button className="desktop__context-item" onClick={() => { launchApp('system-info'); closeCtx(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Monitor del sistema
          </button>
          <button className="desktop__context-item" onClick={() => { launchApp('terminal'); closeCtx(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
            Terminal
          </button>
          <div className="desktop__context-sep"/>
          <button className="desktop__context-item" onClick={() => {
            addNotification('LGM OS 1.0', 'Basado en Debian GNU/Linux 12 · UI: Vite 8 + React 18 · Kernel 6.1.0-lgm-amd64', 'info');
            closeCtx();
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Acerca de LGM OS
          </button>
        </div>
      )}
    </div>
  );
}
