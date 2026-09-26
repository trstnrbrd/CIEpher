import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  state: { hasError: boolean; error?: Error } = { hasError: false }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: unknown): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="boot-screen boot-error" style={{ padding: '24px', textAlign: 'center' }}>
          <p>Something went wrong. Please reload the game.</p>
          <button
            type="button"
            className="pixel-button"
            onClick={() => window.location.reload()}
          >
            RELOAD
          </button>
          {/* The technical details are for developers only. Players (and a
              panel watching a demo) never see a stack trace; it's still in
              the browser console, from componentDidCatch above. */}
          {import.meta.env.DEV && this.state.error && (
            <pre style={{ color: '#ff6b6b', fontSize: '13px', marginTop: '16px', textAlign: 'left', maxWidth: '800px', margin: '16px auto', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '8px' }}>
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)