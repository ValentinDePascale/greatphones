'use client'

import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #FF6B2C, #e55a1a)', borderRadius: 20, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>GP</span>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
          Iniciar sesión
        </h1>
        <p style={{ fontSize: 14, color: '#9A9186' }}>
          Accedé a tu cuenta para ver tus pedidos y favoritos.
        </p>
      </div>

      <button
        onClick={() => router.push('/api/auth/signin/google')}
        style={{
          width: '100%', padding: '14px', background: '#fff', color: '#1a1a1a',
          border: '1.5px solid #E4DDD4', borderRadius: 12, fontSize: 15, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontFamily: 'inherit', marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 20 }}>G</span>
        Continuar con Google
      </button>

      <div style={{ position: 'relative', margin: '24px 0' }}>
        <div style={{ height: 1, background: '#E4DDD4' }} />
        <span style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', background: '#FDF8F3', padding: '0 12px', fontSize: 12, color: '#9A9186' }}>
          O si preferís
        </span>
      </div>

      <form style={{ textAlign: 'left' }} onSubmit={(e) => e.preventDefault()}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#1a1a1a', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Email</label>
          <input type="email" placeholder="tu@email.com" style={{ width: '100%', padding: '12px', border: '1.5px solid #E4DDD4', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#1a1a1a', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Contraseña</label>
          <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '12px', border: '1.5px solid #E4DDD4', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <button type="submit" style={{
          width: '100%', padding: '14px', background: 'linear-gradient(135deg, #FF6B2C, #e55a1a)',
          color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Iniciar sesión
        </button>
      </form>

      <div style={{ marginTop: 16, fontSize: 13, color: '#9A9186' }}>
        ¿No tenés cuenta?{' '}
        <button onClick={() => router.push('/register')} style={{ background: 'none', border: 'none', color: '#FF6B2C', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
          Registrate
        </button>
      </div>
    </div>
  )
}
