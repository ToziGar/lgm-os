import { useState } from 'react';
import { useSystemStore } from '../../store/systemStore';
import './LoginScreen.css';

export function LoginScreen() {
  const { login } = useSystemStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor ingresa usuario y contraseña');
      return;
    }
    setLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 600));
    const ok = login(username, password);
    setLoading(false);
    if (!ok) {
      setError('Usuario o contraseña incorrectos');
      setPassword('');
    }
  };

  return (
    <div className="login">
      <div className="login__bg" />

      <div className="login__card">
        <div className="login__logo">
          <span className="login__logo-icon">⬡</span>
          <h1 className="login__logo-text">LGM<span>OS</span></h1>
        </div>

        <p className="login__subtitle">Sistema Operativo Personalizado</p>

        <form onSubmit={handleSubmit} className="login__form">
          <div className="login__field">
            <label className="login__label">Usuario</label>
            <input
              type="text"
              className="login__input"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="login__field">
            <label className="login__label">Contraseña</label>
            <input
              type="password"
              className="login__input"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && <p className="login__error">{error}</p>}

          <button type="submit" className="login__btn" disabled={loading}>
            {loading ? (
              <span className="login__spinner" />
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <p className="login__hint">
          Demo: <strong>admin / admin</strong> o <strong>lgm / lgm</strong>
        </p>
      </div>

      <div className="login__footer">
        LGM OS 1.0 — Basado en Linux Debian
      </div>
    </div>
  );
}
