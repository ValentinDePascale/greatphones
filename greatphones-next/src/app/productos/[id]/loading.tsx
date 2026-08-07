export default function DetailLoading() {
  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', padding: '1.5rem clamp(0.875rem, 3vw, 1.75rem) 3rem' }}>
      <div className="page-xl" style={{ padding: 0 }}>
        <div style={{ height: 16, width: 180, background: 'var(--cream2)', borderRadius: 8, marginBottom: 24 }} />
        <div className="dt-grid">
          <div style={{ aspectRatio: 0.7, background: 'var(--cream2)', borderRadius: 20, maxHeight: 500 }} />
          <div>
            <div style={{ height: 12, width: 160, background: 'var(--cream2)', borderRadius: 4, marginBottom: 16 }} />
            <div style={{ height: 32, width: '80%', background: 'var(--cream2)', borderRadius: 6, marginBottom: 16 }} />
            <div style={{ height: 36, width: '40%', background: 'var(--cream2)', borderRadius: 8, marginBottom: 10 }} />
            <div style={{ height: 18, width: '60%', background: 'var(--cream2)', borderRadius: 4, marginBottom: 24 }} />
            <div style={{ height: 14, width: '30%', background: 'var(--cream2)', borderRadius: 4, marginBottom: 12 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 64, background: 'var(--cream2)', borderRadius: 12 }} />
              ))}
            </div>
            <div style={{ height: 50, background: 'var(--cream2)', borderRadius: 14, marginBottom: 12 }} />
            <div style={{ height: 46, background: 'var(--cream2)', borderRadius: 14 }} />
          </div>
        </div>
      </div>
    </div>
  )
}
