import { useState, useEffect, useRef } from 'react';
import { Cpu, MemoryStick, HardDrive, Network, RefreshCw, Activity, Server } from 'lucide-react';
import { useStorageStore } from '../../store/storageStore';
import { useSystemStore }  from '../../store/systemStore';
import './SystemInfo.css';

const R = (min: number, max: number) => Math.round(min + Math.random() * (max - min));

const HISTORY_LEN = 40;

function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null;
  const max = 100;
  const w = 200;
  const h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${h} ` + pts + ` ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#grad-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MetricCard({ label, value, unit = '%', color, history, icon, extra }: {
  label: string; value: number; unit?: string; color: string;
  history: number[]; icon: React.ReactNode; extra?: string;
}) {
  return (
    <div className="sysinfo__card">
      <div className="sysinfo__card-header">
        <div className="sysinfo__card-left">
          <span className="sysinfo__card-icon" style={{ color }}>{icon}</span>
          <span className="sysinfo__card-label">{label}</span>
        </div>
        <span className="sysinfo__card-value" style={{ color }}>{value}<span className="sysinfo__card-unit">{unit}</span></span>
      </div>
      <div className="sysinfo__card-bar">
        <div className="sysinfo__card-bar-track">
          <div className="sysinfo__card-bar-fill" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
        </div>
      </div>
      <div className="sysinfo__card-spark">
        <Sparkline data={history} color={color} height={36} />
      </div>
      {extra && <div className="sysinfo__card-extra">{extra}</div>}
    </div>
  );
}

type Tab = 'overview' | 'processes' | 'network' | 'disk';

export function SystemInfo() {
  const [tab, setTab] = useState<Tab>('overview');
  const { volumes, disks, getDiskHealthSummary } = useStorageStore();
  const { user } = useSystemStore();
  const health = getDiskHealthSummary();
  const totalStorageGB = volumes.reduce((s, v) => s + v.totalGB, 0);
  const usedStorageGB  = volumes.reduce((s, v) => s + v.usedGB, 0);

  const cpuRef  = useRef<number[]>(Array.from({ length: HISTORY_LEN }, () => R(10, 50)));
  const memRef  = useRef<number[]>(Array.from({ length: HISTORY_LEN }, () => R(40, 65)));
  const diskRef = useRef<number[]>(Array.from({ length: HISTORY_LEN }, () => R(35, 42)));
  const netInRef  = useRef<number[]>(Array.from({ length: HISTORY_LEN }, () => R(50, 500)));
  const netOutRef = useRef<number[]>(Array.from({ length: HISTORY_LEN }, () => R(10, 200)));

  const [cpu,    setCpu]    = useState(cpuRef.current[cpuRef.current.length - 1]);
  const [mem,    setMem]    = useState(memRef.current[memRef.current.length - 1]);
  const [disk,   setDisk]   = useState(diskRef.current[diskRef.current.length - 1]);
  const [netIn,  setNetIn]  = useState(netInRef.current[netInRef.current.length - 1]);
  const [netOut, setNetOut] = useState(netOutRef.current[netOutRef.current.length - 1]);
  const [temp,   setTemp]   = useState(R(45, 65));
  const [tick,   setTick]   = useState(0);

  const refresh = () => {
    const nc = R(8, 78);  cpuRef.current  = [...cpuRef.current.slice(1),  nc]; setCpu(nc);
    const nm = R(35, 72); memRef.current  = [...memRef.current.slice(1),  nm]; setMem(nm);
    const nd = R(33, 44); diskRef.current = [...diskRef.current.slice(1), nd]; setDisk(nd);
    const ni = R(20, 900);netInRef.current  = [...netInRef.current.slice(1),  ni]; setNetIn(ni);
    const no = R(5, 350); netOutRef.current = [...netOutRef.current.slice(1), no]; setNetOut(no);
    setTemp(R(42, 72));
    setTick((t) => t + 1);
  };

  useEffect(() => {
    const id = setInterval(refresh, 2500);
    return () => clearInterval(id);
  }, []);

  const PROCESSES = [
    { name: 'nginx',      pid: 1024, cpu: R(0, 4),  mem: R(80, 150),  status: 'running' },
    { name: 'mariadb',    pid: 1128, cpu: R(1, 7),  mem: R(300, 600), status: 'running' },
    { name: 'lgm-ui',     pid: 2048, cpu: R(2, 15), mem: R(400, 900), status: 'running' },
    { name: 'systemd',    pid: 1,    cpu: 0,         mem: R(15, 30),  status: 'running' },
    { name: 'sshd',       pid: 980,  cpu: 0,         mem: R(8, 18),   status: 'running' },
    { name: 'cron',       pid: 1100, cpu: 0,         mem: R(4, 12),   status: 'running' },
    { name: 'rsyslog',    pid: 1050, cpu: 0,         mem: R(4, 10),   status: 'running' },
    { name: 'node',       pid: 3100, cpu: R(0, 5),  mem: R(50, 120),  status: 'sleeping' },
  ];

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',  label: 'Resumen',   icon: <Activity size={13} /> },
    { id: 'processes', label: 'Procesos',  icon: <Cpu size={13} /> },
    { id: 'network',   label: 'Red',       icon: <Network size={13} /> },
    { id: 'disk',      label: 'Disco',     icon: <HardDrive size={13} /> },
  ];

  return (
    <div className="sysinfo">
      {/* Header */}
      <div className="sysinfo__header">
        <div className="sysinfo__header-left">
          <Server size={14} />
          <span>Monitor del Sistema</span>
          <span className="sysinfo__hostname">lgm-nas-01</span>
        </div>
        <button className="sysinfo__refresh" onClick={refresh} title="Actualizar">
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Tabs */}
      <div className="sysinfo__tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`sysinfo__tab ${tab === t.id ? 'sysinfo__tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="sysinfo__body" key={tick}>
        {tab === 'overview' && (
          <>
            <div className="sysinfo__cards">
              <MetricCard label="CPU" value={cpu} color="#ef4444" history={cpuRef.current}
                icon={<Cpu size={14} />} extra={`Intel Core i7-12700 × 8 · ${temp}°C`} />
              <MetricCard label="Memoria" value={mem} color="#3b82f6" history={memRef.current}
                icon={<MemoryStick size={14} />} extra={`${(mem * 0.16).toFixed(1)} GB / 16 GB`} />
              <MetricCard label="Disco" value={disk} color="#10b981" history={diskRef.current}
                icon={<HardDrive size={14} />} extra={`${Math.round(disk * 9.53)} GB / 953 GB`} />
            </div>
            <div className="sysinfo__net-cards">
              <div className="sysinfo__net-card">
                <Network size={13} />
                <span>Red (eth0)</span>
                <span className="sysinfo__net-dl">↓ {netIn} KB/s</span>
                <span className="sysinfo__net-ul">↑ {netOut} KB/s</span>
                <span className="sysinfo__net-ip">192.168.1.100</span>
              </div>
            </div>
            <div className="sysinfo__info-row">
              <span>Uptime: <strong>3d 7h 12m</strong></span>
              <span>Kernel: <strong>6.1.0-lgm-amd64</strong></span>
              <span>Temp: <strong style={{ color: temp > 70 ? '#ef4444' : temp > 60 ? '#f59e0b' : '#10b981' }}>{temp}°C</strong></span>
              {health.warning > 0 && <span style={{ color: '#f59e0b', fontWeight: 700 }}>⚠ {health.warning} disco(s) con aviso</span>}
              {health.failing > 0 && <span style={{ color: '#ef4444', fontWeight: 700 }}>❌ {health.failing} disco(s) fallando</span>}
            </div>
          </>
        )}

        {tab === 'processes' && (
          <div className="sysinfo__procs">
            <div className="sysinfo__procs-header">
              <span>Proceso</span><span>PID</span><span>CPU %</span><span>Mem (MB)</span><span>Estado</span>
            </div>
            {PROCESSES.sort((a,b) => b.cpu - a.cpu).map((p) => (
              <div key={p.name} className="sysinfo__procs-row">
                <span className="sysinfo__proc-name">{p.name}</span>
                <span className="sysinfo__proc-pid">{p.pid}</span>
                <span style={{ color: p.cpu > 10 ? '#ef4444' : p.cpu > 5 ? '#f59e0b' : 'var(--text-primary)', fontWeight: 600 }}>
                  {p.cpu}
                </span>
                <span>{p.mem}</span>
                <span className={`sysinfo__proc-status sysinfo__proc-status--${p.status}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'network' && (
          <div className="sysinfo__net-detail">
            <div className="sysinfo__cards">
              <MetricCard label="Descarga" value={Math.round((netIn / 1000) * 100)} color="#10b981"
                history={netInRef.current.map(v => Math.round((v/1000)*100))} icon={<Network size={14} />}
                extra={`${netIn} KB/s`} unit="%" />
              <MetricCard label="Subida" value={Math.round((netOut / 350) * 100)} color="#f59e0b"
                history={netOutRef.current.map(v => Math.round((v/350)*100))} icon={<Network size={14} />}
                extra={`${netOut} KB/s`} unit="%" />
            </div>
            <div className="sysinfo__net-info">
              <div className="sysinfo__net-info-row"><span>Interfaz</span><strong>eth0</strong></div>
              <div className="sysinfo__net-info-row"><span>IP Local</span><strong>192.168.1.100</strong></div>
              <div className="sysinfo__net-info-row"><span>Máscara</span><strong>255.255.255.0 (/24)</strong></div>
              <div className="sysinfo__net-info-row"><span>Gateway</span><strong>192.168.1.1</strong></div>
              <div className="sysinfo__net-info-row"><span>DNS primario</span><strong>8.8.8.8</strong></div>
              <div className="sysinfo__net-info-row"><span>DNS secundario</span><strong>8.8.4.4</strong></div>
              <div className="sysinfo__net-info-row"><span>MAC</span><strong>a4:bb:6d:1c:00:ff</strong></div>
              <div className="sysinfo__net-info-row"><span>Hostname</span><strong>lgm-nas-01.local</strong></div>
            </div>
          </div>
        )}

        {tab === 'disk' && (
          <div className="sysinfo__disk-detail">
            {/* Summary */}
            <div className="sysinfo__info-row" style={{ marginBottom: 12 }}>
              <span>Total almacenamiento: <strong>{totalStorageGB} GB ({(totalStorageGB/1024).toFixed(1)} TB)</strong></span>
              <span>En uso: <strong>{usedStorageGB} GB</strong></span>
              <span>Libre: <strong>{totalStorageGB - usedStorageGB} GB</strong></span>
            </div>
            {volumes.map((vol) => {
              const pct = Math.round((vol.usedGB / vol.totalGB) * 100);
              const volDisks = disks.filter(d => d.volumeId === vol.id);
              return (
                <div key={vol.id} className="sysinfo__vol">
                  <div className="sysinfo__vol-header">
                    <span><HardDrive size={13} /> {vol.name} — {vol.mountPoint}</span>
                    <span style={{ color: vol.status !== 'normal' ? '#f59e0b' : 'var(--text-secondary)' }}>
                      {vol.usedGB} / {vol.totalGB} GB ({pct}%)
                      {vol.status !== 'normal' && ` ⚠ ${vol.status}`}
                    </span>
                  </div>
                  <div className="sysinfo__vol-bar">
                    <div className="sysinfo__vol-fill" style={{
                      width: `${pct}%`,
                      background: pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#3b82f6',
                    }} />
                  </div>
                  <div className="sysinfo__vol-stats">
                    <span>Libre: {vol.totalGB - vol.usedGB} GB · {vol.raidType} · {vol.fsType}</span>
                    <span>{volDisks.length} disco{volDisks.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

