import { useState, useRef, useEffect } from 'react';
import {
  FileText, Plus, Trash2, Edit3, Search, Tag, Star, Archive,
  X, Check, Bold, Italic, List, Heading, Image, Link,
  Undo, Redo, File, Clock, MoreHorizontal, ChevronRight,
} from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import './NoteStation.css';

interface Notebook {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface Note {
  id: string;
  notebookId: string;
  title: string;
  content: string;
  tags: string[];
  favorite: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

const NOTEBOOKS: Notebook[] = [
  { id: 'nb-general', name: 'General', icon: '📝', count: 4 },
  { id: 'nb-work', name: 'Trabajo', icon: '💼', count: 3 },
  { id: 'nb-personal', name: 'Personal', icon: '❤️', count: 2 },
  { id: 'nb-ideas', name: 'Ideas', icon: '💡', count: 1 },
  { id: 'nb-tech', name: 'Tecnología', icon: '⚙️', count: 2 },
];

const INITIAL_NOTES: Note[] = [
  { id: 'n1', notebookId: 'nb-general', title: 'Bienvenido a Note Station', content: `# Bienvenido a Note Station\n\nNote Station es tu bloc de notas integrado en LGM OS.\n\n## Funcionalidades\n\n- **Formato Markdown** — Escribe con formato enriquecido\n- **Múltiples libretas** — Organiza tus notas por temas\n- **Etiquetas** — Categoriza y encuentra rápido\n- **Favoritos** — Marca tus notas importantes\n- **Búsqueda** — Encuentra cualquier nota al instante\n\n> "El conocimiento es poder." — Francis Bacon\n\nPuedes usar **negrita**, *cursiva*, listas, tablas y más.`, tags: ['bienvenida', 'intro'], favorite: true, archived: false, createdAt: '2025-06-10', updatedAt: '2025-06-16' },
  { id: 'n2', notebookId: 'nb-general', title: 'Lista de tareas pendientes', content: `## Tareas Pendientes\n\n- [ ] Revisar configuración RAID del Volumen 2\n- [ ] Actualizar firmware de discos Seagate\n- [x] Configurar backup automático semanal\n- [ ] Migrar Nextcloud a Docker\n- [x] Instalar certificado SSL\n- [ ] Crear usuario para invitados\n- [ ] Configurar alertas SMART\n\n### En progreso\n- Renovar dominio lgm-nas-01.local\n- Actualizar paquetes del sistema`, tags: ['tareas', 'sistema'], favorite: false, archived: false, createdAt: '2025-06-01', updatedAt: '2025-06-15' },
  { id: 'n3', notebookId: 'nb-work', title: 'Plan de migración NAS', content: `## Plan de Migración NAS\n\n### Objetivo\nMigrar datos del Volumen 2 (RAID 1 degradado) a nuevo pool ZFS.\n\n### Pasos\n\n1. **Evaluación** (Completado)\n   - Verificar estado de discos actuales\n   - Estimar tiempo de transferencia: ~12h para 5TB\n\n2. **Preparación**\n   - Adquirir 2x WD Red Pro 8TB\n   - Montar en bahías 5 y 6\n\n3. **Ejecución**\n   - rsync -avh /volume2/ /tank/data/\n   - Verificar integridad con checksums\n\n4. **Post-migración**\n   - Desmontar volumen antiguo\n   - Actualizar docker-compose.yml`, tags: ['migracion', 'storage', 'plan'], favorite: true, archived: false, createdAt: '2025-06-05', updatedAt: '2025-06-14' },
  { id: 'n4', notebookId: 'nb-work', title: 'Comandos útiles Docker', content: `## Comandos Docker Útiles\n\n\`\`\`bash\n# Ver logs de un contenedor en tiempo real\ndocker logs -f nginx\n\n# Ejecutar bash dentro de un contenedor\ndocker exec -it mariadb bash\n\n# Limpiar recursos no usados\ndocker system prune -a\n\n# Ver stats en vivo\ndocker stats\n\n# Copiar archivos del contenedor al host\ndocker cp contenedor:/ruta/archivo ./destino\n\`\`\`\n\n### Aliases recomendados\n\n\`\`\`bash\nalias dlogs='docker logs -f'\nalias dexec='docker exec -it'\nalias dprune='docker system prune -a'\n\`\`\``, tags: ['docker', 'howto'], favorite: false, archived: false, createdAt: '2025-06-08', updatedAt: '2025-06-13' },
  { id: 'n5', notebookId: 'nb-personal', title: 'Recetas favoritas', content: `## 🍝 Pasta Carbonara\n\n### Ingredientes\n- 400g spaghetti\n- 200g panceta\n- 4 yemas de huevo\n- Pecorino romano q.s.\n- Pimienta negra\n\n### Preparación\n1. Cocer pasta al dente\n2. Dorar panceta hasta que esté crujiente\n3. Mezclar yemas con queso rallado\n4. Fuera del fuego, mezclar todo\n5. Servir con pimienta recién molida\n\n> Pro tip: NO uses nata. La carbonara auténtica lleva solo huevo y queso.`, tags: ['cocina', 'recetas'], favorite: true, archived: false, createdAt: '2025-05-20', updatedAt: '2025-06-12' },
  { id: 'n6', notebookId: 'nb-tech', title: 'Configuración WireGuard', content: `## Configuración WireGuard Server\n\n### wg0.conf\n\`\`\`ini\n[Interface]\nAddress = 10.8.0.1/24\nPrivateKey = [SERVER_PRIVATE_KEY]\nListenPort = 51820\n\n# Cliente - admin\n[Peer]\nPublicKey = [CLIENT_PUBLIC_KEY]\nAllowedIPs = 10.8.0.2/32\n\`\`\`\n\n### Comandos útiles\n\`\`\`bash\n# Iniciar interfaz\nwg-quick up wg0\n\n# Ver estado\nwg show\n\n# Generar claves\nwg genkey | tee privatekey | wg pubkey > publickey\n\`\`\``, tags: ['vpn', 'wireguard', 'config'], favorite: false, archived: false, createdAt: '2025-06-03', updatedAt: '2025-06-11' },
  { id: 'n7', notebookId: 'nb-ideas', title: 'Ideas para el homelab', content: `## 🏠 Ideas Homelab 2025\n\n- [ ] Kubernetes cluster con 3 Raspberry Pi 5\n- [ ] Servidor de Minecraft para los peques\n- [ ] Pihole + AdGuard en HA\n- [ ] Dashboard tipo Heimdall con estado de servicios\n- [ ] Backup a la nube con restic + Backblaze B2\n- [ ] Monitorizar temperatura del rack con ESP32\n- [ ] Automatizar luces con Home Assistant + Zigbee\n\n### Prioridades\n1. **Seguridad**: Implementar CrowdSec y Authelia\n2. **Monitorización**: Grafana + Prometheus completo\n3. **Redundancia**: Segundo ISP failover`, tags: ['homelab', 'ideas'], favorite: false, archived: false, createdAt: '2025-06-02', updatedAt: '2025-06-10' },
  { id: 'n8', notebookId: 'nb-tech', title: 'Cheatsheet ZFS', content: `## Comandos ZFS Esenciales\n\n### Pool\n\`\`\`bash\n# Ver estado del pool\nzpool status -v\n\n# Ver uso\nzpool list\n\n# Iniciar scrub\nzpool scrub tank\n\`\`\`\n\n### Datasets\n\`\`\`bash\n# Listar datasets\nzfs list\n\n# Ver propiedad\nzfs get compression tank/data\n\n# Crear snapshot\nzfs snapshot tank/data@manual-$(date +%Y%m%d)\n\`\`\`\n\n### Rendimiento\n\`\`\`bash\n# Ver IOPS\nzpool iostat 1\n\n# Ver ARC stats\narc_summary\n\`\`\``, tags: ['zfs', 'cheatsheet'], favorite: false, archived: false, createdAt: '2025-05-15', updatedAt: '2025-06-09' },
  { id: 'n9', notebookId: 'nb-personal', title: 'Películas pendientes', content: `## 🎬 Watchlist 2025\n\n### Por ver\n- [ ] Dune: Part Three (2026)\n- [ ] The Batman 2\n- [ ] Blade Runner 2099\n- [ ] Mickey 17\n\n### Vistas recientemente\n- [x] Dune: Part Two ⭐⭐⭐⭐⭐\n- [x] Oppenheimer ⭐⭐⭐⭐⭐\n- [x] The Substance ⭐⭐⭐⭐\n- [x] Furiosa ⭐⭐⭐⭐`, tags: ['peliculas', 'ocio'], favorite: false, archived: false, createdAt: '2025-04-10', updatedAt: '2025-06-08' },
  { id: 'n10', notebookId: 'nb-work', title: 'Notas reunión equipo', content: `## Reunión Semanal — 16 Jun 2025\n\n**Asistentes:** Admin, Dev Team, Ops\n\n### Orden del día\n\n1. **Estado del proyecto LGM OS** ✅\n   - UI completo al 95%\n   - Faltan tests E2E\n\n2. **Incidencias**\n   - Disco d4 muestra sectores defectuosos (SMART warning)\n   - Programar reemplazo para próxima semana\n\n3. **Próximos pasos**\n   - Implementar Photo Station\n   - Mejorar rendimiento de búsqueda en File Station\n   - Preparar release 1.0.0-beta\n\n### Acciones\n@ops: Reemplazar disco d4\n@dev: Merge PR #142 (Photo Station)\n@all: Revisar documentación antes del release`, tags: ['reuniones', 'trabajo'], favorite: false, archived: false, createdAt: '2025-06-16', updatedAt: '2025-06-16' },
];

let nextNoteId = 100;

export function NoteStation() {
  const { addNotification } = useSystemStore();
  const [notebooks] = useState<Notebook[]>(NOTEBOOKS);
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [activeNotebook, setActiveNotebook] = useState<string>('nb-general');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleBuf, setTitleBuf] = useState('');

  const activeNote = notes.find(n => n.id === activeNoteId) ?? null;

  const filteredNotes = notes.filter(n => {
    if (showFavorites && !n.favorite) return false;
    if (showArchived && !n.archived) return false;
    if (!showArchived && n.archived) return false;
    if (n.notebookId !== activeNotebook && !showFavorites && !showArchived) return false;
    if (search) {
      const q = search.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.includes(q));
    }
    return true;
  });

  const createNote = () => {
    const id = `n${nextNoteId++}`;
    const note: Note = {
      id,
      notebookId: activeNotebook,
      title: 'Nueva nota',
      content: '## Nueva nota\n\nEscribe aquí tu contenido...',
      tags: [],
      favorite: false,
      archived: false,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setNotes(prev => [note, ...prev]);
    setActiveNoteId(id);
    addNotification('Nota creada', 'Nueva nota añadida', 'success');
  };

  const updateContent = (content: string) => {
    if (!activeNote) return;
    setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, content, updatedAt: new Date().toISOString().split('T')[0] } : n));
  };

  const toggleFavorite = () => {
    if (!activeNote) return;
    setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, favorite: !n.favorite } : n));
  };

  const toggleArchive = () => {
    if (!activeNote) return;
    setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, archived: !n.archived } : n));
    setActiveNoteId(null);
    addNotification(activeNote.archived ? 'Nota restaurada' : 'Nota archivada', activeNote.title, 'info');
  };

  const deleteNote = () => {
    if (!activeNote) return;
    setNotes(prev => prev.filter(n => n.id !== activeNote.id));
    setActiveNoteId(null);
    addNotification('Nota eliminada', activeNote.title, 'warning');
  };

  const commitTitle = () => {
    if (!activeNote || !titleBuf.trim()) return;
    setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, title: titleBuf.trim() } : n));
    setEditingTitle(false);
  };

  const tagColors: Record<string, string> = {
    'bienvenida': '#6366f1', 'intro': '#8b5cf6', 'tareas': '#10b981', 'sistema': '#0ea5e9',
    'migracion': '#f59e0b', 'storage': '#f97316', 'plan': '#3b82f6', 'docker': '#0ea5e9',
    'howto': '#6366f1', 'cocina': '#ec4899', 'recetas': '#d946ef', 'vpn': '#059669',
    'wireguard': '#059669', 'config': '#6b7280', 'homelab': '#14b8a6', 'ideas': '#14b8a6',
    'zfs': '#0284c7', 'cheatsheet': '#0284c7', 'peliculas': '#ef4444', 'ocio': '#ef4444',
    'reuniones': '#8b5cf6', 'trabajo': '#6366f1',
  };

  return (
    <div className="ns2">
      {/* Notebook sidebar */}
      <aside className="ns2__sidebar">
        <div className="ns2__sidebar-header">Note Station</div>
        <button className={`ns2__nav-item ${!activeNotebook && !showFavorites && !showArchived ? 'ns2__nav-item--active' : ''}`}
          onClick={() => { setActiveNotebook(''); setShowFavorites(false); setShowArchived(false); }}>
          <FileText size={14} /> Todas las notas <span className="ns2__count">{notes.length}</span>
        </button>
        <button className={`ns2__nav-item ${showFavorites ? 'ns2__nav-item--active' : ''}`}
          onClick={() => { setShowFavorites(true); setShowArchived(false); setActiveNotebook(''); }}>
          <Star size={14} /> Favoritas <span className="ns2__count">{notes.filter(n => n.favorite).length}</span>
        </button>
        <button className={`ns2__nav-item ${showArchived ? 'ns2__nav-item--active' : ''}`}
          onClick={() => { setShowArchived(true); setShowFavorites(false); setActiveNotebook(''); }}>
          <Archive size={14} /> Archivadas <span className="ns2__count">{notes.filter(n => n.archived).length}</span>
        </button>
        <div className="ns2__sidebar-divider" />
        <span className="ns2__sidebar-label">LIBRETAS</span>
        {notebooks.map(nb => (
          <button key={nb.id} className={`ns2__nav-item ${activeNotebook === nb.id ? 'ns2__nav-item--active' : ''}`}
            onClick={() => { setActiveNotebook(nb.id); setShowFavorites(false); setShowArchived(false); }}>
            <span>{nb.icon}</span> {nb.name} <span className="ns2__count">{n => notes.filter(n => n.notebookId === nb.id).length}</span>
          </button>
        ))}
        <div className="ns2__sidebar-footer">
          <span className="ns2__footer-text">{notes.filter(n => !n.archived).length} activas · {notes.filter(n => n.archived).length} archivadas</span>
        </div>
      </aside>

      {/* Note list */}
      <div className="ns2__list">
        <div className="ns2__list-header">
          <div className="ns2__search-wrap">
            <Search size={13} className="ns2__search-icon" />
            <input className="ns2__search" placeholder="Buscar notas..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="ns2__btn ns2__btn--primary" onClick={createNote}>
            <Plus size={13} /> Nueva nota
          </button>
        </div>
        <div className="ns2__notes-list">
          {filteredNotes.map(note => (
            <div key={note.id} className={`ns2__note-item ${activeNoteId === note.id ? 'ns2__note-item--active' : ''}`}
              onClick={() => setActiveNoteId(note.id)}>
              <div className="ns2__note-item-top">
                <span className="ns2__note-item-title">{note.title || 'Sin título'}</span>
                {note.favorite && <Star size={10} fill="#f59e0b" stroke="#f59e0b" />}
              </div>
              <div className="ns2__note-item-preview">{note.content.replace(/[#*`>\-\[\]]/g, '').slice(0, 80)}...</div>
              <div className="ns2__note-item-meta">
                <Clock size={10} />
                <span>{note.updatedAt}</span>
                {note.tags.slice(0, 2).map(t => (
                  <span key={t} className="ns2__tag" style={{ background: (tagColors[t] ?? '#6b7280') + '22', color: tagColors[t] ?? '#6b7280' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {filteredNotes.length === 0 && (
            <div className="ns2__empty">
              <FileText size={28} style={{ color: 'var(--text-muted)' }} />
              <p>No hay notas</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Crea una nueva nota para empezar</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="ns2__editor">
        {activeNote ? (
          <>
            <div className="ns2__editor-toolbar">
              <div className="ns2__editor-toolbar-left">
                {editingTitle ? (
                  <input className="ns2__title-input" value={titleBuf} autoFocus
                    onChange={e => setTitleBuf(e.target.value)}
                    onBlur={commitTitle}
                    onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                  />
                ) : (
                  <h2 className="ns2__editor-title" onDoubleClick={() => { setTitleBuf(activeNote.title); setEditingTitle(true); }}>
                    {activeNote.title}
                  </h2>
                )}
              </div>
              <div className="ns2__editor-toolbar-right">
                <button className={`ns2__etbtn ${activeNote.favorite ? 'ns2__etbtn--on' : ''}`} onClick={toggleFavorite} title="Favorito">
                  <Star size={14} />
                </button>
                <button className="ns2__etbtn" onClick={toggleArchive} title={activeNote.archived ? 'Restaurar' : 'Archivar'}>
                  <Archive size={14} />
                </button>
                <button className="ns2__etbtn ns2__etbtn--danger" onClick={deleteNote} title="Eliminar">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="ns2__editor-meta">
              <span>Creada: {activeNote.createdAt}</span>
              <span>Actualizada: {activeNote.updatedAt}</span>
              {activeNote.tags.map(t => (
                <span key={t} className="ns2__editor-tag" style={{ background: (tagColors[t] ?? '#6b7280') + '22', color: tagColors[t] ?? '#6b7280' }}>
                  <Tag size={10} /> {t}
                </span>
              ))}
            </div>

            <textarea
              className="ns2__textarea"
              value={activeNote.content}
              onChange={e => updateContent(e.target.value)}
              spellCheck={false}
            />
          </>
        ) : (
          <div className="ns2__editor-empty">
            <FileText size={40} style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Selecciona una nota o crea una nueva</p>
          </div>
        )}
      </div>
    </div>
  );
}