'use client'

import { useEffect, useState } from 'react'
import { fetchDolar } from '../dolar'
import PreciosVista from '../PreciosVista'
import PrecioEditor from '../PrecioEditor'
import type { PrecioRow } from '../PrecioEditor'

export default function MacIpadClient() {
  const [tab, setTab] = useState<'ver' | 'editar'>('ver')
  const [items, setItems] = useState<PrecioRow[]>([])
  const [dolar, setDolar] = useState<number | null>(null)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const r = await fetch('/api/admin/precios/macipad', { credentials: 'include' })
      const d = await r.json()
      setItems(Array.isArray(d) ? d : [])
    } catch { setError('No se pudieron cargar los precios') }
  }

  const loadDolar = async () => { const v = await fetchDolar('blue'); if (v != null) setDolar(v) }
  useEffect(() => { load(); loadDolar() }, [])

  const filtros = ['Todos', 'MacBook Air', 'MacBook Pro', 'iPad Pro', 'iPad Air']

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0 }}>💻 Lista de Precios — Mac / iPad</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
        Precios en ARS (editables) · El valor en USD se calcula en vivo con dolarapi
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

      {error && <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, color: '#fff', fontWeight: 600, fontSize: 13, background: '#DC2626' }}>{error}</div>}

      {tab === 'ver' ? (
        <PreciosVista items={items} icono="💻" dolarVenta={dolar} familiaFiltros={filtros} />
      ) : (
        <PrecioEditor endpoint="/api/admin/precios/macipad" title="precio" emptyText="No hay precios cargados. Agregá uno." />
      )}
    </div>
  )
}
