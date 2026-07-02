/**
 * Sistema de Registro de Aplicaciones — LGM OS
 * Arquitectura Modular con Core Apps y Store Apps (Lazy Loaded)
 */

export type AppCategory =
  | 'system'
  | 'storage'
  | 'network'
  | 'security'
  | 'users'
  | 'multimedia'
  | 'productivity'
  | 'development'
  | 'tools'
  | 'backup'
  | 'virtualization';

export type AppInstallState = 'builtin' | 'installed' | 'available' | 'updating';

export interface AppPermission {
  resource: string;       // e.g. "storage:volumes", "users:manage", "network:interfaces"
  access: 'read' | 'write' | 'admin';
}

export interface AppManifest {
  id: string;
  name: string;
  icon: string;
  description: string;
  tagline?: string;
  version: string;

  /* ─── Clasificación ─── */
  category: AppCategory;
  isCore: boolean;           // true = siempre disponible, false = desde Package Center

  /* ─── Ventana ─── */
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  color: string;
  singleInstance: boolean;   // true = solo una ventana abierta a la vez

  /* ─── Lazy Loading ─── */
  componentPath: string;     // Ruta para dynamic import, e.g. "./store/FileStation/index.tsx"
  lazy: boolean;             // true = se carga con React.lazy()

  /* ─── Dependencias ─── */
  permissions: AppPermission[];
  requires?: string[];       // IDs de otras apps requeridas
  minRam?: string;           // e.g. "512 MB"
  size?: string;             // e.g. "2.4 MB"

  /* ─── Store Metadata ─── */
  publisher?: string;
  homepage?: string;
  license?: string;
  screenshots?: string[];
  rating?: number;           // 1-5
  pulls?: string;            // e.g. "50K+"
  changelog?: string;
}

export interface InstalledApp {
  manifestId: string;
  installState: AppInstallState;
  installedAt?: string;
  updatedAt?: string;
  config?: Record<string, unknown>;
}

/**
 * Resultado de la resolución de una app para lanzamiento
 */
export interface AppLaunchResult {
  manifest: AppManifest;
  Component: React.LazyExoticComponent<React.ComponentType<any>> | React.ComponentType<any>;
}