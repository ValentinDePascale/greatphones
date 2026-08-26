'use client'

import { useEffect, useMemo, useState } from 'react'

const inputStyle = { width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }
function fmtP(n: number) { return '$' + (n || 0).toLocaleString('es-AR') }

interface Acceso { id: string; categoria: string; producto: string; marca: string; color: string; stock: number; costo: number; precioVenta: number; valorStock: number; ubicacion: string; estado: string }

export default function StockAccesoriosClient() {
  const [rows, setRows] = useState<Acceso[]>([])
  const [buscar, setBuscar] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/inventario', { credentials: 'include' }).then(r => r.json()).then(d => setRows(d.accesorios || [])).catch(() => setError('Error al cargar'))
  }, [])

  const filtrados = useMemo(() => {
    const q = buscar.toLowerCase()
    if (!q) return rows
    return rows.filter(s => (s.producto + ' ' + s.marca + ' ' + s.categoria + ' ' + s.color + ' ' + s.estado).toLowerCase().includes(q))
  }, [rows, buscar])

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0 }}>📦 Stock Accesorios</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Stock por accesorio con costo, venta y valor total</p>

      {error && <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, color: '#fff', fontWeight: 600, fontSize: 13, background: '#DC2626' }}>{error}</div>}

      <input style={{ ...inputStyle, maxWidth: 360, marginTop: 12 }} placeholder="🔎 Buscar por producto, marca o categoría..." value={buscar} onChange={e => setBuscar(e.target.value)} />

      <div style={{ overflowX: 'auto', marginTop: 14, border: '1px solid #E6E7F0', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: '#F4F6F9', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>Categoría</th><th style={{ padding: 8 }}>Producto</th><th style={{ padding: 8 }}>Marca</th>
              <th style={{ padding: 8 }}>Color</th><th style={{ padding: 8, textAlign: 'right' }}>Stock</th><th style={{ padding: 8, textAlign: 'right' }}>Costo</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Venta</th><th style={{ padding: 8, textAlign: 'right' }}>Total</th><th style={{ padding: 8 }}>Ubicación</th><th style={{ padding: 8 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && <tr><td colSpan={10} style={{ padding: 14, textAlign: 'center', color: '#889' }}>Sin resultados.</td></tr>}
            {filtrados.map(s => {
              const bg = s.estado.includes('Sin stock') ? '#F9EBEA' : s.estado.includes('Bajo stock') ? '#FDEBD0' : '#fff'
              return (
                <tr key={s.id} style={{ borderTop: '1px solid #E6E7F0', background: bg }}>
                  <td style={{ padding: 8 }}>{s.categoria}</td>
                  <td style={{ padding: 8, fontWeight: 600 }}>{s.producto}</td>
                  <td style={{ padding: 8 }}>{s.marca}</td>
                  <td style={{ padding: 8 }}>{s.color}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{s.stock}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{fmtP(s.costo)}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{fmtP(s.precioVenta)}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{fmtP(s.valorStock)}</td>
                  <td style={{ padding: 8 }}>{s.ubicacion}</td>
                  <td style={{ padding: 8 }}>{s.estado}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}