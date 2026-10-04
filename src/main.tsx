import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { IonApp, setupIonicReact } from '@ionic/react';
import App from './App.tsx';
import './index.css';

setupIonicReact();

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class RootErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[BañosTour ErrorBoundary]', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', backgroundColor: '#0f172a', color: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2dd4bf', marginBottom: '12px' }}>BañosTour</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px' }}>Ocurrió un error al cargar la vista.</p>
          <pre style={{ fontSize: '11px', color: '#f87171', background: '#1e293b', padding: '12px', borderRadius: '8px', maxWidth: '90%', overflow: 'auto', textAlign: 'left' }}>
            {this.state.error?.message || 'Error desconocido'}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', backgroundColor: '#0d9488', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold' }}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <IonApp>
        <App />
      </IonApp>
    </RootErrorBoundary>
  </StrictMode>,
);
