import { useState } from 'react';
import { FileText, Save, Copy, Trash2, Plus } from 'lucide-react';
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
    content: `Bienvenido al Editor de Texto de LGM OS
=========================================

Este es un editor de texto simple integrado en el sistema.

Puedes crear, editar y guardar archivos de texto.

Funcionalidades:
- Múltiples pestañas
- Indicador de cambios sin guardar (*)
- Copiar contenido al portapapeles
- Contador de líneas y palabras

¡Empieza a escribir!`,
    modified: false,
  },
  {
    id: 2,
    name: 'config.sh',
    content: `#!/bin/bash
# Configuración de LGM OS

HOSTNAME="lgmos"
VERSION="1.0.0"
AUTHOR="LGM Team"

# Iniciar servicios
systemctl start nginx
systemctl start mariadb

echo "LGM OS $VERSION iniciado correctamente"`,
    modified: false,
  },
];

export function TextEditor() {
  const [tabs, setTabs] = useState<Tab[]>(DEFAULT_TABS);
  const [activeId, setActiveId] = useState(1);
  const [saved, setSaved] = useState(false);

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  const updateContent = (content: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, content, modified: true } : t))
    );
    setSaved(false);
  };

  const save = () => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, modified: false } : t))
    );
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

  const lines  = (active?.content ?? '').split('\n').length;
  const words  = (active?.content ?? '').trim().split(/\s+/).filter(Boolean).length;
  const chars  = (active?.content ?? '').length;

  return (
    <div className="ted">
      {/* Toolbar */}
      <div className="ted__toolbar">
        <button className="ted__tool-btn" onClick={newTab} title="Nuevo archivo">
          <Plus size={14} />
        </button>
        <button className="ted__tool-btn ted__tool-btn--primary" onClick={save} title="Guardar">
          <Save size={14} />
          {saved ? 'Guardado ✓' : 'Guardar'}
        </button>
        <button className="ted__tool-btn" onClick={copy} title="Copiar todo">
          <Copy size={14} />
        </button>
        <button
          className="ted__tool-btn ted__tool-btn--danger"
          onClick={() => updateContent('')}
          title="Borrar contenido"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="ted__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`ted__tab ${activeId === tab.id ? 'ted__tab--active' : ''}`}
            onClick={() => setActiveId(tab.id)}
          >
            <FileText size={12} />
            <span>{tab.name}{tab.modified ? ' *' : ''}</span>
            {tabs.length > 1 && (
              <span className="ted__tab-close" onClick={(e) => closeTab(tab.id, e)}>×</span>
            )}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="ted__editor-wrap">
        {/* Line numbers */}
        <div className="ted__lines">
          {(active?.content ?? '').split('\n').map((_, i) => (
            <span key={i} className="ted__line-num">{i + 1}</span>
          ))}
        </div>
        <textarea
          className="ted__textarea"
          value={active?.content ?? ''}
          onChange={(e) => updateContent(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      {/* Status bar */}
      <div className="ted__status">
        <span>Ln {lines} | Col 1</span>
        <span>{words} palabras</span>
        <span>{chars} caracteres</span>
        <span>UTF-8</span>
        <span style={{ marginLeft: 'auto' }}>
          {active?.name}
        </span>
      </div>
    </div>
  );
}
