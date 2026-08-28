'use client'

import { useEffect, useState } from 'react'
import AdminTopbar from '@/components/AdminTopbar'

interface Repair {
  id: string
  code: string
  device: string
  clientName: string | null
  clientPhone: string | null
  fault1: string | null
  jobs: string[]
  status: string
  isDiagnosis: boolean
  priceCalc: number | null
  pricePaid: number | null
  thirdParty: boolean
  deliveredAt: string | null
  createdAt: string
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  DIAGNOSIS: 'Diagnóstico',
  APPROVED: 'Aprobado',
  IN_PROGRESS: 'En reparación',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}
const STATUS_COLOR: Record<string, string> = {
  PENDING: '#D97706',
  DIAGNOSIS: '#7C3AED',
  APPROVED: '#2563EB',
  IN_PROGRESS: '#0D9488',
  DELIVERED: '#0F9D58',
  CANCELLED: '#DC2626',
}

function fmt(n: number | null | undefined) {
  return n != null ? '$' + Number(n).toLocaleString('es-AR') : '—'
}

export default function HistorialClient() {
  const [rows, setRows] = useState<Repair[]>([])
  const [filtro, setFiltro] = useState('TODOS')
  const [cargando, setCargando] = useState(true)
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)

  const load = async () => {
    setCargando(true)
    const q = filtro === 'TODOS' ? '' : `?status=${filtro}`
    const r = await fetch('/api/admin/taller/reparaciones' + q, { credentials: 'include' })
    const d = await r.json()
    setRows(Array.isArray(d) ? d : [])
    setCargando(false)
  }

  useEffect(() => {
    load()
  }, [filtro])

  const marcar = async (r: Repair, thirdParty: boolean) => {
    const ok = confirm(`¿Marcar ${r.code} como entregado${thirdParty ? ' a tercero' : ''}?`)
    if (!ok) return
    const res = await fetch('/api/admin/taller/reparaciones', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: r.id,
        status: 'DELIVERED',
        thirdParty,
        deliveredAt: new Date().toISOString(),
      }),
    })
    if (!res.ok) {
      const d = await res.json()
      setMsg({ t: 'error', s: d.error || 'Error' })
      setTimeout(() => setMsg(null), 3000)
      return
    }
    setMsg({ t: 'success', s: `Reparación ${r.code} marcada como entregada` })
    setTimeout(() => setMsg(null), 3000)
    load()
  }

  return (
    <>
      <AdminTopbar titulo="Historial de Reparaciones" />
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>
          Pendientes, en reparación y entregadas — marca si fue a tercero
        </p>

        {msg && (
          <div
            role={msg.t === 'success' ? 'status' : 'alert'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 10,
              margin: '14px 0',
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              background: msg.t === 'success' ? '#0F9D58' : '#DC2626',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
              {msg.t === 'success' ? 'check_circle' : 'error'}
            </span>
            {msg.s}
          </div>
        )}

        <div
          style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <select
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            style={{
              padding: '9px 12px',
              border: '1.5px solid #E6E7F0',
              borderRadius: 9,
              fontSize: 13,
              background: '#fff',
            }}
          >
            <option value="TODOS">Todos</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <span style={{ fontSize: 12, color: '#6B7280' }}>{rows.length} reparaciones</span>
        </div>

        <div
          style={{
            overflowX: 'auto',
            marginTop: 14,
            border: '1px solid #E6E7F0',
            borderRadius: 10,
            background: '#fff',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F4F6F9', textAlign: 'left' }}>
                <th style={{ padding: '9px 10px' }}>Código</th>
                <th style={{ padding: '9px 10px' }}>Equipo</th>
                <th style={{ padding: '9px 10px' }}>Cliente</th>
                <th style={{ padding: '9px 10px' }}>Falla</th>
                <th style={{ padding: '9px 10px' }}>Estado</th>
                <th style={{ padding: '9px 10px' }}>Precio</th>
                <th style={{ padding: '9px 10px' }}>Tercero</th>
                <th style={{ padding: '9px 10px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#8892A6' }}>
                    Cargando historial…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#8892A6' }}>
                    Sin reparaciones para este filtro.
                  </td>
                </tr>
              ) : (
                rows.map(r => (
                  <tr key={r.id} style={{ borderTop: '1px solid #E6E7F0' }}>
                    <td
                      style={{
                        padding: '8px 10px',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}
                    >
                      {r.code}
                    </td>
                    <td style={{ padding: '8px 10px' }}>{r.device}</td>
                    <td style={{ padding: '8px 10px' }}>
                      {r.clientName || '—'}
                      <br />
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{r.clientPhone || ''}</span>
                    </td>
                    <td
                      style={{
                        padding: '8px 10px',
                        maxWidth: 180,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={r.fault1 || ''}
                    >
                      {r.fault1 || '—'}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 99,
                          background: '#fff',
                          color: STATUS_COLOR[r.status] || '#6B7280',
                          border: `1px solid ${STATUS_COLOR[r.status] || '#E6E7F0'}`,
                        }}
                      >
                        {STATUS_LABEL[r.status] || r.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>{fmt(r.priceCalc)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      {r.thirdParty ? 'Sí' : 'No'}
                    </td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      {r.status !== 'DELIVERED' && r.status !== 'CANCELLED' ? (
                        <>
                          <button
                            onClick={() => marcar(r, false)}
                            style={{
                              marginRight: 6,
                              padding: '5px 9px',
                              background: '#0F9D58',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 7,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Entregado
                          </button>
                          <button
                            onClick={() => marcar(r, true)}
                            style={{
                              padding: '5px 9px',
                              background: '#D97706',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 7,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            A tercero
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: 11, color: '#6B7280' }}>
                          {r.deliveredAt
                            ? new Date(r.deliveredAt).toLocaleDateString('es-AR')
                            : '—'}
                        </span>
                      )}
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
