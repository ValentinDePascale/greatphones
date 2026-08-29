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
  cost: number
  thirdPartyCost: number | null
  profitReal: number | null
  thirdParty: boolean
  deliveredAt: string | null
  createdAt: string
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  DIAGNOSIS: 'Diagnóstico',
  APPROVED: 'Aprobado',
  IN_PROGRESS: 'En reparación',
  THIRD_PARTY: 'En reparación (Tercero)',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}
const STATUS_COLOR: Record<string, string> = {
  PENDING: '#D97706',
  DIAGNOSIS: '#7C3AED',
  APPROVED: '#2563EB',
  IN_PROGRESS: '#0D9488',
  THIRD_PARTY: '#B45309',
  DELIVERED: '#0F9D58',
  CANCELLED: '#DC2626',
}
// Estados desde los que se puede avanzar a "entregado" o "a tercero"
const ESTADOS_ABIERTOS = ['PENDING', 'DIAGNOSIS', 'APPROVED', 'IN_PROGRESS']

function fmt(n: number | null | undefined) {
  return n != null ? '$' + Number(n).toLocaleString('es-AR') : '—'
}

export default function HistorialClient() {
  const [rows, setRows] = useState<Repair[]>([])
  const [filtro, setFiltro] = useState('TODOS')
  const [cargando, setCargando] = useState(true)
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)
  const [terceroRepairId, setTerceroRepairId] = useState<string | null>(null)
  const [terceroCosto, setTerceroCosto] = useState('')
  const [terceroEnviando, setTerceroEnviando] = useState(false)
  const [costoRepairId, setCostoRepairId] = useState<string | null>(null)
  const [costoValue, setCostoValue] = useState('')
  const [costoEnviando, setCostoEnviando] = useState(false)

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

  const marcar = async (r: Repair, destino: 'DELIVERED' | 'THIRD_PARTY') => {
    if (destino === 'THIRD_PARTY') {
      // Mostrar diálogo para ingresar costo del tercero
      setTerceroRepairId(r.id)
      setTerceroCosto('')
      return
    }
    // Para DELIVERED — pedir costo si no viene de tercero
    if (r.status !== 'THIRD_PARTY') {
      setCostoRepairId(r.id)
      setCostoValue('')
      return
    }
    // Si viene de tercero, entregar sin pedir costo
    const body: Record<string, unknown> = { id: r.id, status: destino }
    if (destino === 'DELIVERED') body.deliveredAt = new Date().toISOString()
    const res = await fetch('/api/admin/taller/reparaciones', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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

  const confirmarTercero = async () => {
    if (!terceroRepairId) return
    const repair = rows.find(x => x.id === terceroRepairId)
    if (!repair) return
    setTerceroEnviando(true)
    try {
      const body: Record<string, unknown> = { id: terceroRepairId, status: 'THIRD_PARTY' }
      if (terceroCosto) body.thirdPartyCost = Math.round(parseFloat(terceroCosto) || 0)
      const res = await fetch('/api/admin/taller/reparaciones', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json()
        setMsg({ t: 'error', s: d.error || 'Error' })
        setTimeout(() => setMsg(null), 3000)
        setTerceroRepairId(null)
        return
      }
      setMsg({ t: 'success', s: `Reparación ${repair.code} enviada a tercero` })
      setTimeout(() => setMsg(null), 3000)
      setTerceroRepairId(null)
      load()
    } finally {
      setTerceroEnviando(false)
    }
  }

  const confirmarCosto = async () => {
    if (!costoRepairId) return
    const repair = rows.find(x => x.id === costoRepairId)
    if (!repair) return
    setCostoEnviando(true)
    try {
      const body: Record<string, unknown> = { id: costoRepairId, status: 'DELIVERED', deliveredAt: new Date().toISOString() }
      if (costoValue) body.cost = Math.round(parseFloat(costoValue) || 0)
      const res = await fetch('/api/admin/taller/reparaciones', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json()
        setMsg({ t: 'error', s: d.error || 'Error' })
        setTimeout(() => setMsg(null), 3000)
        setCostoRepairId(null)
        return
      }
      setMsg({ t: 'success', s: `Reparación ${repair.code} entregada` })
      setTimeout(() => setMsg(null), 3000)
      setCostoRepairId(null)
      load()
    } finally {
      setCostoEnviando(false)
    }
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
                <th style={{ padding: '9px 10px' }}>Ganancia</th>
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
                    <td
                      style={{
                        padding: '8px 10px',
                        fontWeight: 700,
                        color:
                          r.profitReal === null || r.profitReal === undefined
                            ? '#94A3B8'
                            : r.profitReal > 0
                              ? '#0F9D58'
                              : '#DC2626',
                      }}
                    >
                      {r.profitReal !== null && r.profitReal !== undefined ? fmt(r.profitReal) : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      {r.thirdParty ? 'Sí' : 'No'}
                    </td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      {ESTADOS_ABIERTOS.includes(r.status) ? (
                        <>
                          <button
                            onClick={() => marcar(r, 'DELIVERED')}
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
                            onClick={() => marcar(r, 'THIRD_PARTY')}
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
                      ) : r.status === 'THIRD_PARTY' ? (
                        <button
                          onClick={() => marcar(r, 'DELIVERED')}
                          style={{
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

        {terceroRepairId && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999,
            }}
            onClick={() => !terceroEnviando && setTerceroRepairId(null)}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: 24,
                maxWidth: 400,
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ margin: '0 0 16px', color: '#181B2E', fontSize: 16, fontWeight: 700 }}>
                Enviar a reparación con tercero
              </h3>
              <p style={{ fontSize: 13.5, color: '#6B7280', marginBottom: 16 }}>
                ¿Cuánto cuesta la reparación en el tercero?
              </p>
              <input
                type="number"
                value={terceroCosto}
                onChange={e => setTerceroCosto(e.target.value)}
                placeholder="Ej: 50000"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1.5px solid #E6E7F0',
                  borderRadius: 9,
                  fontSize: 13.5,
                  marginBottom: 20,
                  boxSizing: 'border-box',
                }}
                disabled={terceroEnviando}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setTerceroRepairId(null)}
                  disabled={terceroEnviando}
                  style={{
                    padding: '9px 16px',
                    border: '1.5px solid #E6E7F0',
                    background: '#fff',
                    color: '#64748B',
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: terceroEnviando ? 'not-allowed' : 'pointer',
                    opacity: terceroEnviando ? 0.6 : 1,
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarTercero}
                  disabled={terceroEnviando}
                  style={{
                    padding: '9px 16px',
                    border: 'none',
                    background: '#D97706',
                    color: '#fff',
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: terceroEnviando ? 'not-allowed' : 'pointer',
                    opacity: terceroEnviando ? 0.6 : 1,
                  }}
                >
                  {terceroEnviando ? 'Enviando…' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {costoRepairId && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999,
            }}
            onClick={() => !costoEnviando && setCostoRepairId(null)}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: 24,
                maxWidth: 400,
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ margin: '0 0 16px', color: '#181B2E', fontSize: 16, fontWeight: 700 }}>
                Costo de reparación
              </h3>
              <p style={{ fontSize: 13.5, color: '#6B7280', marginBottom: 16 }}>
                ¿Cuál fue el costo de la reparación?
              </p>
              <input
                type="number"
                value={costoValue}
                onChange={e => setCostoValue(e.target.value)}
                placeholder="Ej: 50000"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1.5px solid #E6E7F0',
                  borderRadius: 9,
                  fontSize: 13.5,
                  marginBottom: 20,
                  boxSizing: 'border-box',
                }}
                disabled={costoEnviando}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setCostoRepairId(null)}
                  disabled={costoEnviando}
                  style={{
                    padding: '9px 16px',
                    border: '1.5px solid #E6E7F0',
                    background: '#fff',
                    color: '#64748B',
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: costoEnviando ? 'not-allowed' : 'pointer',
                    opacity: costoEnviando ? 0.6 : 1,
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarCosto}
                  disabled={costoEnviando}
                  style={{
                    padding: '9px 16px',
                    border: 'none',
                    background: '#0F9D58',
                    color: '#fff',
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: costoEnviando ? 'not-allowed' : 'pointer',
                    opacity: costoEnviando ? 0.6 : 1,
                  }}
                >
                  {costoEnviando ? 'Guardando…' : 'Entregar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
