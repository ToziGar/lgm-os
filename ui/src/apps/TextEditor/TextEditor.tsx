import { useState, useRef } from 'react';
import { FileText, Save, Copy, Plus, Search, WrapText, RotateCcw } from 'lucide-react';
import './TextEditor.css';

interface Tab {
  id: number;
  name: string;
  content: string;
  modified: boolean;
}

let nextTabId = 3;

const DEFAULT_TABS: Tab[] = [
  {
    id: 1,
    name: 'bienvenida.txt',
    content: `Bienvenido al Editor de Texto de LGM OS\n==========================================\n\nEste es un editor de texto integrado en el sistema.\n\nFuncionalidades:\n- Múltiples pestañas (doble clic para renombrar)\n- Indicador de cambios sin guardar (•)\n- Números de línea\n- Buscar y reemplazar\n- Ajuste de línea\n- Contador de líneas, palabras y caracteres\n\n¡Empieza a escribir!`,
    modified: false,
  },
  {
    id: 2,
    name: 'config.sh',
    content: `#!/bin/bash\n# Configuración de LGM OS\n\nHOSTNAME="lgmos"\nVERSION="1.0.0"\nAUTHOR="LGM Team"\n\n# Iniciar servicios\nsystemctl start nginx\nsystemctl start mariadb\n\necho "LGM OS $VERSION iniciado correctamente"`,
    modified: false,
  },
];

export function TextEditor() {
  const [tabs, setTabs]         = useState<Tab[]>(DEFAULT_TABS);
  const [activeId, setActiveId] = useState(1);
  const [saved, setSaved]       = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [showFind, setShowFind] = useState(false);
  const [findVal, setFindVal]   = useState('');
  const [replVal, setReplVal]   = useState('');
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  const updateContent = (content: string) => {
    setTabs((prev) => prev.map((t) => (t.id === activeId ? { ...t, content, modified: true } : t)));
    setSaved(false);
  };

  const save = () => {
    setTabs((prev) => prev.map((t) => (t.id === activeId ? { ...t, modified: false } : t)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const newTab = () => {
    const tab: Tab = { id: nextTabId++, name: `sin_titulo_${nextTabId - 2}.txt`, content: '', modified: false };
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab.id);
  };

  const closeTab = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeId === id) setActiveId(remaining[remaining.length - 1].id);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(active?.content ?? '').catch(() => {});
  };

  const doFind = () => {
    if (!findVal) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.value.indexOf(findVal, ta.selectionEnd);
    const found = start >= 0 ? start : ta.value.indexOf(findVal);
    if (found >= 0) { ta.focus(); ta.setSelectionRange(found, found + findVal.length); }
  };

  const doReplace = () => {
    if (!findVal) return;
    const escaped = findVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    updateContent((active?.content ?? '').replace(new RegExp(escaped, 'g'), replVal));
  };

  const commitRename = (id: number) => {
    if (renameVal.trim()) {
      setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, name: renameVal.trim() } : t)));
    }
    setRenameId(null);
  };

  const lines = (active?.content ?? '').split('\n').length;
  const words = (active?.content ?? '').trim().split(/\s+/).filter(Boolean).length;
  const chars = (active?.content ?? '').length;

  return (
    <div className="ted">
      {/* Toolbar */}
      <div className="ted__toolbar">
        <button className="ted__tool-btn" onClick={newTab}>
          <Plus size={13} /> Nuevo
        </button>
        <button className={`ted__tool-btn${saved ? ' ted__tool-btn--saved' : ' ted__tool-btn--primary'}`} onClick={save}>
          <Save size={13} /> {saved ? 'Guardado ✓' : 'Guardar'}
        </button>
        <div className="ted__toolbar-sep" />
        <button className="ted__tool-btn" onClick={copy}><Copy size={13} /> Copiar</button>
        <button className="ted__tool-btn" onClick={() => updateContent('')}><RotateCcw size={13} /> Limpiar</button>
        <div className="ted__toolbar-sep" />
        <button className={`ted__tool-btn${showFind ? ' ted__tool-btn--active' : ''}`} onClick={() => setShowFind((v) => !v)}>
          <Search size={13} /> Buscar
        </button>
        <button className={`ted__tool-btn${wordWrap ? ' ted__tool-btn--active' : ''}`} onClick={() => setWordWrap((v) => !v)} title="Ajuste de línea">
          <WrapText size={13} />
        </button>
      </div>

      {/* Find & Replace bar */}
      {showFind && (
        <div className="ted__find-bar">
          <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input className="ted__find-input" placeholder="Buscar..." value={findVal}
            onChange={(e) => setFindVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doFind()} />
          <span className="ted__find-arrow">→</span>
          <input className="ted__find-input" placeholder="Reemplazar con..." value={replVal}
            onChange={(e) => setReplVal(e.target.value)} />
          <button className="ted__tool-btn" onClick={doFind}>Buscar</button>
          <button className="ted__tool-btn ted__tool-btn--primary" onClick={doReplace}>Reemplazar todo</button>
        </div>
      )}

      {/* Tabs */}
      <div className="ted__tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`ted__tab ${activeId === tab.id ? 'ted__tab--active' : ''}`}
            onClick={() => setActiveId(tab.id)}
          >
            <FileText size={11} />
            {renameId === tab.id ? (
              <input
                className="ted__tab-rename"
                value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                onBlur={() => commitRename(tab.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitRename(tab.id); if (e.key === 'Escape') setRenameId(null); e.stopPropagation(); }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span onDoubleClick={(e) => { e.stopPropagation(); setRenameId(tab.id); setRenameVal(tab.name); }}>
                {tab.name}{tab.modified ? ' •' : ''}
              </span>
            )}
            {tabs.length > 1 && (
              <span className="ted__tab-close" onClick={(e) => closeTab(tab.id, e)}>×</span>
            )}
          </div>
        ))}
        <button className="ted__tab-add" onClick={newTab}>+</button>
      </div>

      {/* Editor */}
      <div className="ted__editor-wrap">
        <div className="ted__lines">
          {(active?.content ?? '').split('\n').map((_, i) => (
            <span key={i} className="ted__line-num">{i + 1}</span>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className="ted__textarea"
          value={active?.content ?? ''}
          onChange={(e) => updateContent(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          wrap={wordWrap ? 'soft' : 'off'}
        />
      </div>

      {/* Status bar */}
      <div className="ted__status">
        <span>Ln {lines}</span>
        <span className="ted__status-sep" />
        <span>{words} palabras</span>
        <span className="ted__status-sep" />
        <span>{chars} car.</span>
        <span className="ted__status-sep" />
        <span>UTF-8</span>
        <span className="ted__status-sep" />
        <span>{wordWrap ? 'Ajuste ■' : 'Ajuste □'}</span>
        <span style={{ marginLeft: 'auto' }} className="ted__status-name">{active?.name}</span>
      </div>
    </div>
  );
}
