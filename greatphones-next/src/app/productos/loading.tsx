export default function CatalogLoading() {
  return (
    <div className="page-xl">
      <div style={{ height: 40, background: 'var(--cream2)', borderRadius: 8, width: '60%', marginBottom: 8 }} />
      <div style={{ height: 16, background: 'var(--cream2)', borderRadius: 8, width: '30%', marginBottom: 32 }} />
      <div className="pgrid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1.5px solid var(--border)' }}>
            <div style={{ aspectRatio: '1/1', background: 'var(--cream2)' }} />
            <div style={{ padding: 14 }}>
              <div style={{ height: 10, background: 'var(--cream2)', borderRadius: 4, width: '40%', marginBottom: 8 }} />
              <div style={{ height: 18, background: 'var(--cream2)', borderRadius: 4, width: '90%', marginBottom: 8 }} />
              <div style={{ height: 12, background: 'var(--cream2)', borderRadius: 4, width: '60%', marginBottom: 12 }} />
              <div style={{ height: 22, background: 'var(--cream2)', borderRadius: 4, width: '50%', marginBottom: 12 }} />
              <div style={{ height: 34, background: 'var(--cream2)', borderRadius: 8, width: '100%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
