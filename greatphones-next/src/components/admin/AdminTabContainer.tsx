'use client'

import AdminTopbar from '@/components/AdminTopbar'

interface Tab<K extends string> {
  k: K
  label: string
  icon: string
}

interface Props<K extends string> {
  titulo: string
  subtitle?: string
  tabs: Tab<K>[]
  active: K
  onChange: (k: K) => void
  children: React.ReactNode
}

export default function AdminTabContainer<K extends string>({ titulo, subtitle, tabs, active, onChange, children }: Props<K>) {
  return (
    <>
      <AdminTopbar titulo={titulo} />
      <div style={{ padding: 'clamp(14px,3vw,24px)', maxWidth: 1100, margin: '0 auto' }}>
        {subtitle && <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 14px' }}>{subtitle}</p>}
        <style>{`
          .lp-tab:focus-visible{ outline:2px solid #FF6B2C; outline-offset:2px; border-radius:8px; }
        `}</style>
        <div role="tablist" style={{ display: 'flex', gap: 24, borderBottom: '1px solid #E6E7F0', marginBottom: 16 }}>
          {tabs.map(t => {
            const isActive = t.k === active
            return (
              <button
                key={t.k}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(t.k)}
                className="lp-tab"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 2px',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #FF6B2C' : '2px solid transparent',
                  background: 'none',
                  color: isActive ? '#FF6B2C' : '#64748B',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  marginBottom: -1,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
                  {t.icon}
                </span>
                {t.label}
              </button>
            )
          })}
        </div>
        {children}
      </div>
    </>
  )
}
