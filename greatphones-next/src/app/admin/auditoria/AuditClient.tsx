'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import AdminTopbar from '@/components/AdminTopbar'

interface Audit {
  id: string
  entityType: string
  entityId: string
  action: string
  reason: string | null
  operator: string | null
  createdAt: string
}
interface Resp {
  data: Audit[]
  total: number
  page: number
  totalPages: number
}

const ACTION_LABEL: Record<string, string> = {
  ANULACION: 'Anulación',
  RESTAURACION: 'Restauración',
  CORRECCION: 'Corrección',
  CREACION: 'Creación',
  UPDATE: 'Actualización',
}
const ACTION_COLOR: Record<string, string> = {
  ANULACION: '#DC2626',
  RESTAURACION: '#0F9D58',
  CORRECCION: '#D97706',
  CREACION: '#2563EB',
  UPDATE: '#6B7280',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 9,
  border: '1.5px solid #E6E7F0',
  borderRadius: 9,
  fontSize: 13,
  background: '#FBFBFD',
  color: '#181B2E',
}

export default function AuditClient() {
  const [data, setData] = useState<Audit[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [entityType, setEntityType] = useState('')
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)
  const [showAnular, setShowAnular] = useState(false)
  const [aType, setAType] = useState('Product')
  const [aId, setAId] = useState('')
  const [aReason, setAReason] = useState('')
  const [guardando, setGuardando] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const load = useCallback(
    async (p = page, e = entityType, s = search) => {
      setCargando(true)
      const q = new URLSearchParams({ page: String(p), limit: '50' })
      if (e) q.set('entityType', e)
      if (s) q.set('search', s)
      try {
        const r = await fetch(`/api/admin/audit?${q}`, { credentials: 'include' })
        const d: Resp = await r.json()
        setData(d.data || [])
        setTotal(d.total)
        setTotalPages(d.totalPages || 1)
        setPage(d.page || 1)
      } catch {
        setMsg({ t: 'error', s: 'Error al cargar auditoría' })
      }
      setCargando(false)
    },
    [page, entityType, search],
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(1, '', '')
  }, [load])

  useEffect(() => {
    if (!showAnular) return
    document.body.style.overflow = 'hidden'
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setShowAnular(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [showAnular])

  const anularSubmit = async () => {
    if (!aReason.trim()) return setMsg({ t: 'error', s: 'El motivo es obligatorio' })
    if (!aId.trim()) return setMsg({ t: 'error', s: 'Ingresá el ID de la operación' })
    setGuardando(true)
    try {
      const r = await fetch('/api/admin/audit', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: aType, entityId: aId.trim(), reason: aReason.trim() }),
      })
      const d = await r.json()
      if (!r.ok) return setMsg({ t: 'error', s: d.error || 'Error al anular' })
      setMsg({ t: 'success', s: 'Operación anulada correctamente' })
      setShowAnular(false)
      setAId('')
      setAReason('')
      load(1, entityType, search)
      setTimeout(() => setMsg(null), 4000)
    } catch {
      setMsg({ t: 'error', s: 'Error de conexión' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <AdminTopbar titulo="Auditoría" />
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        <style>{`
          .pe-input:focus{ border-color:#FF6B2C!important; outline:none}
          .pe-btn:focus-visible{ outline:2px solid #FF6B2C; outline-offset:2px}
          .pm-card{ animation:pmin .16s ease-out}
          @keyframes pmin{from{opacity:0;transform:translateY(8px) scale(.985)} to{opacity:1;transform:none}}
          @media(prefers-reduced-motion:reduce){.pm-card{animation:none!important}}
        `}</style>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 4,
          }}
        >
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
            Historial de anulaciones, restauraciones y cambios. Nunca se borra información.
          </p>
          <button
            onClick={() => setShowAnular(true)}
            className="pe-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: 'linear-gradient(135deg,#DC2626,#B91C1C)',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
              block
            </span>
            Anular operación
          </button>
        </div>

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
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 16,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              flex: '1 1 200px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 10px',
              border: '1.5px solid #E6E7F0',
              borderRadius: 9,
              background: '#fff',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: '#94A3B8' }}
              aria-hidden="true"
            >
              search
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') load(1, entityType, (e.target as HTMLInputElement).value)
              }}
              placeholder="Buscar por ID, motivo u operador..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                padding: '10px 0',
                fontSize: 13,
              }}
              aria-label="Buscar en auditoría"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('')
                  load(1, entityType, '')
                }}
                aria-label="Limpiar"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  display: 'flex',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16 }}
                  aria-hidden="true"
                >
                  close
                </span>
              </button>
            )}
          </div>
          <select
            value={entityType}
            onChange={e => {
              setEntityType(e.target.value)
              load(1, e.target.value, search)
            }}
            className="pe-input"
            style={{ ...inputStyle, flex: '0 1 180px', background: '#fff' }}
          >
            <option value="">Todas las entidades</option>
            {['Product', 'Accessory', 'Order', 'Repair', 'Quote', 'PreOrder'].map(o => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <button
            onClick={() => load(1, entityType, search)}
            className="pe-btn"
            style={{
              padding: '10px 16px',
              background: '#fff',
              color: '#374151',
              border: '1.5px solid #E6E7F0',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden="true">
              search
            </span>
            Buscar
          </button>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #E6E7F0',
            borderRadius: 12,
            overflow: 'hidden',
            marginTop: 14,
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#181B2E', color: '#fff' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                    Fecha
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Entidad</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Acción</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Motivo</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Operador</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#8892A6' }}>
                      Cargando auditoría…
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#9AA1B2' }}>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 28,
                          color: '#C3C9D6',
                          display: 'block',
                          marginBottom: 6,
                        }}
                        aria-hidden="true"
                      >
                        verified_user
                      </span>
                      Sin eventos de auditoría
                    </td>
                  </tr>
                ) : (
                  data.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #EEF0F5' }}>
                      <td
                        style={{
                          padding: '9px 14px',
                          color: '#6B7280',
                          whiteSpace: 'nowrap',
                          fontSize: 12.5,
                        }}
                      >
                        {new Date(a.createdAt).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 100,
                            background: '#FAFBFD',
                            border: '1px solid #E6E7F0',
                            color: '#475569',
                          }}
                        >
                          {a.entityType}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '9px 14px',
                          fontFamily: 'monospace',
                          fontSize: 11.5,
                          maxWidth: 140,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={a.entityId}
                      >
                        {a.entityId}
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <span
                          style={{
                            color: '#fff',
                            background: ACTION_COLOR[a.action] || '#6B7280',
                            padding: '3px 10px',
                            borderRadius: 100,
                            fontSize: 11,
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ACTION_LABEL[a.action] || a.action}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '9px 14px',
                          color: '#3D4356',
                          maxWidth: 220,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={a.reason || ''}
                      >
                        {a.reason || '—'}
                      </td>
                      <td style={{ padding: '9px 14px', color: '#6B7280' }}>{a.operator || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 4px',
            fontSize: 13,
            color: '#6B7280',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">
              list_alt
            </span>
            {total} eventos
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => load(page - 1, entityType, search)}
              disabled={page <= 1 || cargando}
              className="pe-btn"
              style={{
                padding: '7px 14px',
                border: '1.5px solid #E6E7F0',
                borderRadius: 9,
                background: page <= 1 ? '#F4F6F9' : '#fff',
                color: page <= 1 ? '#9AA1B2' : '#374151',
                cursor: page <= 1 ? 'default' : 'pointer',
                fontWeight: 600,
              }}
            >
              ← Anterior
            </button>
            <span style={{ fontWeight: 600, color: '#181B2E' }}>
              Pág {page} de {totalPages}
            </span>
            <button
              onClick={() => load(page + 1, entityType, search)}
              disabled={page >= totalPages || cargando}
              className="pe-btn"
              style={{
                padding: '7px 14px',
                border: '1.5px solid #E6E7F0',
                borderRadius: 9,
                background: page >= totalPages ? '#F4F6F9' : '#fff',
                color: page >= totalPages ? '#9AA1B2' : '#374151',
                cursor: page >= totalPages ? 'default' : 'pointer',
                fontWeight: 600,
              }}
            >
              Siguiente →
            </button>
          </span>
        </div>

        {showAnular && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div
              onClick={() => setShowAnular(false)}
              aria-hidden="true"
              style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,.45)' }}
            />
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="au-titulo"
              tabIndex={-1}
              className="pm-card"
              style={{
                position: 'relative',
                zIndex: 1,
                width: 'min(92vw, 480px)',
                background: '#fff',
                border: '1px solid #E6E7F0',
                borderRadius: 14,
                padding: 22,
                boxShadow: '0 12px 48px rgba(23,23,45,.22)',
                outline: 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 4,
                }}
              >
                <h2
                  id="au-titulo"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#181B2E',
                    margin: 0,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 19, color: '#DC2626' }}
                    aria-hidden="true"
                  >
                    block
                  </span>
                  Anular operación
                </h2>
                <button
                  onClick={() => setShowAnular(false)}
                  className="pe-btn"
                  aria-label="Cerrar"
                  style={{
                    background: '#EEF0F6',
                    color: '#64748B',
                    border: 'none',
                    borderRadius: 8,
                    padding: 6,
                    cursor: 'pointer',
                    display: 'inline-flex',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 17 }}
                    aria-hidden="true"
                  >
                    close
                  </span>
                </button>
              </div>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 14px' }}>
                La operación quedará marcada como anulada. No se borra información.
              </p>

              <label
                htmlFor="au-type"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#3D4356',
                  marginBottom: 5,
                }}
              >
                Entidad
              </label>
              <select
                id="au-type"
                value={aType}
                onChange={e => setAType(e.target.value)}
                className="pe-input"
                style={inputStyle}
              >
                {['Product', 'Accessory', 'Order', 'Repair', 'Quote', 'PreOrder'].map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>

              <label
                htmlFor="au-id"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#3D4356',
                  marginTop: 12,
                  marginBottom: 5,
                }}
              >
                ID de la operación
              </label>
              <input
                id="au-id"
                value={aId}
                onChange={e => setAId(e.target.value)}
                placeholder="id o código"
                className="pe-input"
                style={inputStyle}
              />

              <label
                htmlFor="au-reason"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#3D4356',
                  marginTop: 12,
                  marginBottom: 5,
                }}
              >
                Motivo *
              </label>
              <input
                id="au-reason"
                value={aReason}
                onChange={e => setAReason(e.target.value)}
                placeholder="Ej: Precio incorrecto, cliente canceló..."
                className="pe-input"
                style={inputStyle}
              />

              <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAnular(false)}
                  className="pe-btn"
                  style={{
                    background: '#EEF0F6',
                    color: '#374151',
                    padding: '9px 18px',
                    border: 'none',
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={anularSubmit}
                  disabled={guardando}
                  className="pe-btn"
                  style={{
                    background: guardando ? '#F87171' : 'linear-gradient(135deg,#DC2626,#B91C1C)',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: guardando ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {guardando ? (
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 15, animation: 'spin 1s linear infinite' }}
                      aria-hidden="true"
                    >
                      progress_activity
                    </span>
                  ) : (
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 15 }}
                      aria-hidden="true"
                    >
                      block
                    </span>
                  )}
                  Confirmar anulación
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
