'use client'

export default function AdminToast({ t, s }: { t: 'success' | 'error'; s: string }) {
  return (
    <div
      role={t === 'success' ? 'status' : 'alert'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        borderRadius: 10,
        marginBottom: 14,
        color: '#fff',
        fontWeight: 600,
        fontSize: 13,
        background: t === 'success' ? '#0F9D58' : '#DC2626',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
        {t === 'success' ? 'check_circle' : 'error'}
      </span>
      {s}
    </div>
  )
}
