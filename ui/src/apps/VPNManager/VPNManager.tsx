import { useState } from 'react';
import { Shield, Plus, Trash2, Settings, RefreshCw, Download, AlertCircle } from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import './VPNManager.css';

/* ─── Types ─── */
type VPNProtocol = 'WireGuard' | 'OpenVPN' | 'IKEv2' | 'L2TP/IPSec';
type VPNStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface VPNProfile {
  id: string;
  name: string;
  protocol: VPNProtocol;
  server: string;
  port: number;
  status: VPNStatus;
  user?: string;
  lastConnected?: string;
  bytesIn: number;
  bytesOut: number;
  duration?: string;
  location: string;
}

const INITIAL_PROFILES: VPNProfile[] = [
  {
    id: '1', name: 'VPN Casa',       protocol: 'WireGuard', server: 'vpn.lgmos.local',  port: 51820,
    status: 'disconnected', location: '🏠 Local',     bytesIn: 0,    bytesOut: 0,
  },
  {
    id: '2', name: 'VPN Oficina',    protocol: 'WireGuard', server: '45.76.10.22',       port: 51820,
    status: 'connected',    location: '🏢 Remoto',    bytesIn: 1024*1024*142, bytesOut: 1024*1024*38,
    lastConnected: '16/06/2025 12:45', duration: '01:47:32',
  },
  {
    id: '3', name: 'OpenVPN EU',     protocol: 'OpenVPN',   server: 'eu1.vpnserver.com', port: 1194,
    status: 'disconnected', location: '🇪🇺 Europa',   bytesIn: 0,    bytesOut: 0,
  },
  {
    id: '4', name: 'Acceso Remoto',  protocol: 'IKEv2',     server: 'ike.lgmos.net',    port: 500,
    status: 'error',        location: '🌍 Internet',  bytesIn: 0,    bytesOut: 0,
  },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type NavTab = 'profiles' | 'wg-config' | 'logs';

/* ─── WireGuard config view ─── */
function WGConfig() {
  const { addNotification } = useSystemStore();
  const [peers] = useState([
    { name: 'iPhone de Admin',   pubkey: 'abc123XYZ...', ip: '10.0.0.2/32', keepalive: 25, allowed: '0.0.0.0/0' },
    { name: 'Laptop Trabajo',    pubkey: 'def456ABC...', ip: '10.0.0.3/32', keepalive: 25, allowed: '192.168.1.0/24' },
    { name: 'Servidor Backup',   pubkey: 'ghi789DEF...', ip: '10.0.0.4/32', keepalive: 0,  allowed: '10.0.0.0/8' },
  ]);
  const [serverConfig] = useState({
    interface: 'wg0',
    address: '10.0.0.1/24',
    port: 51820,
    dns: '1.1.1.1, 8.8.8.8',
    persistentKeepalive: true,
  });

  const downloadConfig = () => {
    const cfg = `[Interface]\nAddress = ${serverConfig.address}\nListenPort = ${serverConfig.port}\nDNS = ${serverConfig.dns}\nPrivateKey = <HIDDEN>\n\n# Peers:\n${peers.map(p => `[Peer]\n# ${p.name}\nPublicKey = ${p.pubkey}\nAllowedIPs = ${p.ip}\nPersistentKeepalive = ${p.keepalive}`).join('\n\n')}`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([cfg], { type: 'text/plain' }));
    a.download = 'wg0.conf';
    a.click();
    addNotification('Configuración descargada', 'wg0.conf exportado correctamente', 'success');
  };

  return (
    <div className="vpn__section">
      <div className="vpn__section-header">
        <h3>Configuración WireGuard</h3>
        <button className="vpn__btn" onClick={downloadConfig}><Download size={13}/> Exportar wg0.conf</button>
      </div>

      {/* Server config */}
      <div className="vpn__wg-server">
        <div className="vpn__info-title">Servidor (wg0)</div>
        <div className="vpn__info-grid">
          <div className="vpn__info-row"><span>Interfaz</span><code>{serverConfig.interface}</code></div>
          <div className="vpn__info-row"><span>Dirección</span><code>{serverConfig.address}</code></div>
          <div className="vpn__info-row"><span>Puerto</span><code>UDP {serverConfig.port}</code></div>
          <div className="vpn__info-row"><span>DNS</span><code>{serverConfig.dns}</code></div>
          <div className="vpn__info-row"><span>Clave pública</span><code>abc123XYZ...pub (click para copiar)</code></div>
        </div>
      </div>

      {/* Peers */}
      <div className="vpn__info-title">Peers conectados</div>
      <div className="vpn__peers-table">
        <div className="vpn__peers-header">
          <span>Nombre</span><span>IP Asignada</span><span>Clave pública</span><span>IPs permitidas</span><span>Keepalive</span>
        </div>
        {peers.map(p => (
          <div key={p.name} className="vpn__peers-row">
            <span className="vpn__peer-name">{p.name}</span>
            <code>{p.ip}</code>
            <code className="vpn__key-truncate">{p.pubkey}</code>
            <code>{p.allowed}</code>
            <span>{p.keepalive > 0 ? `${p.keepalive}s` : '—'}</span>
          </div>
        ))}
      </div>
      <button className="vpn__btn vpn__btn--primary" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
        <Plus size={13}/> Añadir peer
      </button>
    </div>
  );
}

export function VPNManager() {
  const { addNotification } = useSystemStore();
  const [tab, setTab] = useState<NavTab>('profiles');
  const [profiles, setProfiles] = useState<VPNProfile[]>(INITIAL_PROFILES);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newProto, setNewProto] = useState<VPNProtocol>('WireGuard');
  const [newServer, setNewServer] = useState('');

  const toggleConnect = (id: string) => {
    const prof = profiles.find(p => p.id === id)!;
    const wasConnected = prof.status === 'connected';

    setProfiles(prev => prev.map(p => p.id === id ? { ...p, status: 'connecting' } : p));
    setTimeout(() => {
      setProfiles(prev => prev.map(p =>
        p.id === id
          ? {
              ...p,
              status: wasConnected ? 'disconnected' : 'connected',
              duration: wasConnected ? undefined : '00:00:00',
              lastConnected: wasConnected ? p.lastConnected : new Date().toLocaleString('es-ES'),
              bytesIn:  wasConnected ? 0 : 0,
              bytesOut: wasConnected ? 0 : 0,
            }
          : p
      ));
      addNotification(
        wasConnected ? `${prof.name} desconectado` : `${prof.name} conectado`,
        wasConnected ? 'Túnel VPN cerrado' : `Conectado via ${prof.protocol}`,
        wasConnected ? 'info' : 'success'
      );
    }, 1200);
  };

  const addProfile = () => {
    if (!newServer.trim()) return;
    const prof: VPNProfile = {
      id: Date.now().toString(),
      name: newName || newServer,
      protocol: newProto,
      server: newServer,
      port: newProto === 'WireGuard' ? 51820 : newProto === 'OpenVPN' ? 1194 : 500,
      status: 'disconnected',
      location: '🌍 Nuevo',
      bytesIn: 0, bytesOut: 0,
    };
    setProfiles(prev => [...prev, prof]);
    addNotification('Perfil VPN añadido', `${prof.name} (${prof.protocol})`, 'success');
    setShowNew(false); setNewName(''); setNewServer('');
  };

  const deleteProfile = (id: string, name: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    addNotification('Perfil eliminado', name, 'warning');
  };

  const TABS = [
    { id: 'profiles' as NavTab, label: 'Perfiles' },
    { id: 'wg-config' as NavTab, label: 'WireGuard' },
    { id: 'logs' as NavTab, label: 'Registros' },
  ];

  return (
    <div className="vpn">
      {/* Sidebar */}
      <div className="vpn__sidebar">
        <div className="vpn__sidebar-logo">
          <div className="vpn__sidebar-logo-icon"><Shield size={18}/></div>
          <span>VPN Manager</span>
        </div>
        {TABS.map(t => (
          <button key={t.id} className={`vpn__nav-item ${tab === t.id ? 'vpn__nav-item--active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}

        {/* Active connection summary */}
        {profiles.filter(p => p.status === 'connected').map(p => (
          <div key={p.id} className="vpn__active-badge">
            <div className="vpn__active-dot"/>
            <div>
              <p className="vpn__active-name">{p.name}</p>
              <p className="vpn__active-meta">{p.protocol} · {p.duration}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="vpn__main">
        {tab === 'profiles' && (
          <div className="vpn__section">
            <div className="vpn__section-header">
              <h3>Perfiles VPN</h3>
              <button className="vpn__btn vpn__btn--primary" onClick={() => setShowNew(v => !v)}>
                <Plus size={13}/> Nuevo perfil
              </button>
            </div>

            {showNew && (
              <div className="vpn__new-form">
                <input className="vpn__input" placeholder="Nombre del perfil" value={newName} onChange={e => setNewName(e.target.value)} autoFocus/>
                <input className="vpn__input" placeholder="Servidor / IP *" value={newServer} onChange={e => setNewServer(e.target.value)}/>
                <select className="vpn__input" value={newProto} onChange={e => setNewProto(e.target.value as VPNProtocol)}>
                  <option>WireGuard</option>
                  <option>OpenVPN</option>
                  <option>IKEv2</option>
                  <option>L2TP/IPSec</option>
                </select>
                <button className="vpn__btn vpn__btn--primary" onClick={addProfile}>Guardar</button>
                <button className="vpn__btn" onClick={() => setShowNew(false)}>Cancelar</button>
              </div>
            )}

            <div className="vpn__profiles-list">
              {profiles.map(prof => (
                <div key={prof.id} className={`vpn__profile-card ${prof.status === 'connected' ? 'vpn__profile-card--connected' : ''}`}>
                  <div className="vpn__profile-top">
                    <div className="vpn__profile-icon">
                      <Shield size={18} style={{ color: prof.status === 'connected' ? '#00b87c' : 'var(--text-muted)' }}/>
                    </div>
                    <div className="vpn__profile-info">
                      <span className="vpn__profile-name">{prof.name}</span>
                      <span className="vpn__profile-meta">{prof.protocol} · {prof.server}:{prof.port}</span>
                      <span className="vpn__profile-location">{prof.location}</span>
                    </div>
                    <div className="vpn__profile-right">
                      {prof.status === 'error' && <AlertCircle size={14} style={{ color: 'var(--color-error)' }}/>}
                      <button
                        className={`vpn__connect-btn ${prof.status === 'connected' ? 'vpn__connect-btn--on' : ''}`}
                        onClick={() => toggleConnect(prof.id)}
                        disabled={prof.status === 'connecting'}
                      >
                        {prof.status === 'connecting' ? (
                          <><RefreshCw size={12} className="vpn__spin"/> Conectando</>
                        ) : prof.status === 'connected' ? (
                          'Desconectar'
                        ) : 'Conectar'}
                      </button>
                    </div>
                  </div>

                  {prof.status === 'connected' && (
                    <div className="vpn__profile-stats">
                      <div className="vpn__stat-item"><span>Duración</span><strong>{prof.duration}</strong></div>
                      <div className="vpn__stat-item"><span>↓ Recibido</span><strong>{formatBytes(prof.bytesIn)}</strong></div>
                      <div className="vpn__stat-item"><span>↑ Enviado</span><strong>{formatBytes(prof.bytesOut)}</strong></div>
                      <div className="vpn__stat-item"><span>IP túnel</span><strong>10.0.0.2</strong></div>
                    </div>
                  )}

                  {prof.lastConnected && prof.status !== 'connected' && (
                    <div className="vpn__last-connected">Último acceso: {prof.lastConnected}</div>
                  )}

                  <div className="vpn__profile-footer">
                    <span className={`vpn__status-badge vpn__status-badge--${prof.status}`}>{prof.status}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                      <button className="vpn__icon-btn" title="Configuración"><Settings size={12}/></button>
                      <button className="vpn__icon-btn vpn__icon-btn--danger" title="Eliminar" onClick={() => deleteProfile(prof.id, prof.name)}><Trash2 size={12}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'wg-config' && <WGConfig/>}

        {tab === 'logs' && (
          <div className="vpn__section">
            <div className="vpn__section-header"><h3>Registros VPN</h3></div>
            <div className="vpn__log-entries">
              {[
                { time: '14:32:10', msg: 'wg0: Handshake complete with peer abc123XYZ', ok: true },
                { time: '14:32:08', msg: 'wg0: Initiating handshake with 45.76.10.22:51820', ok: true },
                { time: '14:32:07', msg: 'wg0: Resolving endpoint 45.76.10.22:51820', ok: true },
                { time: '12:10:22', msg: 'wg0: Session expired — timeout 180s, reconnecting', ok: false },
                { time: '08:00:01', msg: 'ike0: No route to host ike.lgmos.net — connection failed', ok: false },
                { time: '07:58:15', msg: 'wg0: Peer def456ABC disconnected (received 0 bytes/5 min)', ok: true },
                { time: '00:00:01', msg: 'wg-quick: Loaded configuration from /etc/wireguard/wg0.conf', ok: true },
              ].map((l, i) => (
                <div key={i} className={`vpn__log-row ${!l.ok ? 'vpn__log-row--error' : ''}`}>
                  <span className="vpn__log-time">{l.time}</span>
                  <span className="vpn__log-msg">{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
