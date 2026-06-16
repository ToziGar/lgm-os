import { useState, useEffect } from 'react';
import { Cpu, MemoryStick, HardDrive, Network, RefreshCw } from 'lucide-react';
import './SystemInfo.css';

function randBetween(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

interface Metric {
  label: string;
  value: number;
  color: string;
}

function Gauge({ value, color, label, unit = '%' }: { value: number; color: string; label: string; unit?: string }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = circ * (value / 100);
  const gap = circ - dash;

  return (
    <div className="gauge">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border-color)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          strokeDashoffset={circ * 0.25}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
        <text x="50" y="47" textAnchor="middle" fontSize="16" fontWeight="700" fill={color}>
          {value}
        </text>
        <text x="50" y="62" textAnchor="middle" fontSize="10" fill="var(--text-muted)">
          {unit}
        </text>
      </svg>
      <span className="gauge__label">{label}</span>
    </div>
  );
}

function Bar({ label, value, color, info }: { label: string; value: number; color: string; info: string }) {
  return (
    <div className="sysbar">
      <div className="sysbar__header">
        <span className="sysbar__label">{label}</span>
        <span className="sysbar__info">{info}</span>
      </div>
      <div className="sysbar__track">
        <div
          className="sysbar__fill"
          style={{
            width: `${value}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

export function SystemInfo() {
  const [cpu, setCpu]     = useState(randBetween(15, 45));
  const [mem, setMem]     = useState(randBetween(40, 65));
  const [disk, setDisk]   = useState(randBetween(35, 45));
  const [netIn, setNetIn] = useState(randBetween(10, 800));
  const [netOut, setNetOut] = useState(randBetween(5, 200));
  const [uptime] = useState('3d 7h 12m');
  const [temp, setTemp] = useState(randBetween(45, 72));

  const refresh = () => {
    setCpu(randBetween(10, 80));
    setMem(randBetween(35, 75));
    setDisk(randBetween(35, 45));
    setNetIn(randBetween(10, 1000));
    setNetOut(randBetween(5, 300));
    setTemp(randBetween(42, 75));
  };

  useEffect(() => {
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, []);

  const processes = [
    { name: 'nginx', cpu: randBetween(0, 5), mem: randBetween(50, 150) },
    { name: 'mariadb', cpu: randBetween(1, 8), mem: randBetween(200, 600) },
    { name: 'lgm-ui', cpu: randBetween(2, 12), mem: randBetween(300, 800) },
    { name: 'systemd', cpu: 0, mem: randBetween(10, 30) },
    { name: 'sshd', cpu: 0, mem: randBetween(5, 20) },
  ];

  return (
    <div className="sysinfo">
      {/* Header */}
      <div className="sysinfo__header">
        <span>Monitor del Sistema</span>
        <button className="sysinfo__refresh" onClick={refresh} title="Actualizar">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="sysinfo__body">
        {/* Gauges */}
        <div className="sysinfo__gauges">
          <Gauge value={cpu}  color="#ef4444" label="CPU" />
          <Gauge value={mem}  color="#3b82f6" label="RAM" />
          <Gauge value={disk} color="#10b981" label="Disco" />
          <Gauge value={temp} color="#f59e0b" label="Temp" unit="°C" />
        </div>

        {/* Bars */}
        <div className="sysinfo__bars">
          <Bar
            label={<><Cpu size={13} /> CPU</>}
            value={cpu}
            color="#ef4444"
            info={`${cpu}% — Intel Core i7-12700 × 8`}
          />
          <Bar
            label={<><MemoryStick size={13} /> Memoria</>}
            value={mem}
            color="#3b82f6"
            info={`${Math.round(mem * 0.16 * 10) / 10} GB / 16 GB`}
          />
          <Bar
            label={<><HardDrive size={13} /> Disco</>}
            value={disk}
            color="#10b981"
            info={`${Math.round(disk * 9.53)} GB / 953 GB`}
          />
        </div>

        {/* Network */}
        <div className="sysinfo__net">
          <div className="sysinfo__net-row">
            <Network size={14} />
            <span className="sysinfo__net-label">Red (eth0)</span>
            <span className="sysinfo__net-val" style={{ color: '#10b981' }}>↓ {netIn} KB/s</span>
            <span className="sysinfo__net-val" style={{ color: '#f59e0b' }}>↑ {netOut} KB/s</span>
          </div>
        </div>

        {/* Process list */}
        <div className="sysinfo__procs">
          <div className="sysinfo__procs-title">Procesos principales</div>
          <div className="sysinfo__procs-header">
            <span>Proceso</span><span>CPU %</span><span>Mem (MB)</span>
          </div>
          {processes.map((p) => (
            <div key={p.name} className="sysinfo__procs-row">
              <span className="sysinfo__proc-name">{p.name}</span>
              <span style={{ color: p.cpu > 10 ? '#ef4444' : 'var(--text-primary)' }}>{p.cpu}</span>
              <span>{p.mem}</span>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="sysinfo__footer">
          <span>Uptime: <strong>{uptime}</strong></span>
          <span>Hostname: <strong>lgmos</strong></span>
          <span>IP: <strong>192.168.1.100</strong></span>
        </div>
      </div>
    </div>
  );
}
