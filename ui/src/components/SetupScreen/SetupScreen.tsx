import { useState } from 'react';
import { Server, ChevronRight, User, Lock, Mail, Check, Shield } from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import './SetupScreen.css';

export function SetupScreen() {
  const { setupStep, setSetupStep, createAdmin } = useSystemStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const err = createAdmin(username, password, confirm, email);
    if (err) setError(err);
  };

  return (
    <div className="setup">
      <div className="setup__bg" />

      <div className="setup__card">
        {/* Logo */}
        <div className="setup__logo">
          <div className="setup__logo-icon">
            <svg width="48" height="48" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="#2d7bff" />
              <path d="M18 6L30 12V24L18 30L6 24V12L18 6Z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
              <circle cx="18" cy="18" r="5" fill="white" />
            </svg>
          </div>
          <div>
            <h1 className="setup__logo-text">LGM<span>OS</span></h1>
            <p className="setup__logo-sub">Asistente de instalación</p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="setup__steps">
          <div className={`setup__step ${setupStep === 'welcome' ? 'setup__step--active' : setupStep === 'admin' || setupStep === 'complete' ? 'setup__step--done' : ''}`}>
            <span className="setup__step-num">1</span>
            <span className="setup__step-label">Bienvenida</span>
          </div>
          <div className="setup__step-line" />
          <div className={`setup__step ${setupStep === 'admin' ? 'setup__step--active' : setupStep === 'complete' ? 'setup__step--done' : ''}`}>
            <span className="setup__step-num">2</span>
            <span className="setup__step-label">Administrador</span>
          </div>
          <div className="setup__step-line" />
          <div className={`setup__step ${setupStep === 'complete' ? 'setup__step--active' : ''}`}>
            <span className="setup__step-num">3</span>
            <span className="setup__step-label">Finalizar</span>
          </div>
        </div>

        {/* Step 1: Welcome */}
        {setupStep === 'welcome' && (
          <div className="setup__content">
            <div className="setup__welcome-icon">
              <Server size={48} strokeWidth={1.5} />
            </div>
            <h2 className="setup__title">Bienvenido a LGM OS</h2>
            <p className="setup__desc">
              Este asistente te guiará en la configuración inicial del sistema.
              Crearemos la cuenta de administrador para gestionar tu NAS.
            </p>
            <ul className="setup__features">
              <li><Shield size={16} /> Gestión completa de usuarios y permisos</li>
              <li><Server size={16} /> Almacenamiento con ZFS, RAID y volúmenes</li>
              <li><Lock size={16} /> Seguridad avanzada SSH, VPN y firewall</li>
            </ul>
            <button className="setup__btn" onClick={() => setSetupStep('admin')}>
              Comenzar <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Create Admin */}
        {setupStep === 'admin' && (
          <form className="setup__content" onSubmit={handleCreate}>
            <h2 className="setup__title">Crear cuenta de administrador</h2>
            <p className="setup__desc">
              Esta cuenta tendrá acceso total al sistema. Elige un nombre de usuario y una contraseña segura.
            </p>

            <div className="setup__field">
              <label className="setup__label">
                <User size={14} /> Nombre de usuario
              </label>
              <input
                type="text"
                className="setup__input"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="setup__field">
              <label className="setup__label">
                <Lock size={14} /> Contraseña
              </label>
              <div className="setup__pass-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="setup__input setup__input--pass"
                  placeholder="Mínimo 4 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="setup__pass-toggle" onClick={() => setShowPass((s) => !s)} tabIndex={-1}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="setup__field">
              <label className="setup__label">
                <Lock size={14} /> Confirmar contraseña
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                className="setup__input"
                placeholder="Repite la contraseña"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            <div className="setup__field">
              <label className="setup__label">
                <Mail size={14} /> Correo electrónico (opcional)
              </label>
              <input
                type="email"
                className="setup__input"
                placeholder="admin@mi-nas.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && <p className="setup__error">⚠ {error}</p>}

            <div className="setup__actions">
              <button type="button" className="setup__btn setup__btn--secondary" onClick={() => setSetupStep('welcome')}>
                Volver
              </button>
              <button type="submit" className="setup__btn">
                Crear administrador
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Complete */}
        {setupStep === 'complete' && (
          <div className="setup__content setup__content--center">
            <div className="setup__check">
              <Check size={40} strokeWidth={3} />
            </div>
            <h2 className="setup__title">Instalación completada</h2>
            <p className="setup__desc">
              El sistema está listo. Serás redirigido al escritorio en unos segundos...
            </p>
          </div>
        )}
      </div>

      <div className="setup__footer">
        LGM OS 1.0 · Basado en Linux Debian 12
      </div>
    </div>
  );
}