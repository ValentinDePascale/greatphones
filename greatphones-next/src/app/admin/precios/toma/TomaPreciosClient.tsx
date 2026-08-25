'use client'

import { useState } from 'react'
import TomaVista from './TomaVista'
import TomaEditor from './TomaEditor'

export default function TomaPreciosClient() {
  const [tab, setTab] = useState<'ver' | 'editar'>('ver')

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0 }}>🔄 Precios de Toma</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
        Precio impecable y descuentos por falla por modelo (editables sin tocar código)
      </p>

      <div style={{ display: 'flex', gap: 24, margin: '16px 0', borderBottom: '1px solid #E6E7F0' }}>
        {([['ver', '🔎 Ver precios'], ['editar', '✏️ Editar precios']] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{ background: 'none', border: 'none', padding: '10px 4px', fontSize: 14, fontWeight: tab === k ? 700 : 500, color: tab === k ? '#4F46E5' : '#64748b', cursor: 'pointer', borderBottom: tab === k ? '2px solid #4F46E5' : '2px solid transparent' }}
          >{label}</button>
        ))}
      </div>

      {tab === 'ver' ? <TomaVista /> : <TomaEditor />}
    </div>
  )
}
