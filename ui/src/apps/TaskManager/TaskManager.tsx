import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Search, Cpu, MemoryStick, X, ChevronUp, ChevronDown, Activity } from 'lucide-react';
import './TaskManager.css';

/* ─── Types ─── */
interface Process {
  pid: number;
  name: string;
  user: string;
  cpu: number;
  mem: number;      // MB
  memPct: number;   // %
  status: 'running' | 'sleeping' | 'zombie' | 'stopped';
  command: string;
  started: string;
  threads: number;
}

type SortKey = 'pid' | 'name' | 'cpu' | 'mem' | 'status';
type SortDir = 'asc' | 'desc';

/* ─── Mock process generator ─── */
const BASE_PROCS: Omit<Process, 'cpu' | 'mem' | 'memPct'>[] = [
  { pid: 1,    name: 'systemd',       user: 'root',     status: 'running',  command: '/sbin/init',                          started: '00:00:01', threads: 1  },
  { pid: 2,    name: 'kthreadd',      user: 'root',     status: 'sleeping', command: '[kthreadd]',                          started: '00:00:01', threads: 1  },
  { pid: 145,  name: 'rsyslogd',      user: 'root',     status: 'running',  command: '/usr/sbin/rsyslogd -n',               started: '00:00:02', threads: 4  },
  { pid: 320,  name: 'dbus-daemon',   user: 'messagebus',status: 'sleeping',command: '/usr/bin/dbus-daemon --system',       started: '00:00:03', threads: 1  },
  { pid: 412,  name: 'networkd',      user: 'root',     status: 'running',  command: '/lib/systemd/systemd-networkd',       started: '00:00:03', threads: 3  },
  { pid: 680,  name: 'sshd',          user: 'root',     status: 'running',  command: '/usr/sbin/sshd -D',                   started: '00:00:05', threads: 1  },
  { pid: 720,  name: 'cron',          user: 'root',     status: 'sleeping', command: '/usr/sbin/cron -f',                   started: '00:00:05', threads: 1  },
  { pid: 901,  name: 'nginx',         user: 'www-data', status: 'running',  command: 'nginx: master process',               started: '00:00:08', threads: 1  },
  { pid: 902,  name: 'nginx',         user: 'www-data', status: 'running',  command: 'nginx: worker process',               started: '00:00:08', threads: 1  },
  { pid: 1050, name: 'mariadbd',      user: 'mysql',    status: 'running',  command: '/usr/sbin/mariadbd --user=mysql',     started: '00:00:10', threads: 28 },
  { pid: 1200, name: 'smbd',          user: 'root',     status: 'running',  command: '/usr/sbin/smbd --foreground',         started: '00:00:12', threads: 3  },
  { pid: 1201, name: 'nmbd',          user: 'root',     status: 'running',  command: '/usr/sbin/nmbd --foreground',         started: '00:00:12', threads: 1  },
  { pid: 1350, name: 'lgm-ui',        user: 'admin',    status: 'running',  command: 'node /opt/lgm/ui/server.js',          started: '00:00:15', threads: 8  },
  { pid: 1500, name: 'avahi-daemon',  user: 'avahi',    status: 'running',  command: 'avahi-daemon: running [lgm-nas-01]',  started: '00:00:16', threads: 2  },
  { pid: 1820, name: 'containerd',    user: 'root',     status: 'running',  command: '/usr/bin/containerd',                 started: '00:01:30', threads: 14 },
  { pid: 2010, name: 'dockerd',       user: 'root',     status: 'running',  command: '/usr/bin/dockerd -H fd://',           started: '00:01:32', threads: 12 },
  { pid: 2200, name: 'zed',           user: 'root',     status: 'running',  command: 'zed',                                 started: '00:02:00', threads: 6  },
  { pid: 3001, name: 'python3',       user: 'admin',    status: 'sleeping', command: 'python3 /opt/scripts/monitor.py',     started: '00:05:00', threads: 2  },
  { pid: 3200, name: 'bash',          user: 'admin',    status: 'running',  command: '-bash',                               started: '14:20:10', threads: 1  },
  { pid: 4001, name: 'wg-quick',      user: 'root',     status: 'sleeping', command: 'wg-quick up wg0',                     started: '00:00:20', threads: 1  },
];

function rnd(min: number, max: number) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

function generateProcs(): Process[] {
  return BASE_PROCS.map(p => {
    const isBusy = ['mariadbd','lgm-ui','node','nginx','containerd','dockerd'].includes(p.name);
    const cpu    = isBusy ? rnd(0.5, 8) : rnd(0, 0.8);
    const memBase: Record<string, number> = {
      mariadbd: 420, lgm_ui: 620, node: 280, nginx: 35, containerd: 180,
      dockerd: 220, python3: 45, sshd: 12, systemd: 18,
    };
    const mem  = Math.round((memBase[p.name] ?? 8) + Math.random() * 20);
    return { ...p, cpu, mem, memPct: parseFloat((mem / 163.84).toFixed(1)) };
  });
}

/* ─── Sparkline component ─── */
function MiniSpark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const w = 60; const h = 22;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: 60, height: 22, flexShrink: 0 }}>
      <polygon points={area} fill={color + '22'}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ─── Main component ─── */
type ViewTab = 'processes' | 'performance';

export function TaskManager() {
  const [procs, setProcs] = useState<Process[]>(generateProcs);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('cpu');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState<ViewTab>('processes');
  const [killing, setKilling] = useState<number | null>(null);

  // History for sparklines
  const cpuHistory  = useRef<number[]>(Array.from({ length: 30 }, () => rnd(10, 45)));
  const memHistory  = useRef<number[]>(Array.from({ length: 30 }, () => rnd(38, 58)));
  const [cpuNow,  setCpuNow]  = useState(cpuHistory.current[cpuHistory.current.length - 1]);
  const [memNow,  setMemNow]  = useState(memHistory.current[memHistory.current.length - 1]);
  const [netIn,   setNetIn]   = useState(rnd(50, 400));
  const [netOut,  setNetOut]  = useState(rnd(10, 150));

  useEffect(() => {
    const id = setInterval(() => {
      setProcs(generateProcs());
      const nc = rnd(8, 75);
      const nm = rnd(35, 65);
      cpuHistory.current = [...cpuHistory.current.slice(1), nc];
      memHistory.current = [...memHistory.current.slice(1), nm];
      setCpuNow(nc);
      setMemNow(nm);
      setNetIn(rnd(20, 900));
      setNetOut(rnd(5, 300));
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = procs.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.command.toLowerCase().includes(search.toLowerCase()) ||
    p.pid.toString().includes(search)
  );

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey]; const bv = b[sortKey];
    const cmp = typeof av === 'string' ? (av as string).localeCompare(bv as string) : (av as number) - (bv as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const killProcess = (pid: number) => {
    setKilling(pid);
    setTimeout(() => {
      setProcs(prev => prev.filter(p => p.pid !== pid));
      setSelected(null);
      setKilling(null);
    }, 600);
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <span style={{ opacity: 0.2, fontSize: 10 }}>⇅</span>;
    return sortDir === 'asc' ? <ChevronUp size={11}/> : <ChevronDown size={11}/>;
  };

  const totalMem = sorted.reduce((s, p) => s + p.mem, 0);
  const totalCpu = sorted.reduce((s, p) => s + p.cpu, 0);

  return (
    <div className="tm">
      {/* Header */}
      <div className="tm__header">
        <div className="tm__tabs">
          <button className={`tm__tab ${tab === 'processes' ? 'tm__tab--active' : ''}`} onClick={() => setTab('processes')}>
            <Activity size={12}/> Procesos
          </button>
          <button className={`tm__tab ${tab === 'performance' ? 'tm__tab--active' : ''}`} onClick={() => setTab('performance')}>
            <Cpu size={12}/> Rendimiento
          </button>
        </div>
        {tab === 'processes' && (
          <div className="tm__toolbar">
            <div className="tm__search-wrap">
              <Search size={12} className="tm__search-icon"/>
              <input
                className="tm__search"
                placeholder="Filtrar procesos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              className="tm__kill-btn"
              disabled={selected === null || killing !== null}
              onClick={() => selected !== null && killProcess(selected)}
              title="Terminar proceso"
            >
              <X size={13}/> Terminar
            </button>
            <button className="tm__refresh-btn" onClick={() => setProcs(generateProcs())} title="Actualizar">
              <RefreshCw size={13}/>
            </button>
          </div>
        )}
      </div>

      {tab === 'processes' && (
        <>
          {/* Table */}
          <div className="tm__table-wrap">
            <div className="tm__thead">
              <div className="tm__th tm__th--pid" onClick={() => handleSort('pid')}>PID <SortIcon k="pid"/></div>
              <div className="tm__th" onClick={() => handleSort('name')}>Nombre <SortIcon k="name"/></div>
              <div className="tm__th tm__th--user">Usuario</div>
              <div className="tm__th tm__th--num" onClick={() => handleSort('cpu')}>CPU% <SortIcon k="cpu"/></div>
              <div className="tm__th tm__th--num" onClick={() => handleSort('mem')}>Mem MB <SortIcon k="mem"/></div>
              <div className="tm__th tm__th--status" onClick={() => handleSort('status')}>Estado <SortIcon k="status"/></div>
              <div className="tm__th tm__th--cmd">Comando</div>
            </div>
            <div className="tm__tbody">
              {sorted.map(p => (
                <div
                  key={p.pid}
                  className={`tm__tr ${selected === p.pid ? 'tm__tr--selected' : ''} ${killing === p.pid ? 'tm__tr--killing' : ''}`}
                  onClick={() => setSelected(p.pid === selected ? null : p.pid)}
                  onDoubleClick={() => killProcess(p.pid)}
                >
                  <div className="tm__td tm__td--pid">{p.pid}</div>
                  <div className="tm__td tm__td--name">
                    <div className="tm__proc-dot" data-status={p.status}/>
                    <span>{p.name}</span>
                  </div>
                  <div className="tm__td tm__td--user">{p.user}</div>
                  <div className="tm__td tm__td--num" style={{ color: p.cpu > 10 ? '#ef4444' : p.cpu > 5 ? '#f59e0b' : 'var(--text-primary)' }}>
                    {p.cpu.toFixed(1)}
                  </div>
                  <div className="tm__td tm__td--num">{p.mem}</div>
                  <div className="tm__td tm__td--status">
                    <span className={`tm__status-badge tm__status-badge--${p.status}`}>{p.status}</span>
                  </div>
                  <div className="tm__td tm__td--cmd tm__td--truncate">{p.command}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="tm__footer">
            <span>{sorted.length} procesos</span>
            <span>CPU total: <strong>{totalCpu.toFixed(1)}%</strong></span>
            <span>Mem: <strong>{totalMem} MB</strong></span>
            {selected && (
              <span style={{ marginLeft: 'auto', color: 'var(--color-primary)' }}>
                PID {selected} seleccionado — Doble clic o botón para terminar
              </span>
            )}
          </div>
        </>
      )}

      {tab === 'performance' && (
        <div className="tm__perf">
          {/* CPU card */}
          <div className="tm__perf-card">
            <div className="tm__perf-card-header">
              <Cpu size={14} style={{ color: '#ef4444' }}/> <span>CPU</span>
              <span className="tm__perf-val" style={{ color: '#ef4444' }}>{cpuNow.toFixed(1)}%</span>
            </div>
            <div className="tm__perf-graph">
              <svg viewBox="0 0 200 60" preserveAspectRatio="none" style={{ width: '100%', height: 60 }}>
                <defs>
                  <linearGradient id="cpu-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <polygon
                  points={`0,60 ${cpuHistory.current.map((v, i) => `${(i / 29) * 200},${60 - (v / 100) * 60}`).join(' ')} 200,60`}
                  fill="url(#cpu-grad)"
                />
                <polyline
                  points={cpuHistory.current.map((v, i) => `${(i / 29) * 200},${60 - (v / 100) * 60}`).join(' ')}
                  fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="tm__perf-meta">
              <span>Intel Core i7-12700 × 8</span>
              <span>Frecuencia base: 2.1 GHz</span>
            </div>
          </div>

          {/* Memory card */}
          <div className="tm__perf-card">
            <div className="tm__perf-card-header">
              <MemoryStick size={14} style={{ color: '#3b82f6' }}/> <span>Memoria</span>
              <span className="tm__perf-val" style={{ color: '#3b82f6' }}>{memNow.toFixed(1)}%</span>
            </div>
            <div className="tm__perf-graph">
              <svg viewBox="0 0 200 60" preserveAspectRatio="none" style={{ width: '100%', height: 60 }}>
                <defs>
                  <linearGradient id="mem-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <polygon
                  points={`0,60 ${memHistory.current.map((v, i) => `${(i / 29) * 200},${60 - (v / 100) * 60}`).join(' ')} 200,60`}
                  fill="url(#mem-grad)"
                />
                <polyline
                  points={memHistory.current.map((v, i) => `${(i / 29) * 200},${60 - (v / 100) * 60}`).join(' ')}
                  fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="tm__perf-meta">
              <span>En uso: {(memNow * 0.16).toFixed(2)} GB / 16 GB</span>
              <span>DDR4 3200MHz</span>
            </div>
          </div>

          {/* Network */}
          <div className="tm__perf-card">
            <div className="tm__perf-card-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M22 12H2M22 12l-4-4M22 12l-4 4M2 12l4-4M2 12l4 4"/></svg>
              <span>Red (eth0)</span>
            </div>
            <div className="tm__net-stats">
              <div className="tm__net-row">
                <span className="tm__net-dir" style={{ color: '#10b981' }}>↓ Descarga</span>
                <span className="tm__net-val">{netIn} KB/s</span>
                <MiniSpark data={[...Array(30)].map(() => rnd(20, 900))} color="#10b981"/>
              </div>
              <div className="tm__net-row">
                <span className="tm__net-dir" style={{ color: '#f59e0b' }}>↑ Subida</span>
                <span className="tm__net-val">{netOut} KB/s</span>
                <MiniSpark data={[...Array(30)].map(() => rnd(5, 300))} color="#f59e0b"/>
              </div>
            </div>
            <div className="tm__perf-meta">
              <span>IP: 192.168.1.100</span>
              <span>MAC: a4:bb:6d:1c:00:ff</span>
            </div>
          </div>

          {/* Summary stats */}
          <div className="tm__perf-summary">
            <div className="tm__stat"><span>Procesos</span><strong>{procs.length}</strong></div>
            <div className="tm__stat"><span>Hilos</span><strong>{procs.reduce((s,p)=>s+p.threads,0)}</strong></div>
            <div className="tm__stat"><span>Uptime</span><strong>3d 7h 12m</strong></div>
            <div className="tm__stat"><span>Carga</span><strong>0.{Math.floor(cpuNow / 10)}{Math.floor(Math.random()*9)}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}
