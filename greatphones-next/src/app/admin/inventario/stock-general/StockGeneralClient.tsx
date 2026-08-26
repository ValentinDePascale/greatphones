'use client'

import { useEffect, useState } from 'react'

const inputStyle = { width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }

function fmtP(n: number) { return '$' + (n || 0).toLocaleString('es-AR') }

interface Equipo { modelo: string; imei: string; color: string; costo: number; precioVenta: number; estado: string }
interface Acceso { id: string; categoria: string; producto: string; marca: string; color: string; stock: number; costo: number; precioVenta: number; valorStock: number; ubicacion: string; estado: string }

export default function StockGeneralClient() {
  const [tab, setTab] = useState<'equipos' | 'accesorios' | 'todo'>('equipos')
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [accesorios, setAccesorios] = useState<Acceso[]>([])
  const [buscar, setBuscar] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/inventario', { credentials: 'include' }).then(r => r.json()).then(d => {
      setEquipos(d.equipos || []); setAccesorios(d.accesorios || [])
    }).catch(() => setError('Error al cargar el inventario'))
  }, [])

  const q = buscar.toLowerCase()
  const eqF = equipos.filter(e => (e.modelo + ' ' + e.imei + ' ' + e.estado).toLowerCase().includes(q))
  const acF = accesorios.filter(a => (a.producto + ' ' + a.marca + ' ' + a.categoria + ' ' + a.estado).toLowerCase().includes(q))

  const TABS = [['equipos', '📱 Equipos'], ['accesorios', '📦 Accesorios'], ['todo', '🗂 Todo']] as const

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0 }}>📋 Stock General</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Inventario consolidado: equipos y accesorios</p>

      {error && <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, color: '#fff', fontWeight: 600, fontSize: 13, background: '#DC2626' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {TABS.map(([k, lab]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === k ? 700 : 500, background: tab === k ? '#0F766E' : '#E5E7EB', color: tab === k ? '#fff' : '#334' }}>{lab}</button>
        ))}
      </div>

      <input style={{ ...inputStyle, maxWidth: 340, marginTop: 14 }} placeholder="🔎 Buscar..." value={buscar} onChange={e => setBuscar(e.target.value)} />

      <div style={{ overflowX: 'auto', marginTop: 14, border: '1px solid #E6E7F0', borderRadius: 8 }}>
        {tab === 'equipos' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#F4F6F9', textAlign: 'left' }}>
                <th style={{ padding: 8 }}>Modelo</th><th style={{ padding: 8 }}>IMEI</th><th style={{ padding: 8 }}>Color</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Costo</th><th style={{ padding: 8, textAlign: 'right' }}>Precio Est. Venta</th><th style={{ padding: 8 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {eqF.length === 0 && <tr><td colSpan={6} style={{ padding: 14, textAlign: 'center', color: '#889' }}>Sin equipos.</td></tr>}
              {eqF.map((e, i) => (
                <tr key={i} style={{ borderTop: '1px solid #E6E7F0' }}>
                  <td style={{ padding: 8, fontWeight: 600 }}>{e.modelo}</td>
                  <td style={{ padding: 8 }}>{e.imei}</td>
                  <td style={{ padding: 8 }}>{e.color}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{fmtP(e.costo)}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{fmtP(e.precioVenta)}</td>
                  <td style={{ padding: 8 }}>{e.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 'accesorios' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#F4F6F9', textAlign: 'left' }}>
                <th style={{ padding: 8 }}>Categoría</th><th style={{ padding: 8 }}>Producto</th><th style={{ padding: 8 }}>Marca</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Stock</th><th style={{ padding: 8, textAlign: 'right' }}>Total</th><th style={{ padding: 8 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {acF.length === 0 && <tr><td colSpan={6} style={{ padding: 14, textAlign: 'center', color: '#889' }}>Sin accesorios.</td></tr>}
              {acF.map(a => (
                <tr key={a.id} style={{ borderTop: '1px solid #E6E7F0' }}>
                  <td style={{ padding: 8 }}>{a.categoria}</td>
                  <td style={{ padding: 8, fontWeight: 600 }}>{a.producto}</td>
                  <td style={{ padding: 8 }}>{a.marca}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{a.stock}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{fmtP(a.valorStock)}</td>
                  <td style={{ padding: 8 }}>{a.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 'todo' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#F4F6F9', textAlign: 'left' }}>
                <th style={{ padding: 8 }}>Tipo</th><th style={{ padding: 8 }}>Descripción</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Cantidad</th><th style={{ padding: 8, textAlign: 'right' }}>Valor</th><th style={{ padding: 8 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {eqF.map((e, i) => (
                <tr key={'e' + i} style={{ borderTop: '1px solid #E6E7F0' }}>
                  <td style={{ padding: 8 }}>📱 Equipo</td><td style={{ padding: 8, fontWeight: 600 }}>{e.modelo} ({e.imei})</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>1</td><td style={{ padding: 8, textAlign: 'right' }}>{fmtP(e.costo)}</td><td style={{ padding: 8 }}>{e.estado}</td>
                </tr>
              ))}
              {acF.map(a => (
                <tr key={a.id} style={{ borderTop: '1px solid #E6E7F0' }}>
                  <td style={{ padding: 8 }}>📦 Accesorio</td><td style={{ padding: 8, fontWeight: 600 }}>{a.producto} — {a.marca}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{a.stock}</td><td style={{ padding: 8, textAlign: 'right' }}>{fmtP(a.valorStock)}</td><td style={{ padding: 8 }}>{a.estado}</td>
                </tr>
              ))}
              {eqF.length + acF.length === 0 && <tr><td colSpan={5} style={{ padding: 14, textAlign: 'center', color: '#889' }}>Sin datos.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}