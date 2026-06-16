import { useState, useEffect, useMemo } from 'react';
import {
  Monitor, Cpu, MemoryStick as Memory, HardDrive, Wifi, Thermometer,
  Clock, Server, ChevronRight, Activity, Database, Network,
} from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import { useStorageStore } from '../../store/storageStore';
import { db } from '../../store/dbService';
import './SystemInfo.css';

/* ─── Helpers ─── */
function R(min: number, max: number) { return min + Math.random() * (max - min); }
function GB(val: number) { return val >= 1000 ? `${(val/1000).toFixed(1)} TB` : `${Math.round(val)} GB`; }
function pct(val: number, total: number) { return total ? Math.round((val / total) * 100) : 0; }

function MetricCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="si__card">
      <div className="si__card-icon" style={color ? { color } : {}}>{icon}</div>
      <div className="si__card-info">
        <span className="si__card-label">{label}</span>
        <span className="si__card-value">{value}</span>
        {sub && <span className="si__card-sub">{sub}</span>}
      </div>
    </div>
  );
}

function ProgressBar({ val, color = '#6366f1', label }: { val: number; color?: string; label?: string }) {
  return (
    <div className="si__progress-wrap">
      {label && <span className="si__progress-label">{label}</span>}
      <div className="si__progress-track">
        <div className="si__progress-fill" style={{ width: `${Math.min(100, Math.max(0, val))}%`, background: color }}/>
      </div>
      <span className="si__progress-val">{Math.round(val)}%</span>
    </div>
  );
}

export function SystemInfo() {
  const { user } = useSystemStore();
  const { disks, volumes, folders, getFreeDiskSpace } = useStorageStore();
  const netConfig = useMemo(() => db.getNetworkConfig(), []);
  const sshConfig = useMemo(() => db.getSSHConfig(), []);

  /* ─── Live simulated metrics ─── */
  const [cpu, setCpu] = useState(R(8, 35));
  const [memPct, setMemPct] = useState(R(28, 52));
  const [diskPct, setDiskPct] = useState(R(33, 48));
  const [netIn, setNetIn] = useState(R(20, 350));
  const [netOut, setNetOut] = useState(R(5, 120));
  const [temp, setTemp] = useState(R(42, 62));

  useEffect(() => {
    const t = setInterval(() => {
      setCpu(p => Math.max(0, Math.min(100, p + (R(-8, 8)))));
      setMemPct(p => Math.max(5, Math.min(95, p + (R(-4, 4)))));
      setDiskPct(p => Math.max(10, Math.min(90, p + (R(-2, 2)))));
      setNetIn(p => Math.max(0, p + (R(-50, 80))));
      setNetOut(p => Math.max(0, p + (R(-20, 40))));
      setTemp(p => Math.max(30, Math.min(75, p + (R(-3, 3)))));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  /* ─── Uptime ─── */
  const [uptime, setUptime] = useState(3 * 86400 + 7 * 3600 + 12 * 60);
  useEffect(() => {
    const t = setInterval(() => setUptime(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const fmtUptime = (s: number) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${d}d ${h}h ${m}m ${ss}s`;
  };

  /* ─── Derived storage data ─── */
  const space = getFreeDiskSpace();
  const totalDisks = disks.length;
  const healthyDisks = disks.filter(d => d.status === 'healthy').length;
  const warnDisks = disks.filter(d => d.status === 'warning').length;
  const failingDisks = disks.filter(d => d.status === 'failing' || d.status === 'failed').length;

  const totalVols = volumes.length;
  const okVols = volumes.filter(v => v.status === 'normal').length;

  /* ─── Network from DB ─── */
  const activeIface = netConfig.interfaces.find(i => i.enabled && i.status === 'connected') || netConfig.interfaces[0];

  return (
    <div className="si">
      {/* Header */}
      <div className="si__header">
        <div className="si__header-left">
          <div className="si__badge">
            <Server size={16} />
            <span>{netConfig.hostname}</span>
            <span className={`si__status-dot ${activeIface?.status === 'connected' ? 'si__status-dot--ok' : ''}`}/>
            <span className="si__status-txt">{activeIface?.status === 'connected' ? 'En línea' : 'Desconectado'}</span>
          </div>
        </div>
        <div className="si__header-right">
          <span className="si__header-item"><Clock size={12}/> {fmtUptime(uptime)}</span>
          <span className="si__header-item"><Server size={12}/> Kernel 6.1.0-lgm-amd64</span>
        </div>
      </div>

      {/* Live metrics row */}
      <div className="si__cards">
        <MetricCard icon={<Cpu size={20}/>} label="CPU" value={`${Math.round(cpu)}%`} sub="8 cores" color="#6366f1"/>
        <MetricCard icon={<Memory size={20}/>} label="RAM" value={`${Math.round(memPct)}%`} sub={GB(space.total)} color="#10b981"/>
        <MetricCard icon={<HardDrive size={20}/>} label="Disco" value={`${Math.round(diskPct)}%`} sub={`${GB(space.used)} / ${GB(space.total)}`} color="#f59e0b"/>
        <MetricCard icon={<Network size={20}/>} label="Red" value={`↓${Math.round(netIn)} KB/s`} sub={`↑${Math.round(netOut)} KB/s`} color="#06b6d4"/>
        <MetricCard icon={<Thermometer size={20}/>} label="Temp" value={`${Math.round(temp)}°C`} sub="CPU" color={temp > 60 ? '#ef4444' : '#8b5cf6'}/>
      </div>

      {/* Progress bars */}
      <div className="si__bars">
        <ProgressBar val={cpu} color="#6366f1" label="CPU"/>
        <ProgressBar val={memPct} color="#10b981" label="RAM"/>
        <ProgressBar val={diskPct} color="#f59e0b" label="Disco"/>
      </div>

      {/* Storage summary */}
      <div className="si__section">
        <h4 className="si__section-title"><Database size={14}/> Almacenamiento</h4>
        <div className="si__table">
          <div className="si__row">
            <span>Discos físicos</span>
            <span>{totalDisks} total · {healthyDisks} OK{failingDisks > 0 && ` · ${failingDisks} fallo`}</span>
          </div>
          <div className="si__row">
            <span>Volúmenes</span>
            <span>{okVols}/{totalVols} activos</span>
          </div>
          <div className="si__row">
            <span>Espacio usado</span>
            <span>{GB(space.used)} / {GB(space.total)} ({pct(space.used, space.total)}%)</span>
          </div>
          <div className="si__row">
            <span>Carpetas compartidas</span>
            <span>{folders.length}</span>
          </div>
        </div>

        {/* Disk list */}
        <div className="si__disk-list">
          {disks.map(d => (
            <div key={d.id} className={`si__disk-row si__disk-row--${d.status}`}>
              <HardDrive size={12}/>
              <span className="si__disk-model">{d.model}</span>
              <span className="si__disk-serial">{d.serial}</span>
              <span className="si__disk-slot">Slot {d.slot}</span>
              <span>{d.temp}°C</span>
              <span className="si__disk-health">SMART {d.smart.health}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Network info */}
      <div className="si__section">
        <h4 className="si__section-title"><Wifi size={14}/> Red</h4>
        <div className="si__table">
          {netConfig.interfaces.map(iface => (
            <div key={iface.id} className={`si__row ${!iface.enabled ? 'si__row--disabled' : ''}`}>
              <span>{iface.name} ({iface.type})</span>
              <span>{iface.status === 'connected' ? `${iface.ip} · ${iface.speed}` : iface.status}</span>
            </div>
          ))}
          <div className="si__row">
            <span>DNS</span>
            <span>{activeIface?.dns1 || '8.8.8.8'}{activeIface?.dns2 ? `, ${activeIface.dns2}` : ''}</span>
          </div>
          <div className="si__row">
            <span>Gateway</span>
            <span>{activeIface?.gateway || '192.168.1.1'}</span>
          </div>
          <div className="si__row">
            <span>Hostname</span>
            <span>{netConfig.hostname}.{netConfig.domain}</span>
          </div>
        </div>
      </div>

      {/* SSH info */}
      <div className="si__section">
        <h4 className="si__section-title"><Activity size={14}/> SSH</h4>
        <div className="si__table">
          <div className="si__row">
            <span>Estado</span>
            <span className={sshConfig.enabled ? 'si__val--ok' : 'si__val--muted'}>{sshConfig.enabled ? 'Habilitado' : 'Deshabilitado'}</span>
          </div>
          {sshConfig.enabled && (
            <>
              <div className="si__row"><span>Puerto</span><span>{sshConfig.port}</span></div>
              <div className="si__row"><span>Sesiones activas</span><span>{sshConfig.activeSessions.length}</span></div>
              <div className="si__row"><span>Autenticación</span><span>{sshConfig.passwordAuth ? 'Password + ' : ''}{sshConfig.pubkeyAuth ? 'Public Key' : ''}{!sshConfig.passwordAuth && !sshConfig.pubkeyAuth ? 'Deshabilitada' : ''}</span></div>
            </>
          )}
        </div>
      </div>

      {/* User info */}
      <div className="si__section">
        <h4 className="si__section-title"><Server size={14}/> Sistema</h4>
        <div className="si__table">
          <div className="si__row"><span>Versión</span><span>LGM OS 1.0.0 (Debian 12 Bookworm)</span></div>
          <div className="si__row"><span>Arquitectura</span><span>x86_64</span></div>
          <div className="si__row"><span>Usuario actual</span><span>{user?.displayName || 'admin'}</span></div>
          <div className="si__row"><span>Usuarios en el sistema</span><span>{db.getUsers().length}</span></div>
          <div className="si__row"><span>Tiempo encendido</span><span>{fmtUptime(uptime)}</span></div>
        </div>
      </div>
    </div>
  );
}