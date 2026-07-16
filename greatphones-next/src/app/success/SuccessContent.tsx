'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderCode = searchParams.get('order')
  const wextId = searchParams.get('wext')
  const gcId = searchParams.get('gc')
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [gcCode, setGcCode] = useState('')
  const [gcAmount, setGcAmount] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (gcId) {
      fetch(`/api/giftcard/confirm?gcId=${gcId}`)
        .then(r => r.json())
        .then(data => {
          if (data.code) setGcCode(data.code)
          if (data.amount) setGcAmount(data.amount)
          setConfirmed(true)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else if (wextId) {
      const paymentId = searchParams.get('payment_id') || searchParams.get('paymentId') || ''
      const url = `/api/warranty/confirm?wextId=${wextId}${paymentId ? '&payment_id=' + paymentId : ''}`
      fetch(url).then(r => r.json()).then(data => {
        setConfirmed(data.success)
      }).catch(() => {}).finally(() => setLoading(false))
    } else {
      try {
        localStorage.removeItem('cart')
        localStorage.removeItem('cartCount')
      } catch (e) {}
      setLoading(false)
    }
  }, [gcId, wextId, searchParams])

  const copyCode = () => {
    if (gcCode) {
      navigator.clipboard.writeText(gcCode).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => {})
    }
  }

  if (gcId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '2rem' }}>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '0', maxWidth: '500px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,.1)' }}>
          <div style={{ background: 'linear-gradient(135deg,#FF6B2C 0%,#e85d1f 50%,#FFB088 100%)', padding: '3rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
            <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
            <div style={{ fontSize: '48px', marginBottom: '12px', position: 'relative', zIndex: 1 }}>🎁</div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Tu Gift Card está lista</h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.7)', marginBottom: '24px' }}>Compartí este código con quien quieras regalarle</p>
            {loading ? (
              <div style={{ padding: '1rem' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite', margin: '0 auto' }} />
              </div>
            ) : (
              <>
                <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,.2)', position: 'relative', zIndex: 1 }}>
                  <div style={{ fontFamily: "'DM Sans', monospace", fontSize: '28px', fontWeight: 700, color: '#fff', letterSpacing: '3px', marginBottom: '8px' }}>
                    {gcCode || 'GP-XXXX-XXXX'}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,.9)' }}>
                    ${gcAmount.toLocaleString('es-AR')}
                  </div>
                </div>
                <button onClick={copyCode} style={{ marginTop: '16px', padding: '10px 24px', background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all .2s', position: 'relative', zIndex: 1 }}>
                  {copied ? '✓ Copiado' : '📋 Copiar código'}
                </button>
              </>
            )}
          </div>
          <div style={{ padding: '1.5rem 2rem' }}>
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280' }}>
                <span>Validez</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>1 año desde la compra</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280' }}>
                <span>Canjeable en</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>Cualquier producto o servicio</span>
              </div>
            </div>
            <button onClick={() => router.push('/')} style={{ width: '100%', padding: '14px', background: '#ff6b2c', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginTop: '1.5rem' }}>
              Volver a la tienda
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb',
      padding: '2rem'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '3rem 2rem',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 80px rgba(0,0,0,.1)'
      }}>
        {loading ? (
          <div style={{ padding: '2rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #f3f4f6',
              borderTop: '4px solid #059669',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }} />
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Verificando pago...</p>
          </div>
        ) : wextId ? (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: confirmed ? '#f0fdf4' : '#FEF2F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              {confirmed ? (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              )}
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 700, color: confirmed ? '#111827' : '#991B1B', marginBottom: '0.5rem' }}>
              {confirmed ? '¡Garantía extendida!' : 'Pago pendiente'}
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '1.5rem' }}>
              {confirmed
                ? 'Tu garantía extendida ya está activa. Recibís un email con los detalles.'
                : 'El pago no pudo confirmarse automáticamente. Si ya realizaste el pago, se activará en breve.'}
            </p>
            <button onClick={() => router.push('/')} style={{ width: '100%', padding: '14px', background: '#ff6b2c', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
              Volver a la tienda
            </button>
          </>
        ) : (
          <>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', background: '#f0fdf4',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
              ¡Pago confirmado!
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '1.5rem' }}>
              Tu compra ha sido procesada correctamente
            </p>
            {orderCode && (
              <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #059669', marginBottom: '2rem' }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Número de orden</p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>{orderCode}</p>
              </div>
            )}
            <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'left' }}>
              <p style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>📧 Te enviamos un email con los detalles de tu compra</p>
              <p style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>📦 Estamos preparando tu pedido</p>
              <p style={{ fontSize: '13px', color: '#374151' }}>🛡️ Tu compra tiene garantía de 90 días</p>
            </div>
            <button onClick={() => router.push('/')} style={{ width: '100%', padding: '14px', background: '#ff6b2c', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
              Seguir comprando
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
