'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter()

  useEffect(() => {
    // Si es un error de autenticación o autorización, redirigir al login o home
    if (error.message.includes('No autenticado') || error.message.includes('No tienes permiso')) {
      const timer = setTimeout(() => {
        router.push('/login?callbackUrl=/admin')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [error, router])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f5f7fa',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '10px',
          padding: '40px',
          maxWidth: '500px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
        <h1 style={{ fontSize: '24px', marginBottom: '10px', color: '#1f2937' }}>Acceso Denegado</h1>
        <p style={{ color: '#6b7280', marginBottom: '20px', lineHeight: '1.6' }}>
          {error.message.includes('No autenticado')
            ? 'Debes iniciar sesión para acceder al panel de administración.'
            : error.message.includes('No tienes permiso')
              ? 'No tienes los permisos necesarios para acceder al panel de administración.'
              : 'Ocurrió un error al acceder al panel de administración.'}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <Link
            href="/login?callbackUrl=/admin"
            style={{
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'background 0.2s',
            }}
          >
            Ir al Login
          </Link>
          <Link
            href="/home"
            style={{
              padding: '10px 20px',
              background: '#e5e7eb',
              color: '#1f2937',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'background 0.2s',
            }}
          >
            Volver a Inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
