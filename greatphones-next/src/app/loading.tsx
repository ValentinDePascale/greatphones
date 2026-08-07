export default function Loading() {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16, padding: '3rem 1rem',
    }}>
      <div style={{
        width: 40, height: 40, border: '3px solid var(--cream2)',
        borderTopColor: 'var(--orange)', borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <div style={{ fontSize: 14, color: 'var(--gray)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
        Cargando...
      </div>
    </div>
  )
}
