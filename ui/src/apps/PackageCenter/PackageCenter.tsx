import { useState } from 'react';
import { Search, Download, CheckCircle2, RefreshCw, Star } from 'lucide-react';
import './PackageCenter.css';

interface Package {
  id: string;
  name: string;
  description: string;
  version: string;
  icon: string;
  category: string;
  rating: number;
  installed: boolean;
  size: string;
}

const PACKAGES: Package[] = [
  { id: 'nginx',      name: 'Nginx',         description: 'Servidor web de alto rendimiento y proxy inverso', version: '1.25.3', icon: '🌐', category: 'Servidores',   rating: 5, installed: true,  size: '2.1 MB' },
  { id: 'mariadb',    name: 'MariaDB',        description: 'Sistema de gestión de bases de datos relacionales', version: '10.11', icon: '🗄️', category: 'Bases de datos', rating: 5, installed: true,  size: '180 MB' },
  { id: 'nodejs',     name: 'Node.js',        description: 'Entorno de ejecución JavaScript del lado del servidor', version: '20.11', icon: '💚', category: 'Desarrollo',    rating: 5, installed: false, size: '62 MB' },
  { id: 'python',     name: 'Python 3',       description: 'Lenguaje de programación versátil y poderoso', version: '3.12.0', icon: '🐍', category: 'Desarrollo',    rating: 5, installed: false, size: '25 MB' },
  { id: 'docker',     name: 'Docker',         description: 'Plataforma de contenedores de aplicaciones', version: '24.0.7', icon: '🐳', category: 'Virtualización', rating: 5, installed: false, size: '85 MB' },
  { id: 'plex',       name: 'Plex Media',     description: 'Servidor de medios para tus películas y música', version: '1.32.8', icon: '🎬', category: 'Multimedia',    rating: 4, installed: false, size: '150 MB' },
  { id: 'nextcloud',  name: 'Nextcloud',      description: 'Almacenamiento en la nube privado y seguro', version: '27.1', icon: '☁️', category: 'Nube',           rating: 4, installed: false, size: '120 MB' },
  { id: 'gitea',      name: 'Gitea',          description: 'Servicio de alojamiento de código Git autoalojado', version: '1.21.4', icon: '🍵', category: 'Desarrollo',    rating: 4, installed: false, size: '90 MB' },
  { id: 'portainer',  name: 'Portainer',      description: 'Gestión de contenedores Docker con interfaz web', version: '2.19.4', icon: '⚓', category: 'Virtualización', rating: 4, installed: false, size: '20 MB' },
  { id: 'wireguard',  name: 'WireGuard VPN',  description: 'VPN moderna y rápida para acceso remoto seguro', version: '1.0.0', icon: '🔐', category: 'Red',            rating: 5, installed: false, size: '5 MB' },
  { id: 'pihole',     name: 'Pi-hole',        description: 'Bloqueador de anuncios a nivel de red', version: '5.18', icon: '🕳️', category: 'Red',            rating: 4, installed: false, size: '15 MB' },
  { id: 'redis',      name: 'Redis',          description: 'Almacén de datos en memoria de alto rendimiento', version: '7.2.3', icon: '🔴', category: 'Bases de datos', rating: 5, installed: false, size: '8 MB' },
];

const CATEGORIES = ['Todos', 'Instalados', 'Servidores', 'Bases de datos', 'Desarrollo', 'Virtualización', 'Multimedia', 'Nube', 'Red'];

export function PackageCenter() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [packages, setPackages] = useState(PACKAGES);
  const [installing, setInstalling] = useState<string | null>(null);

  const filtered = packages.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      category === 'Todos' ||
      (category === 'Instalados' ? p.installed : p.category === category);
    return matchSearch && matchCat;
  });

  const [progress, setProgress] = useState<Record<string, number>>({});

  const handleInstall = async (id: string) => {
    setInstalling(id);
    setProgress((p) => ({ ...p, [id]: 0 }));
    for (let i = 10; i <= 100; i += Math.round(10 + Math.random() * 15)) {
      await new Promise((r) => setTimeout(r, 120 + Math.random() * 100));
      setProgress((p) => ({ ...p, [id]: Math.min(i, 99) }));
    }
    setProgress((p) => ({ ...p, [id]: 100 }));
    await new Promise((r) => setTimeout(r, 200));
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, installed: true } : p)));
    setInstalling(null);
    setProgress((p) => { const n = { ...p }; delete n[id]; return n; });
  };

  const handleUninstall = (id: string) => {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, installed: false } : p)));
  };

  return (
    <div className="pkg">
      {/* Top bar */}
      <div className="pkg__topbar">
        <div className="pkg__search-wrap">
          <Search size={14} className="pkg__search-icon" />
          <input
            type="text"
            className="pkg__search"
            placeholder="Buscar paquetes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="pkg__refresh" title="Actualizar catálogo">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="pkg__layout">
        {/* Sidebar categories */}
        <aside className="pkg__sidebar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`pkg__cat-btn ${category === cat ? 'pkg__cat-btn--active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
              <span className="pkg__cat-count">
                {cat === 'Todos' ? packages.length
                  : cat === 'Instalados' ? packages.filter((p) => p.installed).length
                  : packages.filter((p) => p.category === cat).length}
              </span>
            </button>
          ))}
        </aside>

        {/* Package grid */}
        <div className="pkg__main">
          <div className="pkg__grid">
            {filtered.map((pkg) => (
              <div key={pkg.id} className={`pkg__card ${pkg.installed ? 'pkg__card--installed' : ''}`}>
                <div className="pkg__card-top">
                  <span className="pkg__card-icon">{pkg.icon}</span>
                  <div className="pkg__card-meta">
                    <span className="pkg__card-name">{pkg.name}</span>
                    <span className="pkg__card-version">v{pkg.version}</span>
                    <div className="pkg__stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          fill={i < pkg.rating ? '#f59e0b' : 'none'}
                          stroke={i < pkg.rating ? '#f59e0b' : 'currentColor'}
                          style={{ color: '#d1d5db' }}
                        />
                      ))}
                    </div>
                  </div>
                  {pkg.installed && (
                    <CheckCircle2 size={16} className="pkg__installed-badge" />
                  )}
                </div>

                <p className="pkg__card-desc">{pkg.description}</p>

                {installing === pkg.id && progress[pkg.id] !== undefined && (
                  <div className="pkg__progress-wrap">
                    <div className="pkg__progress-bar" style={{ width: `${progress[pkg.id]}%` }} />
                    <span className="pkg__progress-label">{progress[pkg.id]}%</span>
                  </div>
                )}

                <div className="pkg__card-footer">
                  <span className="pkg__card-cat">{pkg.category}</span>
                  <span className="pkg__card-size">{pkg.size}</span>
                  {pkg.installed ? (
                    <button className="pkg__btn pkg__btn--uninstall" onClick={() => handleUninstall(pkg.id)}>
                      Desinstalar
                    </button>
                  ) : (
                    <button
                      className="pkg__btn pkg__btn--install"
                      onClick={() => handleInstall(pkg.id)}
                      disabled={!!installing}
                    >
                      {installing === pkg.id ? (
                        <><span className="pkg__spinner" /> Instalando&hellip;</>
                      ) : (
                        <><Download size={12} /> Instalar</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="pkg__empty">No se encontraron paquetes</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
