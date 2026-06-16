import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[LGM-OS] Error capturado por ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            background: '#0f172a',
            color: '#e2e8f0',
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '2rem',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#f87171' }}>
            Error inesperado
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1.5rem', textAlign: 'center', maxWidth: '500px' }}>
            Ha ocurrido un error crítico en la aplicación. Puedes intentar recargar la interfaz.
          </p>
          <details style={{ marginBottom: '1.5rem', maxWidth: '600px', width: '100%' }}>
            <summary style={{ cursor: 'pointer', color: '#64748b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Detalles técnicos
            </summary>
            <pre
              style={{
                background: '#1e293b',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#f87171',
                overflow: 'auto',
                maxHeight: '200px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error?.message || 'Error desconocido'}
              {'\n\n'}
              {this.state.error?.stack || 'Sin stack trace'}
            </pre>
          </details>
          <button
            onClick={this.handleReload}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: 600,
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#4f46e5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#6366f1')}
          >
            Recargar aplicación
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}