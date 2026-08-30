'use client'

import { useEffect, useState } from 'react'
import { errorLogger } from '@/lib/error-logger'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default function ErrorBoundary({ children, fallback }: Props) {
  const [state, setState] = useState<State>({
    hasError: false,
    error: null,
  })

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error || new Error(event.message)
      console.error('Error capturado:', error)
      errorLogger.log(error)
      setState({
        hasError: true,
        error,
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(String(event.reason))
      console.error('Promise rejection capturado:', event.reason)
      errorLogger.log(error)
      setState({
        hasError: true,
        error,
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  if (state.hasError) {
    return (
      fallback || (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#f5f7fa',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '10px',
              padding: '40px',
              maxWidth: '600px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h1 style={{ fontSize: '24px', marginBottom: '10px', color: '#1f2937' }}>
              Algo salió mal
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '20px', lineHeight: '1.6' }}>
              Disculpa, hubo un error inesperado. Hemos registrado el problema y lo revisaremos.
            </p>

            {process.env.NODE_ENV === 'development' && state.error && (
              <div
                style={{
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '20px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#7f1d1d',
                  overflowX: 'auto',
                }}
              >
                <strong>Error (desarrollo):</strong>
                <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {state.error.message}
                  {state.error.stack}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => window.location.href = '/home'}
                style={{
                  padding: '10px 20px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#5568d3')}
                onMouseLeave={e => (e.currentTarget.style.background = '#667eea')}
              >
                Ir al Inicio
              </button>
              <button
                onClick={() => {
                  setState({ hasError: false, error: null })
                  window.location.reload()
                }}
                style={{
                  padding: '10px 20px',
                  background: '#e5e7eb',
                  color: '#1f2937',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#d1d5db')}
                onMouseLeave={e => (e.currentTarget.style.background = '#e5e7eb')}
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )
    )
  }

  return children
}
