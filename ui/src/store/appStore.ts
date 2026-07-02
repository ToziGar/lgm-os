/**
 * App Store — Gestión de instalación y estado de aplicaciones
 *
 * Controla qué Store Apps están instaladas, su estado y configuración.
 * Las Core Apps siempre están disponibles.
 */

import { create } from 'zustand';
import type { InstalledApp, AppInstallState } from '../types/app';
import { MANIFESTS, getManifest } from '../apps/manifests';
import { db } from './dbService';

interface AppStore {
  /* ─── Estado ─── */
  installedApps: InstalledApp[];

  /* ─── Acciones ─── */
  isInstalled: (manifestId: string) => boolean;
  getInstallState: (manifestId: string) => AppInstallState;
  installApp: (manifestId: string) => boolean;
  uninstallApp: (manifestId: string) => boolean;
  getInstalledManifests: () => typeof MANIFESTS;
  getAvailableForInstall: () => typeof MANIFESTS;
  getAppConfig: (manifestId: string) => Record<string, unknown> | undefined;
  setAppConfig: (manifestId: string, config: Record<string, unknown>) => void;
}

function loadInstalledApps(): InstalledApp[] {
  return db.getInstalledApps();
}

function saveInstalledApps(apps: InstalledApp[]) {
  db.setInstalledApps(apps);
}

export const useAppStore = create<AppStore>((set, get) => ({
  installedApps: loadInstalledApps(),

  isInstalled: (manifestId: string) => {
    // Core apps are always "installed"
    const manifest = getManifest(manifestId);
    if (manifest?.isCore) return true;
    return get().installedApps.some(a => a.manifestId === manifestId && a.installState === 'installed');
  },

  getInstallState: (manifestId: string): AppInstallState => {
    const manifest = getManifest(manifestId);
    if (manifest?.isCore) return 'builtin';
    const app = get().installedApps.find(a => a.manifestId === manifestId);
    return app?.installState ?? 'available';
  },

  installApp: (manifestId: string): boolean => {
    const manifest = getManifest(manifestId);
    if (!manifest || manifest.isCore) return false;
    if (get().isInstalled(manifestId)) return true;

    const newApp: InstalledApp = {
      manifestId,
      installState: 'installed',
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: {},
    };

    set(state => {
      const updated = [...state.installedApps.filter(a => a.manifestId !== manifestId), newApp];
      saveInstalledApps(updated);
      return { installedApps: updated };
    });
    return true;
  },

  uninstallApp: (manifestId: string): boolean => {
    const manifest = getManifest(manifestId);
    if (!manifest || manifest.isCore) return false;

    set(state => {
      const updated = state.installedApps.filter(a => a.manifestId !== manifestId);
      saveInstalledApps(updated);
      return { installedApps: updated };
    });
    return true;
  },

  getInstalledManifests: () => {
    const { installedApps } = get();
    const coreApps = MANIFESTS.filter(m => m.isCore);
    const storeInstalled = MANIFESTS.filter(m =>
      !m.isCore && installedApps.some(a => a.manifestId === m.id && a.installState === 'installed')
    );
    return [...coreApps, ...storeInstalled];
  },

  getAvailableForInstall: () => {
    const { installedApps } = get();
    const installedIds = new Set(
      installedApps.filter(a => a.installState === 'installed').map(a => a.manifestId)
    );
    return MANIFESTS.filter(m => !m.isCore && !installedIds.has(m.id));
  },

  getAppConfig: (manifestId: string) => {
    const app = get().installedApps.find(a => a.manifestId === manifestId);
    return app?.config;
  },

  setAppConfig: (manifestId: string, config: Record<string, unknown>) => {
    set(state => {
      const updated = state.installedApps.map(a =>
        a.manifestId === manifestId ? { ...a, config: { ...a.config, ...config } } : a
      );
      saveInstalledApps(updated);
      return { installedApps: updated };
    });
  },
}));