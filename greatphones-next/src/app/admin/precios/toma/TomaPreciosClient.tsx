'use client'

import { useState } from 'react'
import AdminTopbar from '@/components/AdminTopbar'
import TomaVista from './TomaVista'
import TomaEditor from './TomaEditor'

const TABS = [
  { k: 'ver', label: 'Ver precios', icon: 'visibility' },
  { k: 'editar', label: 'Editar precios', icon: 'edit' },
] as const

export default function TomaPreciosClient() {
  const [tab, setTab] = useState<'ver' | 'editar'>('ver')

  return (
    <>
      <AdminTopbar titulo="Precios de Toma" />

      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>
          Precio impecable y descuentos por falla por modelo (editables sin tocar código)
        </p>

        <div
          style={{ display: 'flex', gap: 24, margin: '16px 0', borderBottom: '1px solid #E6E7F0' }}
          role="tablist"
          aria-label="Secciones de precios de toma"
        >
          {TABS.map(({ k, label, icon }) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className="lp-tab"
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 4px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 14,
                fontWeight: tab === k ? 700 : 500,
                color: tab === k ? '#FF6B2C' : '#64748B',
                borderBottom: tab === k ? '2px solid #FF6B2C' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 17 }}
                aria-hidden="true"
              >
                {icon}
              </span>
              {label}
            </button>
          ))}
        </div>

        {tab === 'ver' ? <TomaVista /> : <TomaEditor />}
      </div>
    </>
  )
}
