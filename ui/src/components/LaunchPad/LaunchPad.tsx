import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import { useWindowStore } from '../../store/windowStore';
import { APPS } from '../../apps/appRegistry';
import './LaunchPad.css';

export function LaunchPad() {
  const { showLaunchPad, closeLaunchPad } = useSystemStore();
  const { openWindow } = useWindowStore();
  const [search, setSearch] = useState('');

  if (!showLaunchPad) return null;

  const filtered = APPS.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase())
  );

  const launch = (appId: string) => {
    const app = APPS.find((a) => a.id === appId);
    if (!app) return;
    openWindow(app.id, app.name, app.icon, app.defaultWidth, app.defaultHeight, app.minWidth, app.minHeight);
    closeLaunchPad();
    setSearch('');
  };

  return (
    <div className="launchpad" onClick={closeLaunchPad}>
      <div className="launchpad__inner" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="launchpad__header">
          <h2 className="launchpad__title">
            <span>⬡</span> LGM OS — Aplicaciones
          </h2>
          <button className="launchpad__close" onClick={closeLaunchPad}>
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="launchpad__search-wrap">
          <Search size={16} className="launchpad__search-icon" />
          <input
            type="text"
            className="launchpad__search"
            placeholder="Buscar aplicación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* App grid */}
        <div className="launchpad__grid">
          {filtered.map((app) => (
            <button
              key={app.id}
              className="launchpad__item"
              onClick={() => launch(app.id)}
            >
              <span
                className="launchpad__item-icon"
                style={{ background: app.color }}
              >
                {app.icon}
              </span>
              <span className="launchpad__item-name">{app.name}</span>
              <span className="launchpad__item-desc">{app.description}</span>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="launchpad__empty">
              No se encontraron aplicaciones
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
