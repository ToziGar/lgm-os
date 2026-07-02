import { useState, useMemo } from 'react';
import {
  Image, Folder, Search, Grid, List, Clock, Heart, Share2,
  Trash2, Download, RotateCcw, Info, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, X, Star, Edit3,
} from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import './PhotoStation.css';

interface Photo {
  id: string;
  name: string;
  album: string;
  date: string;
  size: string;
  resolution: string;
  camera: string;
  iso: number;
  aperture: string;
  ss: string;
  focal: string;
  cover: string;
  favorite: boolean;
  width: number;
  height: number;
}

interface Album {
  id: string;
  name: string;
  cover: string;
  count: number;
  date: string;
}

const ALBUMS: Album[] = [
  { id: 'vacations', name: 'Vacaciones 2025', cover: 'linear-gradient(135deg,#f97316,#ec4899)', count: 24, date: 'Jun 2025' },
  { id: 'family', name: 'Familia', cover: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', count: 18, date: 'May 2025' },
  { id: 'nature', name: 'Naturaleza', cover: 'linear-gradient(135deg,#10b981,#059669)', count: 12, date: 'Abr 2025' },
  { id: 'travel', name: 'Viajes', cover: 'linear-gradient(135deg,#f59e0b,#d97706)', count: 9, date: 'Mar 2025' },
  { id: 'pets', name: 'Mascotas', cover: 'linear-gradient(135deg,#ec4899,#be123c)', count: 7, date: 'Feb 2025' },
  { id: 'events', name: 'Eventos', cover: 'linear-gradient(135deg,#6366f1,#4338ca)', count: 15, date: 'Ene 2025' },
];

const PHOTOS: Photo[] = [
  { id: 'p1', name: 'Playa_del_Sol.jpg', album: 'vacations', date: '15/06/2025', size: '4.2 MB', resolution: '6000×4000', camera: 'Sony A7 IV', iso: 100, aperture: 'f/8', ss: '1/250', focal: '24mm', cover: 'linear-gradient(135deg,#0ea5e9,#06b6d4,#0891b2)', favorite: true, width: 6000, height: 4000 },
  { id: 'p2', name: 'Atardecer_Montaña.jpg', album: 'vacations', date: '14/06/2025', size: '3.8 MB', resolution: '6000×4000', camera: 'Sony A7 IV', iso: 200, aperture: 'f/11', ss: '1/125', focal: '70mm', cover: 'linear-gradient(135deg,#f97316,#ec4899,#7c3aed)', favorite: false, width: 6000, height: 4000 },
  { id: 'p3', name: 'Retrato_Familiar.jpg', album: 'family', date: '12/05/2025', size: '5.1 MB', resolution: '6000×4000', camera: 'Sony A7 IV', iso: 400, aperture: 'f/2.8', ss: '1/200', focal: '85mm', cover: 'linear-gradient(135deg,#3b82f6,#6366f1,#8b5cf6)', favorite: true, width: 6000, height: 4000 },
  { id: 'p4', name: 'Cascada_Bosque.jpg', album: 'nature', date: '20/04/2025', size: '4.5 MB', resolution: '6000×4000', camera: 'Sony A7 IV', iso: 800, aperture: 'f/5.6', ss: '1/60', focal: '35mm', cover: 'linear-gradient(135deg,#059669,#10b981,#34d399)', favorite: false, width: 6000, height: 4000 },
  { id: 'p5', name: 'Atardecer_Playa.jpg', album: 'travel', date: '10/03/2025', size: '3.2 MB', resolution: '6000×4000', camera: 'iPhone 16 Pro', iso: 50, aperture: 'f/1.8', ss: '1/500', focal: '24mm', cover: 'linear-gradient(135deg,#f59e0b,#d97706,#b45309)', favorite: true, width: 6000, height: 4000 },
  { id: 'p6', name: 'Mi_Perro.jpg', album: 'pets', date: '05/02/2025', size: '2.8 MB', resolution: '4000×3000', camera: 'iPhone 16 Pro', iso: 200, aperture: 'f/2.4', ss: '1/120', focal: '50mm', cover: 'linear-gradient(135deg,#ec4899,#db2777,#be123c)', favorite: false, width: 4000, height: 3000 },
  { id: 'p7', name: 'Cena_Año_Nuevo.jpg', album: 'events', date: '01/01/2025', size: '4.0 MB', resolution: '6000×4000', camera: 'Sony A7 IV', iso: 6400, aperture: 'f/2.8', ss: '1/80', focal: '35mm', cover: 'linear-gradient(135deg,#6366f1,#4f46e5,#4338ca)', favorite: true, width: 6000, height: 4000 },
  { id: 'p8', name: 'Amanecer_Niebla.jpg', album: 'nature', date: '18/04/2025', size: '3.5 MB', resolution: '6000×4000', camera: 'Sony A7 IV', iso: 100, aperture: 'f/16', ss: '1/30', focal: '50mm', cover: 'linear-gradient(135deg,#78716c,#57534e,#44403c)', favorite: false, width: 6000, height: 4000 },
  { id: 'p9', name: 'Ciudad_Nocturna.jpg', album: 'travel', date: '15/03/2025', size: '4.8 MB', resolution: '6000×4000', camera: 'Sony A7 IV', iso: 3200, aperture: 'f/4', ss: '1/15', focal: '28mm', cover: 'linear-gradient(135deg,#1e3a5f,#1e40af,#312e81)', favorite: true, width: 6000, height: 4000 },
  { id: 'p10', name: 'Gato_Durmiendo.jpg', album: 'pets', date: '01/02/2025', size: '2.1 MB', resolution: '4000×3000', camera: 'iPhone 16 Pro', iso: 100, aperture: 'f/1.8', ss: '1/200', focal: '24mm', cover: 'linear-gradient(135deg,#f97316,#ea580c,#c2410c)', favorite: false, width: 4000, height: 3000 },
  { id: 'p11', name: 'Boda_Amigos.jpg', album: 'events', date: '20/01/2025', size: '6.2 MB', resolution: '6000×4000', camera: 'Sony A7 IV', iso: 2000, aperture: 'f/2.8', ss: '1/160', focal: '85mm', cover: 'linear-gradient(135deg,#d946ef,#c026d3,#a21caf)', favorite: true, width: 6000, height: 4000 },
  { id: 'p12', name: 'Puesta_Sol_Montaña.jpg', album: 'vacations', date: '13/06/2025', size: '3.9 MB', resolution: '6000×4000', camera: 'Sony A7 IV', iso: 100, aperture: 'f/10', ss: '1/250', focal: '24mm', cover: 'linear-gradient(135deg,#ef4444,#f97316,#f59e0b)', favorite: false, width: 6000, height: 4000 },
];

export function PhotoStation() {
  const { addNotification } = useSystemStore();
  const [view, setView] = useState<'albums' | 'photos'>('albums');
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [viewer, setViewer] = useState<Photo | null>(null);
  const [viewerIdx, setViewerIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showInfo, setShowInfo] = useState(false);

  const allPhotos = useMemo(() => {
    if (!search) return PHOTOS;
    return PHOTOS.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.album.toLowerCase().includes(search.toLowerCase()) ||
      p.camera.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const albumPhotos = useMemo(() => {
    if (!selectedAlbum) return allPhotos;
    return allPhotos.filter(p => p.album === selectedAlbum);
  }, [selectedAlbum, search]);

  const currentPhotos = selectedAlbum ? albumPhotos : allPhotos;

  const openAlbum = (albumId: string) => {
    setSelectedAlbum(albumId);
    setView('photos');
  };

  const openViewer = (photo: Photo) => {
    const idx = currentPhotos.findIndex(p => p.id === photo.id);
    setViewer(photo);
    setViewerIdx(idx);
    setZoom(1);
    setShowInfo(false);
  };

  const navigateViewer = (dir: number) => {
    const newIdx = viewerIdx + dir;
    if (newIdx >= 0 && newIdx < currentPhotos.length) {
      setViewerIdx(newIdx);
      setViewer(currentPhotos[newIdx]);
      setZoom(1);
      setShowInfo(false);
    }
  };

  const toggleFavorite = (photoId: string) => {
    addNotification('Favorito', 'Foto marcada como favorita', 'success');
  };

  return (
    <div className="ps">
      {/* Header */}
      <div className="ps__header">
        <div className="ps__header-left">
          {view === 'photos' && selectedAlbum && (
            <button className="ps__back" onClick={() => { setSelectedAlbum(null); setView('albums'); }}>
              <ChevronLeft size={16} />
            </button>
          )}
          <span className="ps__title">
            {view === 'albums' ? 'Photo Station' : ALBUMS.find(a => a.id === selectedAlbum)?.name ?? 'Fotos'}
          </span>
          <span className="ps__count">
            {view === 'albums' ? `${ALBUMS.length} álbumes` : `${currentPhotos.length} fotos`}
          </span>
        </div>
        <div className="ps__header-right">
          {view === 'photos' && (
            <div className="ps__search-wrap">
              <Search size={13} className="ps__search-icon" />
              <input className="ps__search" placeholder="Buscar fotos..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          )}
          <div className="ps__view-toggle">
            <button className={`ps__view-btn ${viewMode === 'grid' ? 'ps__view-btn--active' : ''}`} onClick={() => setViewMode('grid')}>
              <Grid size={14} />
            </button>
            <button className={`ps__view-btn ${viewMode === 'list' ? 'ps__view-btn--active' : ''}`} onClick={() => setViewMode('list')}>
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="ps__content">
        {/* Albums view */}
        {view === 'albums' && (
          <div className="ps__albums-grid">
            {ALBUMS.map(album => (
              <div key={album.id} className="ps__album-card" onClick={() => openAlbum(album.id)}>
                <div className="ps__album-cover" style={{ background: album.cover }}>
                  <Image size={32} style={{ color: 'rgba(255,255,255,0.6)' }} />
                </div>
                <div className="ps__album-info">
                  <span className="ps__album-name">{album.name}</span>
                  <span className="ps__album-count">{album.count} fotos · {album.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Photos view */}
        {view === 'photos' && (
          <>
            {viewMode === 'grid' ? (
              <div className="ps__photos-grid">
                {currentPhotos.map(photo => (
                  <div key={photo.id} className="ps__photo-card" onClick={() => openViewer(photo)}>
                    <div className="ps__photo-thumb" style={{ background: photo.cover }}>
                      <Image size={28} style={{ color: 'rgba(255,255,255,0.4)' }} />
                      {photo.favorite && <Heart size={12} fill="#ef4444" stroke="#ef4444" className="ps__fav-badge" />}
                    </div>
                    <div className="ps__photo-info">
                      <span className="ps__photo-name">{photo.name}</span>
                      <span className="ps__photo-date">{photo.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ps__photos-list">
                <div className="ps__list-header">
                  <span>Nombre</span><span>Fecha</span><span>Tamaño</span><span>Resolución</span><span>Cámara</span><span></span>
                </div>
                {currentPhotos.map(photo => (
                  <div key={photo.id} className="ps__list-row" onClick={() => openViewer(photo)}>
                    <div className="ps__list-name">
                      <span className="ps__list-thumb" style={{ background: photo.cover }}>
                        <Image size={12} style={{ color: 'rgba(255,255,255,0.5)' }} />
                      </span>
                      <span>{photo.name}</span>
                      {photo.favorite && <Heart size={10} fill="#ef4444" stroke="#ef4444" />}
                    </div>
                    <span>{photo.date}</span>
                    <span>{photo.size}</span>
                    <span>{photo.resolution}</span>
                    <span>{photo.camera}</span>
                    <button className="ps__icon-btn" onClick={e => { e.stopPropagation(); toggleFavorite(photo.id); }}>
                      <Star size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Photo viewer */}
      {viewer && (
        <div className="ps__viewer-overlay" onClick={() => setViewer(null)}>
          <div className="ps__viewer" onClick={e => e.stopPropagation()}>
            {/* Viewer toolbar */}
            <div className="ps__viewer-bar">
              <div className="ps__viewer-bar-left">
                <span className="ps__viewer-filename">{viewer.name}</span>
                <span className="ps__viewer-counter">{viewerIdx + 1} / {currentPhotos.length}</span>
              </div>
              <div className="ps__viewer-bar-actions">
                <button className="ps__vbtn" onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} title="Reducir"><ZoomOut size={14} /></button>
                <span className="ps__zoom-pct">{Math.round(zoom * 100)}%</span>
                <button className="ps__vbtn" onClick={() => setZoom(z => Math.min(3, z + 0.25))} title="Ampliar"><ZoomIn size={14} /></button>
                <div className="ps__vsep" />
                <button className="ps__vbtn" onClick={() => setShowInfo(v => !v)} title="Info EXIF"><Info size={14} /></button>
                <button className="ps__vbtn" onClick={() => toggleFavorite(viewer.id)} title="Favorito"><Heart size={14} /></button>
                <button className="ps__vbtn" title="Descargar"><Download size={14} /></button>
                <button className="ps__vbtn" title="Eliminar"><Trash2 size={14} /></button>
                <div className="ps__vsep" />
                <button className="ps__vbtn ps__vbtn--close" onClick={() => setViewer(null)}><X size={16} /></button>
              </div>
            </div>

            {/* Image area */}
            <div className="ps__viewer-body">
              {viewerIdx > 0 && (
                <button className="ps__nav-btn ps__nav-btn--prev" onClick={() => navigateViewer(-1)}>
                  <ChevronLeft size={24} />
                </button>
              )}
              <div className="ps__viewer-img-wrap" style={{ transform: `scale(${zoom})` }}>
                <div className="ps__viewer-img" style={{ background: viewer.cover }}>
                  <Image size={64} style={{ color: 'rgba(255,255,255,0.3)' }} />
                </div>
              </div>
              {viewerIdx < currentPhotos.length - 1 && (
                <button className="ps__nav-btn ps__nav-btn--next" onClick={() => navigateViewer(1)}>
                  <ChevronRight size={24} />
                </button>
              )}
            </div>

            {/* EXIF info panel */}
            {showInfo && (
              <div className="ps__exif">
                <div className="ps__exif-group">
                  <span className="ps__exif-title">Archivo</span>
                  <div className="ps__exif-row"><span>Nombre</span><span>{viewer.name}</span></div>
                  <div className="ps__exif-row"><span>Tamaño</span><span>{viewer.size}</span></div>
                  <div className="ps__exif-row"><span>Resolución</span><span>{viewer.resolution}</span></div>
                  <div className="ps__exif-row"><span>Fecha</span><span>{viewer.date}</span></div>
                </div>
                <div className="ps__exif-group">
                  <span className="ps__exif-title">Cámara</span>
                  <div className="ps__exif-row"><span>Modelo</span><span>{viewer.camera}</span></div>
                  <div className="ps__exif-row"><span>ISO</span><span>{viewer.iso}</span></div>
                  <div className="ps__exif-row"><span>Apertura</span><span>{viewer.aperture}</span></div>
                  <div className="ps__exif-row"><span>Velocidad</span><span>{viewer.ss}</span></div>
                  <div className="ps__exif-row"><span>Focal</span><span>{viewer.focal}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}