'use client'

import { useEffect, useState } from 'react'
import AdminTopbar from '@/components/AdminTopbar'
import { fetchDolar, fetchDolarVenta } from './dolar'
import PreciosVista from './PreciosVista'
import PrecioEditor from './PrecioEditor'
import DolarEditor from './DolarEditor'
import type { PrecioRow } from './PrecioEditor'

const TABS = [
  { k: 'ver', label: 'Ver precios', icon: 'visibility' },
  { k: 'editar', label: 'Editar precios', icon: 'edit' },
] as const

export default function ListaPreciosClient() {
  const [tab, setTab] = useState<'ver' | 'editar'>('ver')
  const [items, setItems] = useState<PrecioRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [dolar, setDolar] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    fetch('/api/admin/precios', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (activo) {
          setItems(Array.isArray(d) ? d : [])
          setCargando(false)
        }
      })
      .catch(() => {
        if (activo) {
          setError('No se pudieron cargar los precios')
          setCargando(false)
        }
      })
    fetchDolarVenta('blue').then(v => {
      if (activo && v != null) setDolar(v)
    })
    return () => {
      activo = false
    }
  }, [])

  return (
    <>
      <AdminTopbar titulo="Lista de Precios" />
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        <style>{`
        .lp-tab { background: none; border: none; padding: 10px 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; font-size: 14; transition: color .15s; }
        .lp-tab:focus-visible { outline: 2px solid #FF6B2C; outline-offset: 2px; border-radius: 6px; }
      `}</style>

        <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>
          Precios en ARS (editables) · Cotización editable manualmente o desde dolarapi
        </p>

        <DolarEditor />

        <div
          style={{ display: 'flex', gap: 24, margin: '16px 0', borderBottom: '1px solid #E6E7F0' }}
          role="tablist"
          aria-label="Secciones de la lista de precios"
        >
          {TABS.map(({ k, label, icon }) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className="lp-tab"
              style={{
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

        {error && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              marginBottom: 16,
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              background: '#DC2626',
            }}
          >
            {error}
          </div>
        )}

        {tab === 'ver' ? (
          cargando ? (
            <p style={{ padding: 32, textAlign: 'center', color: '#8892A6', fontSize: 13 }}>
              Cargando precios…
            </p>
          ) : (
            <PreciosVista items={items} dolarVenta={dolar} />
          )
        ) : (
          <PrecioEditor
            endpoint="/api/admin/precios"
            title="precio"
            emptyText="No hay precios cargados. Agregá uno."
          />
        )}
      </div>
    </>
  )
}
