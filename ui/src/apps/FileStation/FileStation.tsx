import { useState } from 'react';
import {
  ChevronRight, Folder, File, HardDrive, Home, Trash2,
  Upload, Download, Plus, Grid, List, ArrowLeft, ArrowRight, RefreshCw,
} from 'lucide-react';
import type { FileItem } from '../../types';
import './FileStation.css';

const FS: Record<string, FileItem[]> = {
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
