'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #FDF8F3 0%, #fff 100%)',
          fontFamily: "'DM Sans', sans-serif",
          padding: '2rem 1rem',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <div style={{
              fontSize: '120px',
              fontWeight: 700,
              fontFamily: "'Playfair Display', Georgia, serif",
              color: '#FF6B2C',
              lineHeight: 1,
              marginBottom: '1rem',
            }}>
              :(
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#1a1a1a',
              marginBottom: '0.5rem',
              fontFamily: "'Playfair Display', Georgia, serif",
            }}>
              Algo salio mal
            </h1>
            <p style={{
              fontSize: '15px',
              color: '#666',
              marginBottom: '2rem',
              lineHeight: 1.6,
            }}>
              Ocurrio un error inesperado. Intenta recargar la pagina.
            </p>
            <button
              onClick={() => reset()}
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #FF6B2C 0%, #e55a1a 100%)',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 700,
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255,107,44,.3)',
              }}
            >
              Recargar pagina
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
