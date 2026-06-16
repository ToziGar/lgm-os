import { useState, useEffect, useRef } from 'react';
import { Search, RefreshCw, Download, Trash2, Filter, AlertCircle, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import './LogCenter.css';

/* ─── Types ─── */
type LogLevel = 'info' | 'warning' | 'error' | 'debug' | 'critical';

interface LogEntry {
  id: number;
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
}

type Source = 'system' | 'connection' | 'services' | 'security' | 'backup';

/* ─── Mock log generators ─── */
let _logId = 1000;
const ts = () => {
  const now = new Date();
  return now.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const SYSTEM_MSGS: { level: LogLevel; service: string; message: string }[] = [
  { level: 'info',     service: 'kernel',      message: 'CPU temperature: 42°C (within normal range)' },
  { level: 'info',     service: 'networkd',    message: 'Link eth0 is UP speed=1000Mbps duplex=full' },
  { level: 'info',     service: 'systemd',     message: 'Unit nginx.service entered running state' },
  { level: 'info',     service: 'systemd',     message: 'Unit mariadbd.service entered running state' },
  { level: 'warning',  service: 'kernel',      message: 'Memory usage at 78% (12.5 GB / 16 GB)' },
  { level: 'info',     service: 'cron',        message: 'Executing job: /opt/scripts/backup-daily.sh' },
  { level: 'error',    service: 'mariadbd',    message: 'Aborted connection 1042 to db: \'lgmos\' user: \'admin\'' },
  { level: 'info',     service: 'avahi',       message: 'Registering mDNS service: _smb._tcp lgm-nas-01.local' },
  { level: 'info',     service: 'smbd',        message: 'New connection from 192.168.1.200 (DESKTOP-WIN11)' },
  { level: 'info',     service: 'smbd',        message: 'User admin authenticated successfully from 192.168.1.200' },
  { level: 'warning',  service: 'disk',        message: '/dev/sdb: 3 reallocated sectors detected, health: 72%' },
  { level: 'info',     service: 'updatedb',    message: 'Package update check: 2 security updates available' },
  { level: 'info',     service: 'nginx',       message: 'GET /api/v1/status HTTP/1.1 200 8ms' },
  { level: 'warning',  service: 'sshd',        message: 'Failed password for root from 45.33.32.156 port 54321 ssh2' },
  { level: 'info',     service: 'sshd',        message: 'Accepted publickey for admin from 192.168.1.200 port 52140' },
  { level: 'info',     service: 'lgm-ui',      message: 'Session started for user admin from 192.168.1.200' },
  { level: 'info',     service: 'zed',         message: 'ZFS scrub on pool tank: examined 142 GiB, no errors' },
  { level: 'info',     service: 'zed',         message: 'ZFS snapshot created: tank/data@auto-daily' },
  { level: 'info',     service: 'wg-quick',    message: 'WireGuard interface wg0 configuration loaded' },
];

const CONNECTION_MSGS: { level: LogLevel; service: string; message: string }[] = [
  { level: 'info',    service: 'smbd',   message: 'User admin connected from 192.168.1.200 (DESKTOP-ABC)' },
  { level: 'info',    service: 'smbd',   message: 'User lgm opened file: /volume1/Documentos/Informe.pdf' },
  { level: 'info',    service: 'sftp',   message: 'SFTP session opened for admin@192.168.1.200' },
  { level: 'warning', service: 'ftp',    message: 'Anonymous FTP login attempt from 10.0.0.55 — blocked' },
  { level: 'info',    service: 'smbd',   message: 'User admin disconnected, session duration: 00:23:14' },
  { level: 'error',   service: 'sftp',   message: 'Authentication failure for unknown from 45.76.10.22' },
  { level: 'info',    service: 'webdav', message: 'PROPFIND /volume1/Documentos/ 207 Multi-Status' },
];

const SECURITY_MSGS: { level: LogLevel; service: string; message: string }[] = [
  { level: 'warning',  service: 'firewall', message: 'Blocked inbound connection from 185.220.101.22 port 22' },
  { level: 'critical', service: 'auth',     message: '5 failed login attempts for admin from 103.47.55.80' },
  { level: 'info',     service: 'auth',     message: 'Successful admin login from 192.168.1.100' },
  { level: 'warning',  service: 'firewall', message: 'Port scan detected from 198.51.100.5' },
  { level: 'info',     service: 'ssl',      message: 'Certificate renewed for lgm-nas-01.local (expires in 90 days)' },
  { level: 'error',    service: 'auth',     message: 'Account lockout triggered for user guest (10 failed attempts)' },
  { level: 'info',     service: 'firewall', message: 'Rule updated: allow SMB from 192.168.1.0/24' },
];

const SOURCE_MAP: Record<Source, { level: LogLevel; service: string; message: string }[]> = {
  system:     SYSTEM_MSGS,
  connection: CONNECTION_MSGS,
  services:   SYSTEM_MSGS.filter(m => ['nginx','mariadbd','smbd','lgm-ui'].includes(m.service)),
  security:   SECURITY_MSGS,
  backup:     [
    { level: 'info',     service: 'backup', message: 'Backup job started: full-backup-sunday' },
    { level: 'info',     service: 'backup', message: 'Backing up /volume1/Documentos... (240 MB)' },
    { level: 'info',     service: 'backup', message: 'Backing up /volume1/Multimedia... (12.4 GB)' },
    { level: 'critical', service: 'backup', message: 'Backup failed: target /dev/sdb not mounted' },
    { level: 'info',     service: 'backup', message: 'Incremental backup completed: 345 files, 1.2 GB' },
    { level: 'warning',  service: 'backup', message: 'Backup destination is 78% full' },
  ],
};

function generateLogs(source: Source, count = 40): LogEntry[] {
  const msgs = SOURCE_MAP[source];
  return Array.from({ length: count }, (_, i) => {
    const m = msgs[Math.floor(Math.random() * msgs.length)];
    return { id: _logId++, timestamp: ts(), level: m.level, service: m.service, message: m.message };
  }).reverse();
}

const LEVEL_ICON: Record<LogLevel, React.ReactNode> = {
  info:     <Info size={13}/>,
  warning:  <AlertTriangle size={13}/>,
  error:    <AlertCircle size={13}/>,
  critical: <AlertCircle size={13}/>,
  debug:    <CheckCircle2 size={13}/>,
};

/* ─── Main ─── */
const SOURCES: { id: Source; label: string }[] = [
  { id: 'system',     label: 'Sistema' },
  { id: 'connection', label: 'Conexiones' },
  { id: 'services',   label: 'Servicios' },
  { id: 'security',   label: 'Seguridad' },
  { id: 'backup',     label: 'Respaldo' },
];

const LEVELS: LogLevel[] = ['info', 'debug', 'warning', 'error', 'critical'];

export function LogCenter() {
  const [source, setSource] = useState<Source>('system');
  const [logs, setLogs] = useState<LogEntry[]>(() => generateLogs('system'));
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<Set<LogLevel>>(new Set(LEVELS));
  const [autoRefresh, setAutoRefresh] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLogs(generateLogs(source));
  }, [source]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      const msgs = SOURCE_MAP[source];
      const m = msgs[Math.floor(Math.random() * msgs.length)];
      const entry: LogEntry = { id: _logId++, timestamp: ts(), level: m.level, service: m.service, message: m.message };
      setLogs(prev => [entry, ...prev].slice(0, 200));
    }, 3000);
    return () => clearInterval(id);
  }, [source, autoRefresh]);

  const toggleLevel = (level: LogLevel) => {
    setLevelFilter(prev => {
      const n = new Set(prev);
      n.has(level) ? n.delete(level) : n.add(level);
      return n;
    });
  };

  const filtered = logs.filter(l =>
    levelFilter.has(l.level) &&
    (!search || l.message.toLowerCase().includes(search.toLowerCase()) ||
     l.service.toLowerCase().includes(search.toLowerCase()))
  );

  const downloadLogs = () => {
    const text = filtered.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.service}] ${l.message}`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = `lgmos-${source}-${Date.now()}.log`;
    a.click();
  };

  const counts: Partial<Record<LogLevel, number>> = {};
  LEVELS.forEach(l => { counts[l] = logs.filter(e => e.level === l).length; });

  return (
    <div className="log">
      {/* Sidebar */}
      <div className="log__sidebar">
        <div className="log__sidebar-title">Fuentes de registro</div>
        {SOURCES.map(s => {
          const errs = generateLogs(s.id, 5).filter(l => l.level === 'error' || l.level === 'critical').length;
          return (
            <button
              key={s.id}
              className={`log__src-btn ${source === s.id ? 'log__src-btn--active' : ''}`}
              onClick={() => setSource(s.id)}
            >
              {s.label}
              {errs > 0 && <span className="log__src-badge">{errs}</span>}
            </button>
          );
        })}

        <div className="log__sidebar-title" style={{ marginTop: 16 }}>Estadísticas</div>
        {LEVELS.map(l => (
          <div key={l} className={`log__stat-row log__stat-row--${l}`}>
            {LEVEL_ICON[l]}
            <span className="log__stat-label">{l}</span>
            <span className="log__stat-count">{counts[l] ?? 0}</span>
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="log__main">
        {/* Toolbar */}
        <div className="log__toolbar">
          <div className="log__search-wrap">
            <Search size={12} className="log__search-icon"/>
            <input
              className="log__search"
              placeholder="Buscar en registros..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Level filters */}
          <div className="log__filters">
            {LEVELS.map(l => (
              <button
                key={l}
                className={`log__filter-btn log__filter-btn--${l} ${levelFilter.has(l) ? 'log__filter-btn--active' : ''}`}
                onClick={() => toggleLevel(l)}
              >
                {l}
              </button>
            ))}
          </div>

          <label className="log__auto-label">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)}/>
            Auto
          </label>

          <button className="log__icon-btn" onClick={() => setLogs(generateLogs(source))} title="Actualizar">
            <RefreshCw size={13}/>
          </button>
          <button className="log__icon-btn" onClick={downloadLogs} title="Descargar log">
            <Download size={13}/>
          </button>
          <button className="log__icon-btn log__icon-btn--danger" onClick={() => setLogs([])} title="Limpiar">
            <Trash2 size={13}/>
          </button>
        </div>

        {/* Log entries */}
        <div className="log__entries">
          {filtered.length === 0 && (
            <div className="log__empty">
              <Filter size={28} style={{ color: 'var(--text-muted)' }}/>
              <p>No hay entradas que coincidan</p>
            </div>
          )}
          {filtered.map(entry => (
            <div key={entry.id} className={`log__entry log__entry--${entry.level}`}>
              <span className="log__entry-time">{entry.timestamp}</span>
              <span className={`log__entry-level log__entry-level--${entry.level}`}>
                {LEVEL_ICON[entry.level]} {entry.level.toUpperCase()}
              </span>
              <span className="log__entry-service">[{entry.service}]</span>
              <span className="log__entry-msg">{entry.message}</span>
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>

        {/* Status bar */}
        <div className="log__statusbar">
          <span>{filtered.length} entradas</span>
          {autoRefresh && <span className="log__live"><span className="log__live-dot"/> En vivo</span>}
          <span style={{ marginLeft: 'auto' }}>Fuente: {SOURCES.find(s=>s.id===source)?.label}</span>
        </div>
      </div>
    </div>
  );
}
