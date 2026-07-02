import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, File, Folder, Settings, Terminal, X, ArrowUpDown, Clock, Star } from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import { useWindowStore } from '../../store/windowStore';
import { APPS } from '../../apps/appRegistry';
import './GlobalSearch.css';

interface SearchResult {
  id: string;
  type: 'app' | 'file' | 'setting' | 'action' | 'recent';
  label: string;
  description: string;
  icon: string;
  action: () => void;
}

const RECENT_FILES = [
  { name: 'Informe_Anual.pdf', path: '/Documentos', icon: '📕' },
  { name: 'Presupuesto.xlsx', path: '/Documentos', icon: '📊' },
  { name: 'playlist.mp3', path: '/Música', icon: '🎵' },
  { name: 'Notas_reunion.txt', path: '/Documentos', icon: '📄' },
  { name: 'tutorial.mp4', path: '/Videos', icon: '🎥' },
];

const QUICK_ACTIONS = [
  { id: 'calc', label: 'Abrir calculadora', desc: 'Herramienta de cálculo rápido', icon: '🧮' },
  { id: 'terminal', label: 'Abrir terminal', desc: 'Consola del sistema', icon: '💻' },
  { id: 'theme', label: 'Cambiar tema', desc: 'Alternar entre claro/oscuro', icon: '🎨' },
  { id: 'lock', label: 'Bloquear pantalla', desc: 'Cerrar sesión actual', icon: '🔒' },
];

export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { openWindow } = useWindowStore();
  const { toggleTheme, logout, addNotification } = useSystemStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([
        ...QUICK_ACTIONS.map(a => ({
          id: a.id, type: 'action' as const, label: a.label, description: a.desc,
          icon: a.icon, action: () => handleAction(a.id),
        })),
        ...RECENT_FILES.map((f, i) => ({
          id: `recent-${i}`, type: 'recent' as const, label: f.name, description: f.path,
          icon: f.icon, action: () => {},
        })),
      ]);
      setSelectedIdx(0);
      return;
    }

    const q = query.toLowerCase();
    const res: SearchResult[] = [];

    // Search apps
    APPS.forEach(app => {
      if (app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q)) {
        res.push({
          id: `app-${app.id}`, type: 'app', label: app.name,
          description: app.description, icon: app.icon,
          action: () => {
            openWindow(app.id, app.name, app.icon, app.defaultWidth, app.defaultHeight, app.minWidth, app.minHeight);
            onClose();
          },
        });
      }
    });

    // Search files
    RECENT_FILES.forEach(f => {
      if (f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)) {
        res.push({
          id: `file-${f.name}`, type: 'file', label: f.name, description: f.path,
          icon: f.icon, action: () => {},
        });
      }
    });

    // Search actions
    QUICK_ACTIONS.forEach(a => {
      if (a.label.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)) {
        res.push({
          id: `action-${a.id}`, type: 'action', label: a.label, description: a.desc,
          icon: a.icon, action: () => handleAction(a.id),
        });
      }
    });

    setResults(res);
    setSelectedIdx(0);
  }, [query]);

  const handleAction = (id: string) => {
    switch (id) {
      case 'calc': openWindow('calculator', 'Calculadora', '🧮', 300, 460, 260, 400); break;
      case 'terminal': openWindow('terminal', 'Terminal', '💻', 720, 460, 400, 300); break;
      case 'theme': toggleTheme(); addNotification('Tema cambiado', 'Tema del sistema alternado', 'info'); break;
      case 'lock': logout(); break;
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIdx]) { results[selectedIdx].action(); }
    if (e.key === 'Escape') onClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'app': return <span style={{ fontSize: 16 }}>📱</span>;
      case 'file': return <File size={14} />;
      case 'setting': return <Settings size={14} />;
      case 'action': return <Star size={14} />;
      case 'recent': return <Clock size={14} />;
      default: return <Search size={14} />;
    }
  };

  return (
    <div className="gs__overlay" onClick={onClose}>
      <div className="gs__modal" onClick={e => e.stopPropagation()}>
        <div className="gs__input-wrap">
          <Search size={18} className="gs__input-icon" />
          <input
            ref={inputRef}
            className="gs__input"
            placeholder="Buscar aplicaciones, archivos, configuraciones..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button className="gs__clear" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="gs__results">
          {results.length === 0 ? (
            <div className="gs__empty">Sin resultados para "{query}"</div>
          ) : (
            results.map((r, i) => (
              <div
                key={r.id}
                className={`gs__result ${i === selectedIdx ? 'gs__result--sel' : ''}`}
                onClick={r.action}
                onMouseEnter={() => setSelectedIdx(i)}
              >
                <div className="gs__result-icon">{r.icon ? <span style={{ fontSize: 20 }}>{r.icon}</span> : getIcon(r.type)}</div>
                <div className="gs__result-info">
                  <span className="gs__result-label">{r.label}</span>
                  <span className="gs__result-desc">{r.description}</span>
                </div>
                <span className="gs__result-type">{r.type}</span>
              </div>
            ))
          )}
        </div>

        <div className="gs__footer">
          <span><ArrowUpDown size={10} /> Navegar</span>
          <span><span className="gs__key">↵</span> Abrir</span>
          <span><span className="gs__key">Esc</span> Cerrar</span>
        </div>
      </div>
    </div>
  );
}