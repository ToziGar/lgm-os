import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Server, Key, Copy, RefreshCw,
  CheckCircle2, AlertCircle, Terminal, Shield,
} from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import { db, type StoredSSHConfig } from '../../store/dbService';
import './SSHManager.css';

/* ─── Types ─── */
interface SSHConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  authType: 'password' | 'key';
  keyName?: string;
  group: string;
  lastConnected?: string;
  status: 'idle' | 'connecting' | 'connected' | 'error';
}

interface SSHKeyLocal {
  id: string;
  name: string;
  type: 'RSA' | 'ED25519' | 'ECDSA';
  bits?: number;
  fingerprint: string;
  comment: string;
  createdAt: string;
  publicKey: string;
}

/* ─── Load persisted connections from dbService ─── */
function loadSSHConnections(): SSHConnection[] {
  try {
    const raw = localStorage.getItem('lgmos-ssh-connections');
    if (raw) return JSON.parse(raw);
  } catch { /* corrupted data, use defaults */ }
  return [
    { id: '1', name: 'LGM NAS (local)', host: '192.168.1.100', port: 22, user: 'admin', authType: 'key' as const, keyName: 'id_ed25519', group: 'Local', lastConnected: '16/06/2025 14:32', status: 'idle' as const },
    { id: '2', name: 'Servidor Backup', host: '192.168.1.101', port: 22, user: 'admin', authType: 'key' as const, keyName: 'id_ed25519', group: 'Local', status: 'idle' as const },
    { id: '3', name: 'VPS Producción', host: '45.76.10.22', port: 22, user: 'ubuntu', authType: 'key' as const, keyName: 'vps_key', group: 'Remoto', status: 'idle' as const },
  ];
}
function saveSSHConnections(conns: SSHConnection[]) {
  localStorage.setItem('lgmos-ssh-connections', JSON.stringify(conns));
}

function loadSSHKeys(): SSHKeyLocal[] {
  const cfg = db.getSSHConfig();
  return cfg.authorizedKeys.map(k => ({
    id: k.id,
    name: k.name,
    type: (k.type === 'ed25519' ? 'ED25519' : k.type === 'rsa' ? 'RSA' : 'ECDSA') as SSHKeyLocal['type'],
    fingerprint: 'SHA256:' + k.key.slice(0, 20).replace(/\W/g, 'AbCdEfGhIj'),
    comment: k.name,
    createdAt: k.createdAt || '01/01/2025',
    publicKey: k.key,
  }));
}

/* ─── Terminal Panel ─── */
interface TLine { type: 'input' | 'output' | 'error' | 'system'; text: string; }

function SSHTerminalPanel({ conn, onClose }: { conn: SSHConnection; onClose: () => void }) {
  const [lines, setLines] = useState<TLine[]>([
    { type: 'system', text: `Conectando a ${conn.user}@${conn.host}:${conn.port}…` },
    { type: 'system', text: `Autenticando con clave…` },
    { type: 'output', text: `Bienvenido a LGM OS (Debian GNU/Linux 12)` },
    { type: 'output', text: `Último inicio de sesión: ${new Date().toLocaleString('es-ES')}` },
    { type: 'output', text: `Sistema: ${conn.host} | Uptime: 3d 7h 12m` },
    { type: 'output', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('~');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'auto' }); }, [lines]);
  const prompt = `${conn.user}@${conn.host.split('.').slice(-1)[0]}:${cwd}$ `;

  const runCmd = useCallback((raw: string): TLine[] | null => {
    const parts = raw.trim().split(/\s+/);
    const [cmd, ...args] = parts;
    const out = (t: string): TLine => ({ type: 'output', text: t });
    const err = (t: string): TLine => ({ type: 'error', text: t });
    const sys = (t: string): TLine => ({ type: 'system', text: t });
    switch (cmd) {
      case '': return [];
      case 'help': return [out('Comandos: ls, cd, pwd, cat, echo, whoami, uname, uptime, date, df, free, ps,'), out('          ip, ss, ping, systemctl, docker, zpool, zfs, env, history, clear, exit')];
      case 'ls': return [out('Documentos  Descargas  Imágenes  .bashrc  .ssh  lgm-os  README.md')];
      case 'cd': { const t = args[0] || '~'; setCwd(t === '..' ? (cwd.split('/').slice(0,-1).join('/')||'~') : t.startsWith('/') ? t : '~'); return []; }
      case 'pwd': return [out(cwd.replace('~', `/home/${conn.user}`))];
      case 'whoami': return [out(conn.user)];
      case 'hostname': return [out(conn.host.split('.')[0] ?? conn.host)];
      case 'date': return [out(new Date().toString())];
      case 'uptime': return [out(`up 3 days, 7:12, 1 user, load average: 0.12, 0.18, 0.15`)];
      case 'df': return [out('Filesystem      Size  Used Avail Use% Mounted on'), out('/dev/sda1      931G  370G  562G  40% /')];
      case 'free': return [out('              total    used    free   shared   buff/cache'), out('Mem:          16384    6200    8000     140       2100'), out('Swap:         2048       0    2048')];
      case 'ps': return [out('  PID TTY     TIME CMD'), out(' 1024 ?     00:00:05 nginx'), out(' 1128 ?     00:00:18 mariadbd'), out(' 2048 pts/0 00:00:00 bash')];
      case 'ip': return [out('eth0: inet ' + conn.host + '/24 brd 192.168.1.255')];
      case 'zpool': return [out('NAME   SIZE  ALLOC  FREE  HEALTH'), out('tank   14.6T  4.7T  9.8T  ONLINE')];
      case 'clear': return null;
      case 'exit': onClose(); return [];
      default: return [err(`bash: ${cmd}: command not found`)];
    }
  }, [cwd, conn, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = runCmd(input.trim());
    if (result === null) { setLines([]); }
    else { setLines(prev => [...prev, { type: 'input', text: `${prompt}${input}` }, ...result]); }
    if (input.trim()) setHistory(h => [input, ...h].slice(0, 100));
    setInput(''); setHistIdx(-1);
  };

  return (
    <div className="ssh-term">
      <div className="ssh-term__header">
        <Server size={13}/> <span>{conn.name}</span>
        <span className="ssh-term__host">{conn.user}@{conn.host}</span>
        <button className="ssh-term__close" onClick={onClose}>✕</button>
      </div>
      <div className="ssh-term__output" onClick={() => inputRef.current?.focus()}>
        {lines.map((l, i) => (<div key={i} className={`ssh-term__line ssh-term__line--${l.type}`}>{l.text}</div>))}
        <div ref={endRef}/>
      </div>
      <form className="ssh-term__input-row" onSubmit={handleSubmit}>
        <span className="ssh-term__prompt">{prompt}</span>
        <input ref={inputRef} className="ssh-term__input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key==='ArrowUp') { const i=Math.min(histIdx+1,history.length-1); setHistIdx(i); setInput(history[i]??''); } if (e.key==='ArrowDown') { const i=Math.max(histIdx-1,-1); setHistIdx(i); setInput(i<0?'':history[i]); } }}
          autoFocus spellCheck={false} autoComplete="off"/>
      </form>
    </div>
  );
}

/* ─── Main component ─── */
type SSHTab = 'connections' | 'keys' | 'settings';

export function SSHManager() {
  const { addNotification } = useSystemStore();
  const [tab, setTab] = useState<SSHTab>('connections');
  const [conns, setConns] = useState<SSHConnection[]>(loadSSHConnections);
  const [keys, setKeys] = useState<SSHKeyLocal[]>(loadSSHKeys);
  const [sshCfg, setSshCfg] = useState<StoredSSHConfig>(db.getSSHConfig);

  const [activeConn, setActiveConn] = useState<SSHConnection | null>(null);
  const [showNewConn, setShowNewConn] = useState(false);
  const [newConn, setNewConn] = useState({ name: '', host: '', port: '22', user: 'admin' });

  /* ─── Persist helpers ─── */
  const persistConns = (updated: SSHConnection[]) => { setConns(updated); saveSSHConnections(updated); };
  const persistCfg = (cfg: StoredSSHConfig) => { setSshCfg(cfg); db.setSSHConfig(cfg); };

  const connect = (conn: SSHConnection) => {
    const updated = conns.map(c => c.id === conn.id ? { ...c, status: 'connecting' as const } : c);
    persistConns(updated);
    setTimeout(() => {
      const done = updated.map(c => c.id === conn.id ? { ...c, status: 'connected' as const, lastConnected: new Date().toLocaleString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) } : c);
      persistConns(done);
      const connected = done.find(c => c.id === conn.id);
      if (connected) setActiveConn(connected);
      // Add to active sessions in config
      const cfg = db.getSSHConfig();
      const newSession = { id: 'sess-' + Date.now(), user: conn.user, ip: conn.host, loginAt: new Date().toISOString(), idle: '0m' };
      cfg.activeSessions = [...cfg.activeSessions.filter(s => s.user !== conn.user), newSession];
      db.setSSHConfig(cfg);
    }, 800);
  };

  const disconnect = (id: string) => {
    persistConns(conns.map(c => c.id === id ? { ...c, status: 'idle' as const } : c));
    if (activeConn?.id === id) setActiveConn(null);
    addNotification('SSH desconectado', 'Sesión cerrada correctamente', 'info');
  };

  const addConn = () => {
    if (!newConn.host.trim()) return;
    const c: SSHConnection = { id: Date.now().toString(), name: newConn.name || newConn.host, host: newConn.host, port: parseInt(newConn.port)||22, user: newConn.user, authType: 'password', group: 'Nuevo', status: 'idle' };
    persistConns([...conns, c]);
    addNotification('Conexión añadida', `${c.name} guardado en la lista`, 'success');
    setShowNewConn(false); setNewConn({ name: '', host: '', port: '22', user: 'admin' });
  };

  const deleteConn = (id: string) => {
    persistConns(conns.filter(c => c.id !== id));
    if (activeConn?.id === id) setActiveConn(null);
    addNotification('Conexión eliminada', 'Eliminada de la lista', 'warning');
  };

  const copyPubKey = (key: SSHKeyLocal) => {
    navigator.clipboard.writeText(key.publicKey).catch(() => {});
    addNotification('Clave copiada', `${key.name} copiada al portapapeles`, 'info');
  };

  const groups = [...new Set(conns.map(c => c.group))];

  return (
    <div className="ssh">
      {/* Left panel */}
      <div className="ssh__left">
        <div className="ssh__left-header">
          <div className="ssh__tabs">
            <button className={`ssh__tab ${tab === 'connections' ? 'ssh__tab--active' : ''}`} onClick={() => setTab('connections')}><Terminal size={12}/> Conexiones</button>
            <button className={`ssh__tab ${tab === 'keys' ? 'ssh__tab--active' : ''}`} onClick={() => setTab('keys')}><Key size={12}/> Claves</button>
            <button className={`ssh__tab ${tab === 'settings' ? 'ssh__tab--active' : ''}`} onClick={() => setTab('settings')}><Shield size={12}/> Config</button>
          </div>
          {tab === 'connections' && <button className="ssh__add-btn" onClick={() => setShowNewConn(v => !v)} title="Nueva conexión"><Plus size={14}/></button>}
        </div>

        {tab === 'connections' && (
          <>
            {showNewConn && (
              <div className="ssh__new-form">
                <input className="ssh__input" placeholder="Nombre (opcional)" value={newConn.name} onChange={e => setNewConn(p=>({...p, name: e.target.value}))}/>
                <input className="ssh__input" placeholder="Host / IP *" value={newConn.host} onChange={e => setNewConn(p=>({...p, host: e.target.value}))} autoFocus/>
                <div className="ssh__new-row">
                  <input className="ssh__input ssh__input--sm" placeholder="Puerto" value={newConn.port} onChange={e => setNewConn(p=>({...p, port: e.target.value}))}/>
                  <input className="ssh__input" placeholder="Usuario" value={newConn.user} onChange={e => setNewConn(p=>({...p, user: e.target.value}))}/>
                </div>
                <div className="ssh__new-actions">
                  <button className="ssh__action-btn ssh__action-btn--primary" onClick={addConn}>Guardar</button>
                  <button className="ssh__action-btn" onClick={() => setShowNewConn(false)}>Cancelar</button>
                </div>
              </div>
            )}
            {groups.map(group => (
              <div key={group} className="ssh__group">
                <div className="ssh__group-label">{group}</div>
                {conns.filter(c => c.group === group).map(conn => (
                  <button key={conn.id} className={`ssh__conn-item ${activeConn?.id === conn.id ? 'ssh__conn-item--active' : ''}`}
                    onClick={() => activeConn?.id === conn.id ? null : connect(conn)}>
                    <div className="ssh__conn-indicator" data-status={conn.status}/>
                    <div className="ssh__conn-info">
                      <span className="ssh__conn-name">{conn.name}</span>
                      <span className="ssh__conn-host">{conn.user}@{conn.host}:{conn.port}</span>
                    </div>
                    <button className="ssh__icon-btn ssh__icon-btn--del" onClick={e => { e.stopPropagation(); deleteConn(conn.id); }} title="Eliminar"><Trash2 size={11}/></button>
                    {conn.status === 'connecting' && <RefreshCw size={12} className="ssh__spin"/>}
                    {conn.status === 'connected'  && <CheckCircle2 size={13} style={{ color: '#00b87c', flexShrink: 0 }}/>}
                    {conn.status === 'error'      && <AlertCircle size={13} style={{ color: '#ef4444', flexShrink: 0 }}/>}
                  </button>
                ))}
              </div>
            ))}
          </>
        )}

        {tab === 'keys' && (
          <div className="ssh__keys-list">
            {keys.map(key => (
              <div key={key.id} className="ssh__key-item">
                <div className="ssh__key-icon"><Key size={14}/></div>
                <div className="ssh__key-info">
                  <span className="ssh__key-name">{key.name}</span>
                  <span className="ssh__key-fp">{key.fingerprint}</span>
                </div>
                <button className="ssh__icon-btn" onClick={() => copyPubKey(key)} title="Copiar clave"><Copy size={12}/></button>
              </div>
            ))}
          </div>
        )}

        {tab === 'settings' && (
          <div className="ssh__settings">
            <h4>Configuración del servidor SSH</h4>
            <label className="ssh__set-row">
              <input type="checkbox" checked={sshCfg.enabled} onChange={() => persistCfg({ ...sshCfg, enabled: !sshCfg.enabled })}/>
              Habilitar SSH
            </label>
            {sshCfg.enabled && (
              <>
                <label className="ssh__set-row">
                  <span>Puerto</span>
                  <input className="ssh__input ssh__input--sm" type="number" value={sshCfg.port} onChange={e => persistCfg({ ...sshCfg, port: parseInt(e.target.value) || 22 })}/>
                </label>
                <label className="ssh__set-row">
                  <input type="checkbox" checked={sshCfg.permitRootLogin} onChange={() => persistCfg({ ...sshCfg, permitRootLogin: !sshCfg.permitRootLogin })}/>
                  Permitir login root
                </label>
                <label className="ssh__set-row">
                  <input type="checkbox" checked={sshCfg.passwordAuth} onChange={() => persistCfg({ ...sshCfg, passwordAuth: !sshCfg.passwordAuth })}/>
                  Autenticación por contraseña
                </label>
                <label className="ssh__set-row">
                  <input type="checkbox" checked={sshCfg.pubkeyAuth} onChange={() => persistCfg({ ...sshCfg, pubkeyAuth: !sshCfg.pubkeyAuth })}/>
                  Autenticación por clave pública
                </label>
                <label className="ssh__set-row">
                  <span>Sesiones máx.</span>
                  <input className="ssh__input ssh__input--sm" type="number" value={sshCfg.maxSessions} onChange={e => persistCfg({ ...sshCfg, maxSessions: parseInt(e.target.value) || 10 })}/>
                </label>
              </>
            )}
            <p className="ssh__set-hint">{sshCfg.activeSessions.length} sesión(es) activa(s)</p>
          </div>
        )}
      </div>

      {/* Right panel — terminal or empty */}
      <div className="ssh__right">
        {activeConn ? (
          <SSHTerminalPanel conn={activeConn} onClose={() => { disconnect(activeConn.id); }}/>
        ) : (
          <div className="ssh__empty">
            <Server size={36} style={{ color: 'var(--text-muted)' }}/>
            <p>Selecciona una conexión para abrir un terminal SSH</p>
            <p className="ssh__empty-sub">Haz clic en cualquier servidor de la lista</p>
          </div>
        )}
      </div>
    </div>
  );
}