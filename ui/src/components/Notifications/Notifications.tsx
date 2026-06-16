import { X, Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import './Notifications.css';

const TYPE_ICON: Record<string, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
};

export function Notifications() {
  const { showNotifications, notifications, toggleNotifications, markAllRead, clearNotifications } =
    useSystemStore();

  if (!showNotifications) return null;

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <div className="notif-overlay" onClick={toggleNotifications} />
      <div className="notif-panel">
        <div className="notif-header">
          <div className="notif-header__left">
            <Bell size={16} />
            <span>Notificaciones</span>
            {unread > 0 && <span className="notif-count">{unread}</span>}
          </div>
          <div className="notif-header__actions">
            {unread > 0 && (
              <button className="notif-action-btn" onClick={markAllRead} title="Marcar todo como leído">
                <CheckCheck size={15} />
              </button>
            )}
            {notifications.length > 0 && (
              <button className="notif-action-btn" onClick={clearNotifications} title="Limpiar todo">
                <Trash2 size={15} />
              </button>
            )}
            <button className="notif-action-btn" onClick={toggleNotifications}>
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="notif-empty">
              <Bell size={28} />
              <p>Sin notificaciones</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`notif-item notif-item--${n.type} ${n.read ? 'notif-item--read' : ''}`}
              >
                <span className="notif-item__icon">{TYPE_ICON[n.type]}</span>
                <div className="notif-item__body">
                  <p className="notif-item__title">{n.title}</p>
                  <p className="notif-item__msg">{n.message}</p>
                  <p className="notif-item__time">
                    {n.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!n.read && <span className="notif-item__dot" />}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
