import { useState } from 'react';
import { Eye, EyeOff, Server } from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import './LoginScreen.css';

const QUICK_USERS = [
  { username: 'admin', label: 'Administrador', avatar: 'A', color: '#2d7bff' },
  { username: 'lgm',   label: 'LGM User',      avatar: 'L', color: '#00b87c' },
];

export function LoginScreen() {
  const { login, loginError } = useSystemStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const handleQuickUser = (u: typeof QUICK_USERS[0]) => {
    setSelectedUser(u.username);
    setUsername(u.username);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Small delay for UX (prevents instant feedback that leaks timing)
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
    const ok = login(username, password);
    setLoading(false);
    if (!ok) setPassword('');
  };

  return (
    <div className="login">
      <div className="login__bg" />

      {/* Server badge */}
      <div className="login__server-badge">
        <Server size={13} />
        <span>LGM-NAS-01</span>
        <span className="login__server-status" />
        <span>En línea</span>
      </div>

      <div className="login__card">
        {/* Logo */}
        <div className="login__logo">
          <div className="login__logo-icon">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="#2d7bff"/>
              <path d="M18 6L30 12V24L18 30L6 24V12L18 6Z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"/>
              <circle cx="18" cy="18" r="5" fill="white"/>
            </svg>
          </div>
          <div>
            <h1 className="login__logo-text">LGM<span>OS</span></h1>
            <p className="login__logo-sub">DiskStation Manager 1.0</p>
          </div>
        </div>

        {/* Quick user select */}
        <div className="login__users">
          {QUICK_USERS.map((u) => (
            <button
              key={u.username}
              className={`login__user-btn ${selectedUser === u.username ? 'login__user-btn--active' : ''}`}
              onClick={() => handleQuickUser(u)}
              type="button"
            >
              <span className="login__user-avatar" style={{ background: u.color }}>
                {u.avatar}
              </span>
              <span className="login__user-label">{u.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="login__form">
          <div className="login__field">
            <label className="login__label">Usuario</label>
            <input
              type="text"
              className="login__input"
              placeholder="Nombre de usuario"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setSelectedUser(null); }}
              autoComplete="username"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="login__field">
            <label className="login__label">Contraseña</label>
            <div className="login__pass-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                className="login__input login__input--pass"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="login__pass-eye"
                onClick={() => setShowPass((s) => !s)}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {loginError && (
            <p className="login__error">
              <span>⚠</span> {loginError}
            </p>
          )}

          <button type="submit" className="login__btn" disabled={loading}>
            {loading ? <span className="login__spinner" /> : 'Iniciar sesión'}
          </button>
        </form>

        <p className="login__hint">
          Demo: <strong>admin / admin</strong> · <strong>lgm / lgm</strong>
        </p>
      </div>

      <div className="login__footer">
        LGM OS 1.0 · Basado en Linux Debian 12 · © 2025 LGM Team
      </div>
    </div>
  );
}
