import { useWindowStore } from './store/windowStore';
import { useSystemStore } from './store/systemStore';
import { LoginScreen } from './components/LoginScreen/LoginScreen';
import { Desktop } from './components/Desktop/Desktop';
import { Taskbar } from './components/Taskbar/Taskbar';
import { LaunchPad } from './components/LaunchPad/LaunchPad';
import { AppWindow } from './components/Window/Window';
import { Notifications } from './components/Notifications/Notifications';
import { FileStation } from './apps/FileStation/FileStation';
import { ControlPanel } from './apps/ControlPanel/ControlPanel';
import { PackageCenter } from './apps/PackageCenter/PackageCenter';
import { Terminal } from './apps/Terminal/Terminal';
import { TextEditor } from './apps/TextEditor/TextEditor';
import { SystemInfo } from './apps/SystemInfo/SystemInfo';
import { Calculator } from './apps/Calculator/Calculator';
import { NetworkServices } from './apps/NetworkServices/NetworkServices';
import { SSHManager } from './apps/SSHManager/SSHManager';
import { TaskManager } from './apps/TaskManager/TaskManager';
import { LogCenter } from './apps/LogCenter/LogCenter';
import { VPNManager } from './apps/VPNManager/VPNManager';
import { UserManager } from './apps/UserManager/UserManager';
import { StorageManager } from './apps/StorageManager/StorageManager';

function renderApp(appId: string) {
  switch (appId) {
    case 'file-station':      return <FileStation />;
    case 'control-panel':     return <ControlPanel />;
    case 'package-center':    return <PackageCenter />;
    case 'terminal':          return <Terminal />;
    case 'text-editor':       return <TextEditor />;
    case 'system-info':       return <SystemInfo />;
    case 'calculator':        return <Calculator />;
    case 'network-services':  return <NetworkServices />;
    case 'ssh-manager':       return <SSHManager />;
    case 'task-manager':      return <TaskManager />;
    case 'log-center':        return <LogCenter />;
    case 'vpn-manager':       return <VPNManager />;
    case 'user-manager':      return <UserManager />;
    case 'storage-manager':   return <StorageManager />;
    default: return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        Aplicación no encontrada
      </div>
    );
  }
}

export default function App() {
  const { isLoggedIn, theme } = useSystemStore();
  const { windows } = useWindowStore();

  return (
    <div data-theme={theme} style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {!isLoggedIn ? (
        <LoginScreen />
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

          <Taskbar />
          <LaunchPad />
          <Notifications />
        </>
      )}
    </div>
  );
}
