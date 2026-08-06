'use client'

import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="lg-wrap">
      <div style={{ marginBottom: 32 }}>
        <div className="lg-logo"><span>GP</span></div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: 'var(--dk)', marginBottom: 8 }}>Iniciar sesión</h1>
        <p style={{ fontSize: 14, color: 'var(--gray)' }}>Accedé a tu cuenta para ver tus pedidos y favoritos.</p>
      </div>

      <button className="lg-google" onClick={() => router.push('/api/auth/signin/google')}>
        <span style={{ fontSize: 20 }}>G</span> Continuar con Google
      </button>

      <div className="lg-divider"><div className="lg-line" /><span className="lg-label">O si preferís</span></div>

      <form style={{ textAlign: 'left' }} onSubmit={(e) => e.preventDefault()}>
        <div style={{ marginBottom: 12 }}><label className="f-label">Email</label><input type="email" className="f-input" placeholder="tu@email.com" /></div>
        <div style={{ marginBottom: 20 }}><label className="f-label">Contraseña</label><input type="password" className="f-input" placeholder="••••••••" /></div>
        <button type="submit" className="btn-buy" style={{ fontSize: 15 }}>Iniciar sesión</button>
      </form>

      <div className="lg-footer">¿No tenés cuenta? <button className="btn-link" onClick={() => router.push('/register')}>Registrate</button></div>
    </div>
  )
}
