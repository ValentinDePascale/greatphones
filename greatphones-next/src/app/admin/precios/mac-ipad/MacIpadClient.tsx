'use client'

import { useEffect, useState } from 'react'
import AdminTopbar from '@/components/AdminTopbar'
import { fetchDolarVenta } from '../dolar'
import PreciosVista from '../PreciosVista'
import PrecioEditor from '../PrecioEditor'
import type { PrecioRow } from '../PrecioEditor'

export default function MacIpadClient() {
  const [tab, setTab] = useState<'ver' | 'editar'>('ver')
  const [items, setItems] = useState<PrecioRow[]>([])
  const [dolar, setDolar] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    fetch('/api/admin/precios/macipad', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (activo) setItems(Array.isArray(d) ? d : [])
      })
      .catch(() => {
        if (activo) setError('No se pudieron cargar los precios')
      })
    fetchDolarVenta('blue').then(v => {
      if (activo && v != null) setDolar(v)
    })
    return () => {
      activo = false
    }
  }, [])

  const filtros = ['Todos', 'MacBook Air', 'MacBook Pro', 'iPad Pro', 'iPad Air']

  return (
    <>
      <AdminTopbar titulo="Lista de Precios — Mac / iPad" />
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        <style>{`
        .lp-tab { background: none; border: none; padding: 10px 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; font-size: 14; transition: color .15s; }
        .lp-tab:focus-visible { outline: 2px solid #FF6B2C; outline-offset: 2px; border-radius: 6px; }
      `}</style>

        <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>
          Precios en ARS (editables) · El valor en USD se calcula en vivo con dolarapi
        </p>

        <div
          style={{ display: 'flex', gap: 24, margin: '16px 0', borderBottom: '1px solid #E6E7F0' }}
          role="tablist"
          aria-label="Secciones de la lista de precios"
        >
          {(
            [
              ['ver', 'Ver precios', 'visibility'],
              ['editar', 'Editar precios', 'edit'],
            ] as const
          ).map(([k, label, icon]) => (
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
          <PreciosVista
            items={items}
            icono="laptop_mac"
            dolarVenta={dolar}
            familiaFiltros={filtros}
          />
        ) : (
          <PrecioEditor
            endpoint="/api/admin/precios/macipad"
            title="precio"
            emptyText="No hay precios cargados. Agregá uno."
          />
        )}
      </div>
    </>
  )
}
