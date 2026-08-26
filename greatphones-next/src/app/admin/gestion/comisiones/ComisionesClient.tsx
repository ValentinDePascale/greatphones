'use client'

import { useEffect, useState } from 'react'
import AdminTopbar from '@/components/AdminTopbar'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 9,
  border: '1.5px solid #E6E7F0',
  borderRadius: 9,
  fontSize: 13,
  background: '#FBFBFD',
  color: '#181B2E',
}
function fmtP(n: number) {
  return '$' + (n || 0).toLocaleString('es-AR')
}

interface Comision {
  operador: string
  cantidadVentas: number
  facturacion: number
  ganancia: number
  preventas: number
  reparaciones: number
  totalMovimientos: number
}

export default function ComisionesClient() {
  const [rows, setRows] = useState<Comision[]>([])
  const [cargando, setCargando] = useState(true)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)

  const load = async () => {
    setCargando(true)
    const params = new URLSearchParams()
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    const q = params.toString()
    try {
      const r = await fetch('/api/admin/gestion/comisiones' + (q ? '?' + q : ''), {
        credentials: 'include',
      })
      const d = await r.json()
      setRows(Array.isArray(d) ? d : [])
    } catch {
      setMsg({ t: 'error', s: 'Error al cargar' })
    }
    setCargando(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const totalFact = rows.reduce((s, r) => s + r.facturacion, 0)
  const totalGan = rows.reduce((s, r) => s + r.ganancia, 0)

  return (
    <>
      <AdminTopbar titulo="Comisiones" />
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        <style>{`
          .pe-input:focus{ border-color:#FF6B2C!important; outline:none}
          .pe-btn:focus-visible{ outline:2px solid #FF6B2C; outline-offset:2px}
        `}</style>

        <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>
          Indicadores por operador — base para definir comisiones del período
        </p>

        {msg && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 10,
              margin: '16px 0',
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              background: '#DC2626',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
              error
            </span>
            {msg.s}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'end',
            flexWrap: 'wrap',
            marginTop: 16,
            background: '#fff',
            border: '1px solid #E6E7F0',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ flex: '1 1 140px' }}>
            <label
              htmlFor="co-desde"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#3D4356',
                marginBottom: 5,
              }}
            >
              Desde
            </label>
            <input
              id="co-desde"
              type="date"
              className="pe-input"
              style={inputStyle}
              value={desde}
              onChange={e => setDesde(e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label
              htmlFor="co-hasta"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#3D4356',
                marginBottom: 5,
              }}
            >
              Hasta
            </label>
            <input
              id="co-hasta"
              type="date"
              className="pe-input"
              style={inputStyle}
              value={hasta}
              onChange={e => setHasta(e.target.value)}
            />
          </div>
          <button
            onClick={load}
            className="pe-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              background: 'linear-gradient(135deg,#FF6B2C,#FF8A50)',
              color: '#fff',
              border: 'none',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden="true">
              filter_alt
            </span>
            Filtrar
          </button>
          {(desde || hasta) && (
            <button
              onClick={() => {
                setDesde('')
                setHasta('')
              }}
              className="pe-btn"
              style={{
                padding: '10px 14px',
                background: '#EEF0F6',
                color: '#64748B',
                border: 'none',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Limpiar
            </button>
          )}
        </div>

        {rows.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
              gap: 12,
              marginTop: 14,
            }}
          >
            <div
              style={{
                background: '#fff',
                border: '1px solid #E6E7F0',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
                Facturación total
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#181B2E', marginTop: 4 }}>
                {fmtP(totalFact)}
              </div>
            </div>
            <div
              style={{
                background: '#fff',
                border: '1px solid #E6E7F0',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>Ganancia total</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0F9D58', marginTop: 4 }}>
                {fmtP(totalGan)}
              </div>
            </div>
            <div
              style={{
                background: '#fff',
                border: '1px solid #E6E7F0',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
                Operadores activos
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#181B2E', marginTop: 4 }}>
                {rows.length}
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            overflowX: 'auto',
            marginTop: 16,
            border: '1px solid #E6E7F0',
            borderRadius: 10,
            background: '#fff',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#F4F6F9', textAlign: 'left' }}>
                <th style={{ padding: '9px 10px' }}>Operador</th>
                <th style={{ padding: '9px 10px', textAlign: 'right' }}>Ventas</th>
                <th style={{ padding: '9px 10px', textAlign: 'right' }}>Facturación</th>
                <th style={{ padding: '9px 10px', textAlign: 'right' }}>Ganancia</th>
                <th style={{ padding: '9px 10px', textAlign: 'right' }}>Preventas</th>
                <th style={{ padding: '9px 10px', textAlign: 'right' }}>Reparaciones</th>
                <th style={{ padding: '9px 10px', textAlign: 'right' }}>Movimientos</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#8892A6' }}>
                    Cargando indicadores…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#8892A6' }}>
                    Sin datos para el período seleccionado.
                  </td>
                </tr>
              ) : (
                rows.map(r => (
                  <tr key={r.operador} style={{ borderTop: '1px solid #E6E7F0' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          fontWeight: 700,
                        }}
                      >
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: '#FFF1E8',
                            color: '#FF6B2C',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {r.operador.charAt(0).toUpperCase()}
                        </span>
                        {r.operador}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{r.cantidadVentas}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>
                      {fmtP(r.facturacion)}
                    </td>
                    <td
                      style={{
                        padding: '8px 10px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: '#0F9D58',
                      }}
                    >
                      {fmtP(r.ganancia)}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{r.preventas}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{r.reparaciones}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#6B7280' }}>
                      {r.totalMovimientos}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
