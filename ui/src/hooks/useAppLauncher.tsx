/**
 * useAppLauncher — Hook para lanzamiento modular de aplicaciones
 *
 * Resuelve el AppManifest y carga el componente correspondiente
 * con lazy loading para Store Apps o import directo para Core Apps.
 *
 * Uso:
 *   const { launch, isReady } = useAppLauncher();
 *   <button onClick={() => launch('file-station')}>Abrir File Station</button>
 */

import { useCallback } from 'react';
import { useWindowStore } from '../store/windowStore';
import { useAppStore } from '../store/appStore';
import { getManifest } from '../apps/manifests';

/**
 * Mapa de componentes Core cargados estáticamente.
 * Store Apps se resuelven con React.lazy().
 */
import { ControlPanel } from '../apps/ControlPanel/ControlPanel';
import { SystemInfo } from '../apps/SystemInfo/SystemInfo';
import { TaskManager } from '../apps/TaskManager/TaskManager';
import { LogCenter } from '../apps/LogCenter/LogCenter';
import { StorageManager } from '../apps/StorageManager/StorageManager';
import { ZFSPanel } from '../apps/ZFSPanel/ZFSPanel';
import { NetworkServices } from '../apps/NetworkServices/NetworkServices';
import { SSHManager } from '../apps/SSHManager/SSHManager';
import { VPNManager } from '../apps/VPNManager/VPNManager';
import { UserManager } from '../apps/UserManager/UserManager';

const CORE_LOADERS: Record<string, React.ComponentType<any>> = {
  'control-panel': ControlPanel,
  'system-info': SystemInfo,
  'task-manager': TaskManager,
  'log-center': LogCenter,
  'storage-manager': StorageManager,
  'zfs-panel': ZFSPanel,
  'network-services': NetworkServices,
  'ssh-manager': SSHManager,
  'vpn-manager': VPNManager,
  'user-manager': UserManager,
};

/**
 * Mapas de carga perezosa para Store Apps.
 * Cada app se importa dinámicamente solo cuando el usuario la abre.
 */
const STORE_LOADERS: Record<string, () => Promise<{ default: React.ComponentType<any> }>> = {
  'terminal': () => import('../apps/Terminal/Terminal'),
  'text-editor': () => import('../apps/TextEditor/TextEditor'),
  'calculator': () => import('../apps/Calculator/Calculator'),
  'file-station': () => import('../apps/FileStation/FileStation'),
  'package-center': () => import('../apps/PackageCenter/PackageCenter'),
  'photo-station': () => import('../apps/PhotoStation/PhotoStation'),
  'note-station': () => import('../apps/NoteStation/NoteStation'),
  'music-player': () => import('../apps/MusicPlayer/MusicPlayer'),
};

export interface AppLauncherResult {
  launch: (appId: string) => Promise<void>;
  launchWithComponent: (appId: string, component: React.ComponentType<any>) => void;
  isReady: boolean;
  getComponent: (appId: string) => React.ComponentType<any> | null;
}

/**
 * Renderiza una aplicación dado su appId.
 * Usado por App.tsx para el renderizado real.
 */
export function renderAppById(appId: string): React.ReactNode {
  // Try core first
  if (CORE_LOADERS[appId]) {
    const Component = CORE_LOADERS[appId];
    return <Component />;
  }
  // For store apps, we return null here — the window will handle lazy loading
  return null;
}

/**
 * Obtiene un componente Core de forma síncrona.
 */
export function getCoreComponent(appId: string): React.ComponentType<any> | null {
  return CORE_LOADERS[appId] ?? null;
}

/**
 * Obtiene un loader para lazy import de Store Apps.
 */
export function getStoreLoader(appId: string): (() => Promise<{ default: React.ComponentType<any> }>) | null {
  return STORE_LOADERS[appId] ?? null;
}

/**
 * Hook principal para lanzar aplicaciones.
 * Verifica instalación, resuelve el manifiesto y abre la ventana.
 */
export function useAppLauncher(): AppLauncherResult {
  const { openWindow } = useWindowStore();
  const { isInstalled, installApp } = useAppStore();

  const launch = useCallback(async (appId: string) => {
    const manifest = getManifest(appId);
    if (!manifest) {
      console.warn(`[AppLauncher] No manifest found for "${appId}"`);
      return;
    }

    // Auto-install core apps (they're always available)
    if (!manifest.isCore) {
      const installed = isInstalled(appId);
      if (!installed) {
        // Attempt to install — if it's a store app not yet installed
        const success = installApp(appId);
        if (!success) {
          console.warn(`[AppLauncher] Cannot launch "${appId}": not installed and cannot install`);
          return;
        }
      }
    }

    // Open window — the component will be lazy-loaded by the Window/LazyAppResolver
    openWindow(
      manifest.id,
      manifest.name,
      manifest.icon,
      manifest.defaultWidth,
      manifest.defaultHeight,
      manifest.minWidth,
      manifest.minHeight,
    );
  }, [openWindow, isInstalled, installApp]);

  const launchWithComponent = useCallback((appId: string, component: React.ComponentType<any>) => {
    const manifest = getManifest(appId);
    if (!manifest) return;
    openWindow(
      manifest.id,
      manifest.name,
      manifest.icon,
      manifest.defaultWidth,
      manifest.defaultHeight,
      manifest.minWidth,
      manifest.minHeight,
    );
  }, [openWindow]);

  const getComponent = useCallback((appId: string): React.ComponentType<any> | null => {
    return CORE_LOADERS[appId] ?? null;
  }, []);

  return {
    launch,
    launchWithComponent,
    isReady: true,
    getComponent,
  };
}

export { CORE_LOADERS, STORE_LOADERS };