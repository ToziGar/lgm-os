import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, Server, Key, Copy, RefreshCw, CheckCircle2, AlertCircle, Terminal, Download } from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
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

interface SSHKey {
  id: string;
  name: string;
  type: 'RSA' | 'ED25519' | 'ECDSA';
  bits?: number;
  fingerprint: string;
  comment: string;
  createdAt: string;
  publicKey: string;
}

const INITIAL_CONNS: SSHConnection[] = [
  { id: '1', name: 'Servidor Principal',  host: '192.168.1.100', port: 22, user: 'admin', authType: 'key',      keyName: 'id_ed25519', group: 'Local', lastConnected: '16/06/2025 14:32', status: 'idle' },
  { id: '2', name: 'Servidor Backup',     host: '192.168.1.101', port: 22, user: 'admin', authType: 'key',      keyName: 'id_ed25519', group: 'Local', lastConnected: '10/06/2025 08:12', status: 'idle' },
  { id: '3', name: 'VPS Producción',      host: '45.76.10.22',   port: 22, user: 'ubuntu', authType: 'key',     keyName: 'vps_key',    group: 'Remoto', lastConnected: '14/06/2025 19:45', status: 'idle' },
  { id: '4', name: 'Pi-hole',             host: '192.168.1.50',  port: 22, user: 'pi',     authType: 'password',                        group: 'Local', status: 'idle' },
];

const INITIAL_KEYS: SSHKey[] = [
  { id: '1', name: 'id_ed25519', type: 'ED25519', fingerprint: 'SHA256:AbCdEfGhIjKlMn1234567890', comment: 'admin@lgmos', createdAt: '01/01/2025', publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDxyz... admin@lgmos' },
  { id: '2', name: 'id_rsa',     type: 'RSA',     bits: 4096,  fingerprint: 'SHA256:XyZaBcDeFg0987654321',    comment: 'admin@lgmos', createdAt: '15/03/2025', publicKey: 'ssh-rsa AAAAB3NzaC1yc2EAAA... admin@lgmos' },
  { id: '3', name: 'vps_key',    type: 'ED25519', fingerprint: 'SHA256:QwErTyUiOp1122334455',       comment: 'vps-prod',     createdAt: '20/04/2025', publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1... vps-prod' },
];

/* ─── Line types for terminal ─── */
interface TLine { type: 'input' | 'output' | 'error' | 'system'; text: string; }

/* ─── SSH Terminal Panel ─── */
function SSHTerminalPanel({ conn, onClose }: { conn: SSHConnection; onClose: () => void }) {
  const [lines, setLines] = useState<TLine[]>([
    { type: 'system', text: `Conectando a ${conn.user}@${conn.host}:${conn.port}…` },
    { type: 'system', text: `Verificando clave de host… ED25519 SHA256:AbCdEfGhIj` },
    { type: 'output', text: `Bienvenido a LGM OS (Debian GNU/Linux 12)` },
    { type: 'output', text: `Último acceso: lun 16 jun 14:32:05 2025 desde 192.168.1.200` },
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

  const runCmd = useCallback((raw: string): TLine[] => {
    const [cmd, ...args] = raw.trim().split(/\s+/);
    switch (cmd) {
      case '': return [];
      case 'help': return [
        { type: 'output', text: 'ls, cd, pwd, cat, echo, whoami, uname, uptime, df, free, ps, top, exit' }
      ];
      case 'ls': return [{ type: 'output', text: (
        cwd === '~' ? 'Documentos  Descargas  Imágenes  .bashrc  .ssh  lgm-os'
        : 'authorized_keys  config  id_ed25519  id_ed25519.pub  known_hosts'
      )}];
      case 'cd': {
        const t = args[0] || '~';
        setCwd(t === '..' ? (cwd.split('/').slice(0,-1).join('/') || '~') : t === '~' ? '~' : `${cwd}/${t}`);
        return [];
      }
      case 'pwd': return [{ type: 'output', text: cwd.replace('~', `/home/${conn.user}`) }];
      case 'whoami': return [{ type: 'output', text: conn.user }];
      case 'uname': return [{ type: 'output', text: args.includes('-a') ? `Linux ${conn.host.split('.').join('')}-nas 6.1.0-lgm-amd64 #1 SMP x86_64 GNU/Linux` : 'Linux' }];
      case 'uptime': return [{ type: 'output', text: ' 14:32:10 up 3 days, 7:12,  1 user,  load average: 0.12, 0.18, 0.15' }];
      case 'df': return [
        { type: 'output', text: 'Filesystem      1K-blocks      Used Available Use% Mounted on' },
        { type: 'output', text: '/dev/sda1       976762584 387145320 589617264  40% /' },
      ];
      case 'free': return [
        { type: 'output', text: '               total      used       free' },
        { type: 'output', text: 'Mem:        16384000   6214400   10169600' },
      ];
      case 'ps': return [
        { type: 'output', text: '  PID TTY          TIME CMD' },
        { type: 'output', text: ' 1024 ?        00:00:05 nginx' },
        { type: 'output', text: ' 1128 ?        00:00:18 mariadb' },
        { type: 'output', text: ' 2048 pts/0    00:00:00 bash' },
      ];
      case 'echo': return [{ type: 'output', text: args.join(' ') }];
      case 'clear': return null as any;
      case 'exit': onClose(); return [];
      default: return [{ type: 'error', text: `bash: ${cmd}: command not found` }];
    }
  }, [cwd, conn, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    const result = runCmd(cmd);
    if (result === null) {
      setLines([]);
    } else {
      setLines(prev => [...prev, { type: 'input', text: `${prompt}${cmd}` }, ...result]);
    }
    if (cmd) setHistory(h => [cmd, ...h].slice(0, 100));
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
        {lines.map((l, i) => (
          <div key={i} className={`ssh-term__line ssh-term__line--${l.type}`}>{l.text}</div>
        ))}
        <div ref={endRef}/>
      </div>
      <form className="ssh-term__input-row" onSubmit={handleSubmit}>
        <span className="ssh-term__prompt">{prompt}</span>
        <input
          ref={inputRef}
          className="ssh-term__input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'ArrowUp') { const i = Math.min(histIdx+1, history.length-1); setHistIdx(i); setInput(history[i]??''); }
            if (e.key === 'ArrowDown') { const i = Math.max(histIdx-1, -1); setHistIdx(i); setInput(i<0?'':history[i]); }
          }}
          autoFocus spellCheck={false} autoComplete="off"
        />
      </form>
    </div>
  );
}

/* ─── Main component ─── */
type SSHTab = 'connections' | 'keys';

export function SSHManager() {
  const { addNotification } = useSystemStore();
  const [tab, setTab] = useState<SSHTab>('connections');
  const [conns, setConns] = useState<SSHConnection[]>(INITIAL_CONNS);
  const [keys]  = useState<SSHKey[]>(INITIAL_KEYS);
  const [activeConn, setActiveConn] = useState<SSHConnection | null>(null);
  const [showNewConn, setShowNewConn] = useState(false);
  const [newConn, setNewConn] = useState({ name: '', host: '', port: '22', user: 'admin' });

  const connect = (conn: SSHConnection) => {
    setConns(prev => prev.map(c => c.id === conn.id ? { ...c, status: 'connecting' } : c));
    setTimeout(() => {
      setConns(prev => prev.map(c => c.id === conn.id ? { ...c, status: 'connected', lastConnected: new Date().toLocaleString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) } : c));
      setActiveConn({ ...conn, status: 'connected' });
    }, 800);
  };

  const disconnect = (id: string) => {
    setConns(prev => prev.map(c => c.id === id ? { ...c, status: 'idle' } : c));
    if (activeConn?.id === id) setActiveConn(null);
    addNotification('SSH desconectado', 'Sesión cerrada correctamente', 'info');
  };

  const addConn = () => {
    if (!newConn.host.trim()) return;
    const c: SSHConnection = { id: Date.now().toString(), name: newConn.name || newConn.host, host: newConn.host, port: parseInt(newConn.port)||22, user: newConn.user, authType: 'password', group: 'Nuevo', status: 'idle' };
    setConns(prev => [...prev, c]);
    addNotification('Conexión añadida', `${c.name} guardado en la lista`, 'success');
    setShowNewConn(false); setNewConn({ name: '', host: '', port: '22', user: 'admin' });
  };

  const copyPubKey = (key: SSHKey) => {
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
          </div>
          {tab === 'connections' && (
            <button className="ssh__add-btn" onClick={() => setShowNewConn(v => !v)} title="Nueva conexión"><Plus size={14}/></button>
          )}
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
                  <button
                    key={conn.id}
                    className={`ssh__conn-item ${activeConn?.id === conn.id ? 'ssh__conn-item--active' : ''}`}
                    onClick={() => activeConn?.id === conn.id ? null : connect(conn)}
                  >
                    <div className="ssh__conn-indicator" data-status={conn.status}/>
                    <div className="ssh__conn-info">
                      <span className="ssh__conn-name">{conn.name}</span>
                      <span className="ssh__conn-host">{conn.user}@{conn.host}:{conn.port}</span>
                    </div>
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
                  <span className="ssh__key-meta">{key.type}{key.bits ? ` ${key.bits}` : ''} · {key.comment}</span>
                  <span className="ssh__key-fp">{key.fingerprint}</span>
                </div>
                <button className="ssh__icon-btn" onClick={() => copyPubKey(key)} title="Copiar clave pública"><Copy size={12}/></button>
              </div>
            ))}
            <button className="ssh__gen-btn"><Plus size={13}/> Generar nueva clave</button>
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
