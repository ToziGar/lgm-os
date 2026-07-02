import { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Search, Heart, List, Shuffle, Repeat, Music,
  Clock, ChevronDown, ChevronUp, Plus, Trash2,
} from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import './MusicPlayer.css';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  durationSec: number;
  cover: string;
  genre: string;
  year: number;
  trackNum: number;
}

const PLAYLISTS = [
  { id: 'pl-all', name: 'Todas las canciones', icon: '🎵', count: 12 },
  { id: 'pl-fav', name: 'Favoritos', icon: '❤️', count: 5 },
  { id: 'pl-rock', name: 'Rock & Roll', icon: '🎸', count: 4 },
  { id: 'pl-jazz', name: 'Jazz & Blues', icon: '🎷', count: 3 },
  { id: 'pl-electro', name: 'Electrónica', icon: '🎧', count: 3 },
  { id: 'pl-classical', name: 'Clásica', icon: '🎻', count: 2 },
];

const TRACKS: Track[] = [
  { id: 't1', title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', duration: '5:55', durationSec: 355, cover: 'linear-gradient(135deg,#e63946,#f1faee)', genre: 'Rock', year: 1975, trackNum: 1 },
  { id: 't2', title: 'Take Five', artist: 'Dave Brubeck', album: 'Time Out', duration: '5:24', durationSec: 324, cover: 'linear-gradient(135deg,#457b9d,#1d3557)', genre: 'Jazz', year: 1959, trackNum: 2 },
  { id: 't3', title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', duration: '8:02', durationSec: 482, cover: 'linear-gradient(135deg,#8d0801,#f4a261)', genre: 'Rock', year: 1971, trackNum: 3 },
  { id: 't4', title: 'So What', artist: 'Miles Davis', album: 'Kind of Blue', duration: '9:22', durationSec: 562, cover: 'linear-gradient(135deg,#023e8a,#0077b6)', genre: 'Jazz', year: 1959, trackNum: 4 },
  { id: 't5', title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', duration: '6:30', durationSec: 390, cover: 'linear-gradient(135deg,#d4a373,#faedcd)', genre: 'Rock', year: 1976, trackNum: 5 },
  { id: 't6', title: 'Around the World', artist: 'Daft Punk', album: 'Discovery', duration: '7:09', durationSec: 429, cover: 'linear-gradient(135deg,#e85d04,#ffba08)', genre: 'Electrónica', year: 2001, trackNum: 6 },
  { id: 't7', title: 'Fly Me to the Moon', artist: 'Frank Sinatra', album: 'It Might as Well Be Swing', duration: '2:30', durationSec: 150, cover: 'linear-gradient(135deg,#2d6a4f,#52b788)', genre: 'Jazz', year: 1964, trackNum: 7 },
  { id: 't8', title: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind', duration: '5:01', durationSec: 301, cover: 'linear-gradient(135deg,#4a4e69,#22223b)', genre: 'Rock', year: 1991, trackNum: 8 },
  { id: 't9', title: 'Clair de Lune', artist: 'Claude Debussy', album: 'Suite Bergamasque', duration: '5:09', durationSec: 309, cover: 'linear-gradient(135deg,#1b4332,#40916c)', genre: 'Clásica', year: 1905, trackNum: 9 },
  { id: 't10', title: 'Get Lucky', artist: 'Daft Punk', album: 'Random Access Memories', duration: '6:09', durationSec: 369, cover: 'linear-gradient(135deg,#f77f00,#fcbf49)', genre: 'Electrónica', year: 2013, trackNum: 10 },
  { id: 't11', title: 'The Four Seasons - Spring', artist: 'Vivaldi', album: 'The Four Seasons', duration: '3:32', durationSec: 212, cover: 'linear-gradient(135deg,#2ecc71,#27ae60)', genre: 'Clásica', year: 1723, trackNum: 11 },
  { id: 't12', title: 'Strobe', artist: 'Deadmau5', album: 'For Lack of a Better Name', duration: '10:37', durationSec: 637, cover: 'linear-gradient(135deg,#6c5ce7,#a29bfe)', genre: 'Electrónica', year: 2009, trackNum: 12 },
];

export function MusicPlayer() {
  const { addNotification } = useSystemStore();
  const [search, setSearch] = useState('');
  const [activePlaylist, setActivePlaylist] = useState('pl-all');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'none' | 'all' | 'one'>('none');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['t1', 't5', 't7', 't8', 't10']));
  const progressInterval = useRef<number | null>(null);

  const filteredTracks = TRACKS.filter(t => {
    if (activePlaylist === 'pl-fav' && !favorites.has(t.id)) return false;
    if (activePlaylist === 'pl-rock' && t.genre !== 'Rock') return false;
    if (activePlaylist === 'pl-jazz' && t.genre !== 'Jazz') return false;
    if (activePlaylist === 'pl-electro' && t.genre !== 'Electrónica') return false;
    if (activePlaylist === 'pl-classical' && t.genre !== 'Clásica') return false;
    if (search) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.album.toLowerCase().includes(q);
    }
    return true;
  });

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setPlaying(true);
    setProgress(0);
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = window.setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          nextTrack();
          return 0;
        }
        return p + 100 / (track.durationSec * 10);
      });
    }, 100);
  };

  const togglePlay = () => {
    if (!currentTrack) {
      if (filteredTracks.length > 0) playTrack(filteredTracks[0]);
      return;
    }
    setPlaying(p => !p);
    if (playing && progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    } else if (!playing) {
      progressInterval.current = window.setInterval(() => {
        setProgress(p => {
          if (p >= 100) { nextTrack(); return 0; }
          return p + 100 / (currentTrack.durationSec * 10);
        });
      }, 100);
    }
  };

  const nextTrack = () => {
    const list = filteredTracks;
    if (list.length === 0) return;
    const idx = currentTrack ? list.findIndex(t => t.id === currentTrack.id) : -1;
    let nextIdx: number;
    if (repeat === 'one') nextIdx = idx;
    else if (shuffle) nextIdx = Math.floor(Math.random() * list.length);
    else nextIdx = (idx + 1) % list.length;
    playTrack(list[nextIdx]);
  };

  const prevTrack = () => {
    const list = filteredTracks;
    if (list.length === 0) return;
    const idx = currentTrack ? list.findIndex(t => t.id === currentTrack.id) : 0;
    const prevIdx = idx <= 0 ? list.length - 1 : idx - 1;
    playTrack(list[prevIdx]);
  };

  const toggleFavorite = (trackId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const currentSec = currentTrack ? (progress / 100) * currentTrack.durationSec : 0;

  return (
    <div className="mp">
      {/* Sidebar */}
      <aside className="mp__sidebar">
        <div className="mp__sidebar-header">
          <Music size={16} /> Música
        </div>
        {PLAYLISTS.map(pl => (
          <button key={pl.id} className={`mp__nav-item ${activePlaylist === pl.id ? 'mp__nav-item--active' : ''}`}
            onClick={() => setActivePlaylist(pl.id)}>
            <span>{pl.icon}</span>
            <span className="mp__nav-name">{pl.name}</span>
            <span className="mp__nav-count">{pl.count}</span>
          </button>
        ))}
      </aside>

      {/* Main content */}
      <div className="mp__main">
        {/* Header */}
        <div className="mp__header">
          <div className="mp__search-wrap">
            <Search size={13} className="mp__search-icon" />
            <input className="mp__search" placeholder="Buscar canciones, artistas, álbumes..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="mp__view-toggle">
            <button className={`mp__view-btn ${view === 'list' ? 'mp__view-btn--active' : ''}`} onClick={() => setView('list')}><List size={14} /></button>
            <button className={`mp__view-btn ${view === 'grid' ? 'mp__view-btn--active' : ''}`} onClick={() => setView('grid')}><Music size={14} /></button>
          </div>
        </div>

        {/* Track list */}
        <div className="mp__tracks">
          {view === 'list' ? (
            <div className="mp__track-list">
              <div className="mp__track-header">
                <span>#</span><span>Título</span><span>Artista</span><span>Álbum</span><span>Duración</span><span></span>
              </div>
              {filteredTracks.map((track, i) => (
                <div key={track.id} className={`mp__track-row ${currentTrack?.id === track.id ? 'mp__track-row--active' : ''}`}
                  onDoubleClick={() => playTrack(track)}>
                  <span className="mp__track-num">{currentTrack?.id === track.id && playing ? '🔊' : i + 1}</span>
                  <div className="mp__track-info">
                    <span className="mp__track-cover" style={{ background: track.cover }} />
                    <div>
                      <span className="mp__track-title">{track.title}</span>
                    </div>
                  </div>
                  <span className="mp__track-artist">{track.artist}</span>
                  <span className="mp__track-album">{track.album}</span>
                  <span className="mp__track-duration">{track.duration}</span>
                  <button className="mp__fav-btn" onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); }}>
                    <Heart size={12} fill={favorites.has(track.id) ? '#ef4444' : 'none'} stroke={favorites.has(track.id) ? '#ef4444' : 'currentColor'} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mp__track-grid">
              {filteredTracks.map(track => (
                <div key={track.id} className="mp__track-card" onDoubleClick={() => playTrack(track)}>
                  <div className="mp__card-cover" style={{ background: track.cover }}>
                    <Music size={24} style={{ color: 'rgba(255,255,255,0.4)' }} />
                    {currentTrack?.id === track.id && playing && <div className="mp__card-playing" />}
                  </div>
                  <div className="mp__card-info">
                    <span className="mp__card-title">{track.title}</span>
                    <span className="mp__card-artist">{track.artist}</span>
                    <span className="mp__card-album">{track.album} · {track.year}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Player bar */}
      <div className="mp__player">
        {currentTrack ? (
          <>
            <div className="mp__player-left">
              <div className="mp__player-cover" style={{ background: currentTrack.cover }}>
                <Music size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
              <div className="mp__player-track-info">
                <span className="mp__player-title">{currentTrack.title}</span>
                <span className="mp__player-artist">{currentTrack.artist} · {currentTrack.album}</span>
              </div>
              <button className="mp__player-fav" onClick={() => toggleFavorite(currentTrack.id)}>
                <Heart size={12} fill={favorites.has(currentTrack.id) ? '#ef4444' : 'none'} stroke={favorites.has(currentTrack.id) ? '#ef4444' : 'currentColor'} />
              </button>
            </div>

            <div className="mp__player-center">
              <div className="mp__player-controls">
                <button className={`mp__ctrl-btn ${shuffle ? 'mp__ctrl-btn--active' : ''}`} onClick={() => setShuffle(s => !s)} title="Aleatorio">
                  <Shuffle size={14} />
                </button>
                <button className="mp__ctrl-btn" onClick={prevTrack}><SkipBack size={18} /></button>
                <button className="mp__ctrl-btn mp__ctrl-btn--play" onClick={togglePlay}>
                  {playing ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" style={{ marginLeft: 2 }} />}
                </button>
                <button className="mp__ctrl-btn" onClick={nextTrack}><SkipForward size={18} /></button>
                <button className={`mp__ctrl-btn ${repeat !== 'none' ? 'mp__ctrl-btn--active' : ''}`} onClick={() => setRepeat(r => r === 'none' ? 'all' : r === 'all' ? 'one' : 'none')} title="Repetir">
                  <Repeat size={14} />
                  {repeat === 'one' && <span className="mp__repeat-one">1</span>}
                </button>
              </div>
              <div className="mp__player-progress">
                <span className="mp__time">{formatTime(currentSec)}</span>
                <div className="mp__progress-bar" onClick={e => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setProgress(((e.clientX - r.left) / r.width) * 100);
                }}>
                  <div className="mp__progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="mp__time">{currentTrack.duration}</span>
              </div>
            </div>

            <div className="mp__player-right">
              <button className="mp__ctrl-btn" onClick={() => setMuted(v => !v)}>
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <input type="range" className="mp__volume" min={0} max={100} value={muted ? 0 : volume}
                onChange={e => { setVolume(Number(e.target.value)); setMuted(false); }} />
            </div>
          </>
        ) : (
          <div className="mp__player-empty">
            <Music size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Selecciona una canción para reproducir</span>
          </div>
        )}
      </div>
    </div>
  );
}