import { useState, useRef, useCallback } from 'react';
import {
  ChevronRight, Folder, File, HardDrive, Home, Trash2,
  Upload, Download, Plus, Grid, List, ArrowLeft, ArrowRight,
  RefreshCw, Search, Edit3, Copy, FolderPlus, Info,
  Image, Music, Video, FileText, Archive,
} from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import './FileStation.css';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  modified?: string;
  ext?: string;
}

type FS = Record<string, FileItem[]>;

let nextId = 1000;
const mkId = () => `item-${nextId++}`;

const INITIAL_FS: FS = {
  '/': [
    { id: mkId(), name: 'home',       type: 'folder', modified: '16/06/2025' },
    { id: mkId(), name: 'Documentos', type: 'folder', modified: '15/06/2025' },
    { id: mkId(), name: 'Descargas',  type: 'folder', modified: '14/06/2025' },
    { id: mkId(), name: 'Imágenes',   type: 'folder', modified: '12/06/2025' },
    { id: mkId(), name: 'Música',    type: 'folder', modified: '10/06/2025' },
    { id: mkId(), name: 'Videos',     type: 'folder', modified: '08/06/2025' },
    { id: mkId(), name: 'README.txt', type: 'file', size: '1.2 KB', modified: '16/06/2025', ext: 'txt' },
  ],
  '/home': [
    { id: mkId(), name: 'admin', type: 'folder', modified: '16/06/2025' },
    { id: mkId(), name: 'lgm',   type: 'folder', modified: '16/06/2025' },
  ],
  '/Documentos': [
    { id: mkId(), name: 'Informe_Anual.pdf', type: 'file', size: '2.4 MB', modified: '10/06/2025', ext: 'pdf' },
    { id: mkId(), name: 'Presupuesto.xlsx', type: 'file', size: '340 KB', modified: '08/06/2025', ext: 'xlsx' },
    { id: mkId(), name: 'Notas.txt',        type: 'file', size: '4 KB',   modified: '15/06/2025', ext: 'txt' },
    { id: mkId(), name: 'Proyectos',        type: 'folder', modified: '12/06/2025' },
  ],
  '/Descargas': [
    { id: mkId(), name: 'debian-12.iso', type: 'file', size: '3.7 GB', modified: '01/06/2025', ext: 'iso' },
    { id: mkId(), name: 'setup.exe',     type: 'file', size: '128 MB', modified: '05/06/2025', ext: 'exe' },
    { id: mkId(), name: 'fonts.zip',     type: 'file', size: '12 MB',  modified: '07/06/2025', ext: 'zip' },
  ],
  '/Imágenes': [
    { id: mkId(), name: 'fondo.jpg',    type: 'file', size: '4.1 MB', modified: '12/06/2025', ext: 'jpg' },
    { id: mkId(), name: 'captura.png',  type: 'file', size: '820 KB', modified: '14/06/2025', ext: 'png' },
    { id: mkId(), name: 'logo.svg',     type: 'file', size: '18 KB',  modified: '10/06/2025', ext: 'svg' },
    { id: mkId(), name: 'Vacaciones',   type: 'folder', modified: '01/06/2025' },
  ],
  '/Música': [
    { id: mkId(), name: 'playlist.mp3', type: 'file', size: '8.2 MB', modified: '09/06/2025', ext: 'mp3' },
    { id: mkId(), name: 'rock_mix.mp3', type: 'file', size: '12 MB',  modified: '09/06/2025', ext: 'mp3' },
  ],
  '/Videos': [
    { id: mkId(), name: 'tutorial.mp4', type: 'file', size: '210 MB', modified: '11/06/2025', ext: 'mp4' },
    { id: mkId(), name: 'demo.webm',    type: 'file', size: '45 MB',  modified: '13/06/2025', ext: 'webm' },
  ],
};

function getFileIcon(item: FileItem) {
  if (item.type === 'folder') return <Folder size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />;
  const ext = item.ext?.toLowerCase() ?? '';
  if (['jpg','jpeg','png','gif','svg','webp'].includes(ext)) return <Image size={15} style={{ color: '#3b82f6', flexShrink: 0 }} />;
  if (['mp3','wav','flac','ogg'].includes(ext)) return <Music size={15} style={{ color: '#a855f7', flexShrink: 0 }} />;
  if (['mp4','avi','mkv','webm','mov'].includes(ext)) return <Video size={15} style={{ color: '#ef4444', flexShrink: 0 }} />;
  if (['pdf','doc','docx','txt','md'].includes(ext)) return <FileText size={15} style={{ color: '#6b7280', flexShrink: 0 }} />;
  if (['zip','tar','gz','iso','7z','rar'].includes(ext)) return <Archive size={15} style={{ color: '#78716c', flexShrink: 0 }} />;
  return <File size={15} style={{ color: '#6b7280', flexShrink: 0 }} />;
}

function getFileIconLg(item: FileItem) {
  if (item.type === 'folder') return '📁';
  const ext = item.ext?.toLowerCase() ?? '';
  if (['jpg','jpeg','png','gif','svg','webp'].includes(ext)) return '🖼️';
  if (['mp3','wav','flac','ogg'].includes(ext)) return '🎵';
  if (['mp4','avi','mkv','webm','mov'].includes(ext)) return '🎥';
  if (['pdf'].includes(ext)) return '📄';
  if (['zip','tar','gz','iso','7z','rar'].includes(ext)) return '📦';
  if (['txt','md'].includes(ext)) return '📝';
  return '📃';
}

interface CtxMenu { x: number; y: number; item: FileItem | null; }

export function FileStation() {
  const { addNotification } = useSystemStore();
  const [fs, setFs] = useState<FS>(INITIAL_FS);
  const [cwd, setCwd] = useState('/');
  const [history, setHistory] = useState(['/']);
  const [histIdx, setHistIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const renameRef = useRef<HTMLInputElement>(null);

  const items = (fs[cwd] ?? []).filter((i) =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  );

  const navigate = (path: string) => {
    const newHistory = [...history.slice(0, histIdx + 1), path];
    setHistory(newHistory);
    setHistIdx(newHistory.length - 1);
    setCwd(path);
    setSelected(null);
    setSearch('');
    setCtxMenu(null);
  };

  const goBack    = () => { if (histIdx > 0) { setHistIdx(i => i - 1); setCwd(history[histIdx - 1]); } };
  const goForward = () => { if (histIdx < history.length - 1) { setHistIdx(i => i + 1); setCwd(history[histIdx + 1]); } };

  const handleOpen = (item: FileItem) => {
    if (item.type === 'folder') {
      const path = `${cwd === '/' ? '' : cwd}/${item.name}`;
      navigate(fs[path] !== undefined ? path : cwd);
    }
  };

  // Context menu
  const openCtx = (e: React.MouseEvent, item: FileItem | null) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, item });
  };
  const closeCtx = () => setCtxMenu(null);

  // New folder
  const createFolder = () => {
    const base = 'Nueva carpeta';
    let name = base;
    let i = 1;
    const current = fs[cwd] ?? [];
    while (current.some((f) => f.name === name)) { name = `${base} (${i++})`; }
    setFs((prev) => ({ ...prev, [cwd]: [...(prev[cwd] ?? []), { id: mkId(), name, type: 'folder', modified: new Date().toLocaleDateString('es-ES') }] }));
    addNotification('Carpeta creada', `"${name}" creada en ${cwd}`, 'success');
    closeCtx();
  };

  // Rename
  const startRename = (item: FileItem) => {
    setRenameId(item.id);
    setRenameVal(item.name);
    closeCtx();
    setTimeout(() => renameRef.current?.select(), 50);
  };

  const commitRename = useCallback(() => {
    if (!renameId || !renameVal.trim()) { setRenameId(null); return; }
    setFs((prev) => ({
      ...prev,
      [cwd]: (prev[cwd] ?? []).map((f) =>
        f.id === renameId ? { ...f, name: renameVal.trim() } : f
      ),
    }));
    setRenameId(null);
  }, [renameId, renameVal, cwd]);

  // Delete
  const deleteItem = (item: FileItem) => {
    setFs((prev) => ({ ...prev, [cwd]: (prev[cwd] ?? []).filter((f) => f.id !== item.id) }));
    addNotification('Eliminado', `"${item.name}" ha sido eliminado`, 'warning');
    setSelected(null);
    closeCtx();
  };

  // Copy name
  const copyName = (item: FileItem) => {
    navigator.clipboard.writeText(item.name).catch(() => {});
    addNotification('Copiado', `"${item.name}" copiado al portapapeles`, 'info');
    closeCtx();
  };

  const sidebarItems = [
    { label: 'Inicio',     icon: <Home size={14} />,     path: '/' },
    { label: 'Documentos', icon: <FileText size={14} />, path: '/Documentos' },
    { label: 'Descargas',  icon: <Download size={14} />, path: '/Descargas' },
    { label: 'Imágenes',   icon: <Image size={14} />,   path: '/Imágenes' },
    { label: 'Música',    icon: <Music size={14} />,   path: '/Música' },
    { label: 'Videos',     icon: <Video size={14} />,    path: '/Videos' },
    { label: 'Papelera',   icon: <Trash2 size={14} />,   path: '/papelera' },
  ];

  const selItem = items.find((i) => i.id === selected);

  return (
    <div className="fs" onClick={closeCtx}>
      {/* Sidebar */}
      <aside className="fs__sidebar">
        <div className="fs__sidebar-section">
          <span className="fs__sidebar-title">FAVORITOS</span>
          {sidebarItems.map((s) => (
            <button
              key={s.path}
              className={`fs__sidebar-item ${cwd === s.path ? 'fs__sidebar-item--active' : ''}`}
              onClick={() => navigate(s.path)}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
        <div className="fs__sidebar-section">
          <span className="fs__sidebar-title">DISPOSITIVOS</span>
          <button className="fs__sidebar-item" onClick={() => navigate('/')}>
            <HardDrive size={14} />
            Disco Principal
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>500 GB</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="fs__main">
        {/* Toolbar */}
        <div className="fs__toolbar">
          <button className="fs__btn" onClick={goBack} disabled={histIdx === 0} title="Atrás">
            <ArrowLeft size={14} />
          </button>
          <button className="fs__btn" onClick={goForward} disabled={histIdx >= history.length - 1} title="Adelante">
            <ArrowRight size={14} />
          </button>
          <button className="fs__btn" title="Actualizar" onClick={() => setSearch('')}>
            <RefreshCw size={13} />
          </button>

          {/* Breadcrumb */}
          <div className="fs__breadcrumb">
            {cwd === '/' ? (
              <span className="fs__bread-item">Inicio</span>
            ) : cwd.split('/').filter(Boolean).map((seg, i, arr) => {
              const path = '/' + arr.slice(0, i + 1).join('/');
              return (
                <span key={path} className="flex items-center gap-1">
                  <ChevronRight size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <button className="fs__bread-item" onClick={() => navigate(path)}>{seg}</button>
                </span>
              );
            })}
          </div>

          <div className="fs__toolbar-right">
            {/* Search */}
            <div className="fs__search-wrap">
              <Search size={12} className="fs__search-icon" />
              <input
                className="fs__search"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="fs__btn" title="Subir archivo">
              <Upload size={13} />
            </button>
            <button className="fs__btn fs__btn--primary" onClick={createFolder} title="Nueva carpeta">
              <FolderPlus size={13} /> Nueva carpeta
            </button>
            <div className="fs__view-toggle">
              <button
                className={`fs__btn ${viewMode === 'list' ? 'fs__btn--active' : ''}`}
                onClick={() => setViewMode('list')} title="Lista"
              >
                <List size={13} />
              </button>
              <button
                className={`fs__btn ${viewMode === 'grid' ? 'fs__btn--active' : ''}`}
                onClick={() => setViewMode('grid')} title="Cuadrícula"
              >
                <Grid size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* File area */}
        {viewMode === 'list' ? (
          <div className="fs__list" onContextMenu={(e) => openCtx(e, null)}>
            <div className="fs__list-header">
              <span>Nombre</span>
              <span>Tamaño</span>
              <span>Modificado</span>
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                className={`fs__list-row ${selected === item.id ? 'fs__list-row--selected' : ''}`}
                onClick={(e) => { e.stopPropagation(); setSelected(item.id); }}
                onDoubleClick={() => handleOpen(item)}
                onContextMenu={(e) => openCtx(e, item)}
              >
                <span className="fs__list-name">
                  {getFileIcon(item)}
                  {renameId === item.id ? (
                    <input
                      ref={renameRef}
                      className="fs__rename-input"
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setRenameId(null);
                        e.stopPropagation();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <span className="fs__list-name-text">{item.name}</span>
                  )}
                </span>
                <span className="fs__list-size">{item.size ?? '—'}</span>
                <span className="fs__list-date">{item.modified ?? '—'}</span>
              </div>
            ))}
            {items.length === 0 && (
              <div className="fs__empty">
                {search ? `Sin resultados para "${search}"` : 'Carpeta vacía'}
              </div>
            )}
          </div>
        ) : (
          <div className="fs__grid" onContextMenu={(e) => openCtx(e, null)}>
            {items.map((item) => (
              <div
                key={item.id}
                className={`fs__grid-item ${selected === item.id ? 'fs__grid-item--selected' : ''}`}
                onClick={(e) => { e.stopPropagation(); setSelected(item.id); }}
                onDoubleClick={() => handleOpen(item)}
                onContextMenu={(e) => openCtx(e, item)}
              >
                <span className="fs__grid-icon">{getFileIconLg(item)}</span>
                {renameId === item.id ? (
                  <input
                    ref={renameRef}
                    className="fs__rename-input"
                    value={renameVal}
                    onChange={(e) => setRenameVal(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setRenameId(null);
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <span className="fs__grid-name">{item.name}</span>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <div className="fs__empty" style={{ gridColumn: '1 / -1' }}>
                {search ? `Sin resultados para "${search}"` : 'Carpeta vacía'}
              </div>
            )}
          </div>
        )}

        {/* Status bar */}
        <div className="fs__statusbar">
          <span>
            {selItem
              ? `Seleccionado: ${selItem.name}${selItem.size ? ` · ${selItem.size}` : ''}`
              : `${items.length} elemento${items.length !== 1 ? 's' : ''}`
            }
          </span>
          {search && <span className="fs__statusbar-filter">🔍 Filtrando: "{search}"</span>}
        </div>
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <div
          className="fs__ctx"
          style={{
            left: Math.min(ctxMenu.x, window.innerWidth - 200),
            top: Math.min(ctxMenu.y, window.innerHeight - 250),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {ctxMenu.item ? (
            <>
              <div className="fs__ctx-header">
                {getFileIcon(ctxMenu.item)}
                <span className="fs__ctx-name">{ctxMenu.item.name}</span>
              </div>
              <div className="fs__ctx-sep" />
              {ctxMenu.item.type === 'folder' && (
                <button className="fs__ctx-item" onClick={() => { handleOpen(ctxMenu.item!); closeCtx(); }}>
                  <Folder size={13} /> Abrir
                </button>
              )}
              <button className="fs__ctx-item" onClick={() => startRename(ctxMenu.item!)}>
                <Edit3 size={13} /> Renombrar
              </button>
              <button className="fs__ctx-item" onClick={() => copyName(ctxMenu.item!)}>
                <Copy size={13} /> Copiar nombre
              </button>
              <button className="fs__ctx-item" onClick={() => { addNotification('Descarga', `Descargando ${ctxMenu.item!.name}...`, 'info'); closeCtx(); }}>
                <Download size={13} /> Descargar
              </button>
              <div className="fs__ctx-sep" />
              <button className="fs__ctx-item" onClick={() => {}}>  
                <Info size={13} /> Propiedades
              </button>
              <div className="fs__ctx-sep" />
              <button className="fs__ctx-item fs__ctx-item--danger" onClick={() => deleteItem(ctxMenu.item!)}>
                <Trash2 size={13} /> Eliminar
              </button>
            </>
          ) : (
            <>
              <button className="fs__ctx-item" onClick={createFolder}>
                <FolderPlus size={13} /> Nueva carpeta
              </button>
              <button className="fs__ctx-item" onClick={() => { addNotification('Subir archivo', 'Función disponible en versión completa', 'info'); closeCtx(); }}>
                <Upload size={13} /> Subir archivo
              </button>
              <div className="fs__ctx-sep" />
              <button className="fs__ctx-item" onClick={() => setSearch('')}>
                <RefreshCw size={13} /> Actualizar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Legacy FS data removed - superseded by INITIAL_FS above

const _FS_UNUSED: Record<string, { name: string; type: string }[]> = {
  '/': [
    { name: 'home', type: 'folder' },
    { name: 'Documentos', type: 'folder' },
    { name: 'Descargas', type: 'folder' },
    { name: 'Imágenes', type: 'folder' },
    { name: 'Música', type: 'folder' },
    { name: 'Videos', type: 'folder' },
    { name: 'README.txt', type: 'file', size: '1.2 KB', modified: '16/06/2025' },
  ],
  '/home': [
    { name: 'admin', type: 'folder' },
    { name: 'lgm', type: 'folder' },
  ],
  '/Documentos': [
    { name: 'Informe_Anual.pdf', type: 'file', size: '2.4 MB', modified: '10/06/2025' },
    { name: 'Presupuesto.xlsx', type: 'file', size: '340 KB', modified: '08/06/2025' },
    { name: 'Notas.txt', type: 'file', size: '4 KB', modified: '15/06/2025' },
    { name: 'Proyectos', type: 'folder' },
  ],
  '/Descargas': [
    { name: 'debian-12.iso', type: 'file', size: '3.7 GB', modified: '01/06/2025' },
    { name: 'setup.exe', type: 'file', size: '128 MB', modified: '05/06/2025' },
  ],
  '/Imágenes': [
    { name: 'fondo.jpg', type: 'file', size: '4.1 MB', modified: '12/06/2025' },
    { name: 'captura.png', type: 'file', size: '820 KB', modified: '14/06/2025' },
    { name: 'Vacaciones', type: 'folder' },
  ],
};

export function FileStation() {
  const [cwd, setCwd] = useState('/');
  const [history, setHistory] = useState(['/']);
  const [histIdx, setHistIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selected, setSelected] = useState<string | null>(null);

  const items = FS[cwd] ?? [];

  const navigate = (path: string) => {
    const newHistory = [...history.slice(0, histIdx + 1), path];
    setHistory(newHistory);
    setHistIdx(newHistory.length - 1);
    setCwd(path);
    setSelected(null);
  };

  const goBack = () => {
    if (histIdx > 0) {
      setHistIdx((i) => i - 1);
      setCwd(history[histIdx - 1]);
    }
  };

  const goForward = () => {
    if (histIdx < history.length - 1) {
      setHistIdx((i) => i + 1);
      setCwd(history[histIdx + 1]);
    }
  };

  const handleOpen = (item: FileItem) => {
    if (item.type === 'folder') {
      navigate(`${cwd === '/' ? '' : cwd}/${item.name}`);
    }
  };

  const sidebarItems = [
    { label: 'Inicio', icon: <Home size={14} />, path: '/' },
    { label: 'Documentos', icon: <Folder size={14} />, path: '/Documentos' },
    { label: 'Descargas', icon: <Download size={14} />, path: '/Descargas' },
    { label: 'Imágenes', icon: <Grid size={14} />, path: '/Imágenes' },
    { label: 'Papelera', icon: <Trash2 size={14} />, path: '/papelera' },
  ];

  return (
    <div className="fs">
      {/* Sidebar */}
      <aside className="fs__sidebar">
        <div className="fs__sidebar-section">
          <span className="fs__sidebar-title">FAVORITOS</span>
          {sidebarItems.map((s) => (
            <button
              key={s.path}
              className={`fs__sidebar-item ${cwd === s.path ? 'fs__sidebar-item--active' : ''}`}
              onClick={() => navigate(s.path)}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        <div className="fs__sidebar-section">
          <span className="fs__sidebar-title">UNIDADES</span>
          <button className="fs__sidebar-item" onClick={() => navigate('/')}>
            <HardDrive size={14} />
            Disco Principal (500 GB)
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="fs__main">
        {/* Toolbar */}
        <div className="fs__toolbar">
          <button className="fs__btn" onClick={goBack} disabled={histIdx === 0} title="Atrás">
            <ArrowLeft size={15} />
          </button>
          <button className="fs__btn" onClick={goForward} disabled={histIdx >= history.length - 1} title="Adelante">
            <ArrowRight size={15} />
          </button>
          <button className="fs__btn" title="Actualizar">
            <RefreshCw size={14} />
          </button>

          <div className="fs__breadcrumb">
            {cwd.split('/').filter(Boolean).length === 0
              ? <span className="fs__bread-item">Inicio</span>
              : cwd.split('/').filter(Boolean).map((seg, i, arr) => {
                  const path = '/' + arr.slice(0, i + 1).join('/');
                  return (
                    <span key={path} className="flex items-center gap-2">
                      <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                      <button className="fs__bread-item" onClick={() => navigate(path)}>{seg}</button>
                    </span>
                  );
                })
            }
          </div>

          <div className="fs__toolbar-right">
            <button className="fs__btn" title="Subir archivo">
              <Upload size={14} />
            </button>
            <button className="fs__btn fs__btn--primary" title="Nueva carpeta">
              <Plus size={14} /> Carpeta
            </button>
            <button
              className={`fs__btn ${viewMode === 'grid' ? 'fs__btn--active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista cuadrícula"
            >
              <Grid size={14} />
            </button>
            <button
              className={`fs__btn ${viewMode === 'list' ? 'fs__btn--active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vista lista"
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* File area */}
        {viewMode === 'list' ? (
          <div className="fs__list">
            <div className="fs__list-header">
              <span>Nombre</span>
              <span>Tamaño</span>
              <span>Modificado</span>
            </div>
            {items.map((item) => (
              <div
                key={item.name}
                className={`fs__list-row ${selected === item.name ? 'fs__list-row--selected' : ''}`}
                onClick={() => setSelected(item.name)}
                onDoubleClick={() => handleOpen(item)}
              >
                <span className="fs__list-name">
                  {item.type === 'folder' ? <Folder size={15} style={{ color: '#f59e0b' }} /> : <File size={15} style={{ color: '#6b7280' }} />}
                  {item.name}
                </span>
                <span className="fs__list-size">{item.size ?? '—'}</span>
                <span className="fs__list-date">{item.modified ?? '—'}</span>
              </div>
            ))}
            {items.length === 0 && (
              <div className="fs__empty">Carpeta vacía</div>
            )}
          </div>
        ) : (
          <div className="fs__grid">
            {items.map((item) => (
              <div
                key={item.name}
                className={`fs__grid-item ${selected === item.name ? 'fs__grid-item--selected' : ''}`}
                onClick={() => setSelected(item.name)}
                onDoubleClick={() => handleOpen(item)}
              >
                <span className="fs__grid-icon">
                  {item.type === 'folder' ? '📁' : '📄'}
                </span>
                <span className="fs__grid-name">{item.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Status bar */}
        <div className="fs__statusbar">
          {selected ? `Seleccionado: ${selected}` : `${items.length} elementos`}
        </div>
      </div>
    </div>
  );
}
