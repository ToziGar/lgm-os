import { useState, useEffect } from 'react';
import { useWindowStore } from './store/windowStore';
import { useSystemStore, needsSetup } from './store/systemStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SetupScreen } from './components/SetupScreen/SetupScreen';
import { LoginScreen } from './components/LoginScreen/LoginScreen';
import { Desktop } from './components/Desktop/Desktop';
import { Taskbar } from './components/Taskbar/Taskbar';
import { LaunchPad } from './components/LaunchPad/LaunchPad';
import { AppWindow } from './components/Window/Window';
import { Notifications } from './components/Notifications/Notifications';
import { LazyAppResolver } from './components/Window/LazyAppResolver';
import { GlobalSearch } from './components/GlobalSearch/GlobalSearch';
import { QuickSettings } from './components/QuickSettings/QuickSettings';

/**
 * Renderiza el componente de una aplicación dado su appId.
 * Usa LazyAppResolver que carga Core Apps de forma síncrona
 * y Store Apps con React.lazy() + Suspense.
 */
function renderApp(appId: string) {
  return <LazyAppResolver appId={appId} />;
}

export default function App() {
  const { isLoggedIn, theme } = useSystemStore();
  const { windows } = useWindowStore();
  const requiresSetup = needsSetup();
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);

  // Ctrl+Space / Ctrl+K for global search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === ' ') || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        if (isLoggedIn) setShowGlobalSearch(v => !v);
      }
      if (e.key === 'Escape') {
        setShowGlobalSearch(false);
        setShowQuickSettings(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isLoggedIn]);

  return (
    <ErrorBoundary>
    <div data-theme={theme} style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {!isLoggedIn ? (
        requiresSetup ? <SetupScreen /> : <LoginScreen />
      ) : (
        <>
          <Desktop />

          {/* Window layer — bounds for react-rnd */}
          <div
            id="window-layer"
            style={{
              position: 'fixed',
              inset: 0,
              bottom: 'var(--taskbar-height)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {windows.map((win) => (
              <AppWindow key={win.id} window={win}>
                {renderApp(win.appId)}
              </AppWindow>
            ))}
          </div>

          <Taskbar
            onOpenSearch={() => setShowGlobalSearch(true)}
            onOpenSettings={() => setShowQuickSettings(true)}
          />
          <LaunchPad />
          <Notifications />

          {/* Global Search overlay */}
          {showGlobalSearch && (
            <GlobalSearch onClose={() => setShowGlobalSearch(false)} />
          )}

          {/* Quick Settings panel */}
          {showQuickSettings && (
            <>
              <div className="qs__backdrop" onClick={() => setShowQuickSettings(false)} />
              <div style={{ position: 'fixed', bottom: 'calc(var(--taskbar-height) + 8px)', right: 8, zIndex: 9999 }}>
                <QuickSettings onClose={() => setShowQuickSettings(false)} />
              </div>
            </>
          )}
        </>
      )}
    </div>
    </ErrorBoundary>
  );
}