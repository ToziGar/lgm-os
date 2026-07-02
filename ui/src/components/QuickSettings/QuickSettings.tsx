import { useState } from 'react';
import {
  Wifi, WifiOff, Bluetooth, BluetoothConnected, Volume2, VolumeX,
  Sun, Moon, Monitor, Settings, LogOut, Bell, BellOff,
  Maximize, Minimize, RefreshCw, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import './QuickSettings.css';

interface QuickToggle {
  id: string;
  icon: React.ReactNode;
  iconOff: React.ReactNode;
  label: string;
  get: () => boolean;
  toggle: () => void;
}

export function QuickSettings({ onClose }: { onClose: () => void }) {
  const { theme, toggleTheme, logout, addNotification } = useSystemStore();
  const [wifiOn, setWifiOn] = useState(true);
  const [btOn, setBtOn] = useState(false);
  const [volume, setVolume] = useState(75);
  const [muted, setMuted] = useState(false);
  const [notifOn, setNotifOn] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [brightness, setBrightness] = useState(85);

  const toggles: QuickToggle[] = [
    {
      id: 'wifi',
      icon: <Wifi size={16} />,
      iconOff: <WifiOff size={16} />,
      label: 'Wi-Fi',
      get: () => wifiOn,
      toggle: () => { setWifiOn(v => !v); addNotification('Wi-Fi', wifiOn ? 'Wi-Fi desconectado' : 'Wi-Fi conectado', 'info'); },
    },
    {
      id: 'bluetooth',
      icon: <BluetoothConnected size={16} />,
      iconOff: <Bluetooth size={16} />,
      label: 'Bluetooth',
      get: () => btOn,
      toggle: () => { setBtOn(v => !v); addNotification('Bluetooth', btOn ? 'Bluetooth desactivado' : 'Bluetooth activado', 'info'); },
    },
    {
      id: 'notifications',
      icon: <Bell size={16} />,
      iconOff: <BellOff size={16} />,
      label: 'Notificaciones',
      get: () => notifOn,
      toggle: () => setNotifOn(v => !v),
    },
    {
      id: 'theme',
      icon: <Moon size={16} />,
      iconOff: <Sun size={16} />,
      label: 'Tema oscuro',
      get: () => theme === 'dark',
      toggle: () => toggleTheme(),
    },
    {
      id: 'fullscreen',
      icon: <Maximize size={16} />,
      iconOff: <Minimize size={16} />,
      label: 'Pantalla completa',
      get: () => fullscreen,
      toggle: () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          setFullscreen(true);
        } else {
          document.exitFullscreen().catch(() => {});
          setFullscreen(false);
        }
      },
    },
  ];

  return (
    <div className="qs__panel" onClick={e => e.stopPropagation()}>
      {/* User info */}
      <div className="qs__user">
        <div className="qs__avatar">A</div>
        <div className="qs__user-info">
          <span className="qs__user-name">Administrador</span>
          <span className="qs__user-role">admin</span>
        </div>
        <button className="qs__logout" onClick={() => { logout(); onClose(); }} title="Cerrar sesión">
          <LogOut size={14} />
        </button>
      </div>

      {/* Quick toggles */}
      <div className="qs__toggles">
        {toggles.map(t => (
          <button
            key={t.id}
            className={`qs__toggle ${t.get() ? 'qs__toggle--on' : ''}`}
            onClick={t.toggle}
          >
            {t.get() ? t.icon : t.iconOff}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Volume slider */}
      <div className="qs__slider-row">
        {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        <input
          type="range"
          className="qs__slider"
          min={0} max={100}
          value={muted ? 0 : volume}
          onChange={e => { setVolume(Number(e.target.value)); setMuted(false); }}
        />
        <span className="qs__slider-val">{muted ? 0 : volume}%</span>
      </div>

      {/* Brightness slider */}
      <div className="qs__slider-row">
        <Sun size={14} />
        <input
          type="range"
          className="qs__slider"
          min={10} max={100}
          value={brightness}
          onChange={e => setBrightness(Number(e.target.value))}
        />
        <span className="qs__slider-val">{brightness}%</span>
      </div>

      {/* Status info */}
      <div className="qs__status">
        <div className="qs__status-row">
          <span>IP</span>
          <span className="qs__status-val">192.168.1.100</span>
        </div>
        <div className="qs__status-row">
          <span>Uptime</span>
          <span className="qs__status-val">3d 7h 12m</span>
        </div>
        <div className="qs__status-row">
          <span>CPU</span>
          <span className="qs__status-val">12%</span>
        </div>
        <div className="qs__status-row">
          <span>RAM</span>
          <span className="qs__status-val">6.2 / 16 GB</span>
        </div>
      </div>
    </div>
  );
}