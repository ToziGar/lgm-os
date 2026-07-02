/**
 * LazyAppResolver — Resuelve y renderiza componentes de aplicaciones
 * de forma diferida (lazy loading) para Store Apps.
 *
 * Las Core Apps se cargan estáticamente.
 * Las Store Apps se cargan con React.lazy() + Suspense.
 */

import { lazy, Suspense } from 'react';
import { CORE_LOADERS, STORE_LOADERS } from '../../hooks/useAppLauncher';

interface LazyAppResolverProps {
  appId: string;
  fallback?: React.ReactNode;
}

/**
 * Loading placeholder mientras se carga una Store App
 */
function AppLoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 12,
      background: 'var(--bg-primary)',
    }}>
      <div className="lazy-spinner" />
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cargando aplicación…</span>
    </div>
  );
}

/**
 * Error boundary inline para apps que fallan al cargar
 */
function AppLoadError({ appId, onRetry }: { appId: string; onRetry?: () => void }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 12,
      padding: 20,
      textAlign: 'center',
      background: 'var(--bg-primary)',
    }}>
      <span style={{ fontSize: 32 }}>⚠️</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
        Error al cargar la aplicación
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        No se pudo cargar el módulo "{appId}".
      </span>
    </div>
  );
}

/**
 * Componente principal que resuelve qué renderizar para un appId.
 */
export function LazyAppResolver({ appId, fallback }: LazyAppResolverProps) {
  // 1. Try core apps first (sincrono)
  if (CORE_LOADERS[appId]) {
    const Component = CORE_LOADERS[appId];
    return <Component />;
  }

  // 2. Try store apps (lazy loading)
  const loader = STORE_LOADERS[appId];
  if (loader) {
    const LazyComponent = lazy(loader);
    return (
      <Suspense fallback={fallback ?? <AppLoadingFallback />}>
        <LazyComponent />
      </Suspense>
    );
  }

  // 3. Not found
  return <AppLoadError appId={appId} />;
}