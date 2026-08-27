'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fmtARS } from '@/lib/precios'

export interface PrecioRow {
  id: string
  modelo: string
  almacenamiento: string
  precioARS: number
  preventaARS: number
  descuentoARS: number
  imageUrl?: string | null
  colors?: string[]
}

const FILA_VACIA: Omit<PrecioRow, 'id'> = {
  modelo: '',
  almacenamiento: '',
  precioARS: 0,
  preventaARS: 0,
  descuentoARS: 0,
  imageUrl: '',
  colors: [],
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 9,
  border: '1.5px solid #E6E7F0',
  borderRadius: 9,
  fontSize: 13,
  background: '#FBFBFD',
  color: '#181B2E',
  transition: 'border-color .15s',
}
const inputErrorStyle: React.CSSProperties = { borderColor: '#DC2626', background: '#FEF6F6' }
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#3D4356',
  marginBottom: 4,
}

interface Props {
  endpoint: string
  title: string
  emptyText: string
}

export default function PrecioEditor({ endpoint, title, emptyText }: Props) {
  const [rows, setRows] = useState<PrecioRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorModelo, setErrorModelo] = useState('')
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)
  const [modal, setModal] = useState<{
    modo: 'nuevo' | 'editar'
    valores: Omit<PrecioRow, 'id'> & { id?: string }
  } | null>(null)
  const modeloRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const disparadorRef = useRef<HTMLElement | null>(null)

  const toast = useCallback((t: string, s: string) => {
    setMsg({ t, s })
    setTimeout(() => setMsg(null), 4000)
  }, [])

  useEffect(() => {
    let activo = true
    fetch(endpoint, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (activo) {
          setRows(Array.isArray(d) ? d : [])
          setCargando(false)
        }
      })
      .catch(() => {
        if (activo) {
          setCargando(false)
          toast('error', 'Error al cargar')
        }
      })
    return () => {
      activo = false
    }
  }, [endpoint, toast])

  const filtrados = rows.filter(
    r =>
      !buscar || (r.modelo + ' ' + r.almacenamiento).toLowerCase().includes(buscar.toLowerCase()),
  )

  const abrirNuevo = () => {
    disparadorRef.current = document.activeElement as HTMLElement
    setErrorModelo('')
    setModal({ modo: 'nuevo', valores: { ...FILA_VACIA } })
  }

  const abrirEditar = (r: PrecioRow) => {
    disparadorRef.current = document.activeElement as HTMLElement
    setErrorModelo('')
    setModal({ modo: 'editar', valores: { ...r } })
  }

  const cerrarModal = useCallback(() => {
    setModal(null)
    setErrorModelo('')
    requestAnimationFrame(() => disparadorRef.current?.focus())
  }, [])

  const modalAbierto = !!modal

  useEffect(() => {
    if (!modalAbierto) return
    document.body.style.overflow = 'hidden'
    const t = requestAnimationFrame(() => modeloRef.current?.focus())
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault()
        cerrarModal()
        return
      }
      if (ev.key === 'Tab' && modalRef.current) {
        const focuseables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focuseables.length === 0) return
        const primero = focuseables[0]
        const ultimo = focuseables[focuseables.length - 1]
        if (!ev.shiftKey && document.activeElement === ultimo) {
          ev.preventDefault()
          primero.focus()
        } else if (
          ev.shiftKey &&
          (document.activeElement === primero || document.activeElement === modalRef.current)
        ) {
          ev.preventDefault()
          ultimo.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      cancelAnimationFrame(t)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [modalAbierto, cerrarModal])

  const guardar = async () => {
    if (!modal) return
    const esNuevo = modal.modo === 'nuevo'
    if (!modal.valores.modelo.trim()) {
      setErrorModelo('El modelo es obligatorio')
      modeloRef.current?.focus()
      return
    }
    setGuardando(true)
    try {
      const payload = {
        modelo: modal.valores.modelo,
        almacenamiento: modal.valores.almacenamiento,
        precioARS: Number(modal.valores.precioARS) || 0,
        preventaARS: Number(modal.valores.preventaARS) || 0,
        descuentoARS: Number(modal.valores.descuentoARS) || 0,
        imageUrl: (modal.valores as any).imageUrl?.trim() || null,
        colors: ((modal.valores as any).colors as string[]) || [],
      }
      const method = esNuevo ? 'POST' : 'PATCH'
      const body = esNuevo ? payload : { id: modal.valores.id, ...payload }
      const r = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) {
        toast('error', d.error || 'Error')
        return
      }
      toast('success', esNuevo ? 'Precio creado' : 'Precio actualizado')
      setRows(prev =>
        esNuevo
          ? [...prev, d]
          : prev.map(x => (x.id === modal.valores.id ? { ...x, ...payload } : x)),
      )
      setModal(null)
    } catch {
      toast('error', 'Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este precio?')) return
    const r = await fetch(`${endpoint}?id=${id}`, { method: 'DELETE', credentials: 'include' })
    if (!r.ok) {
      const d = await r.json()
      return toast('error', d.error || 'Error')
    }
    toast('success', 'Eliminado')
    setRows(prev => prev.filter(x => x.id !== id))
  }

  const campoModal = (
    key: 'modelo' | 'almacenamiento' | 'precioARS' | 'preventaARS' | 'descuentoARS',
    label: string,
    type = 'text',
    requerido = false,
    autoFocus = false,
  ) => {
    if (!modal) return null
    const err = key === 'modelo' ? errorModelo : ''
    return (
      <div>
        <label htmlFor={`m-${key}`} style={labelStyle}>
          {label}
          {requerido ? ' *' : ''}
        </label>
        <input
          ref={autoFocus ? modeloRef : undefined}
          id={`m-${key}`}
          type={type}
          min={type === 'number' ? 0 : undefined}
          className="pe-input"
          style={{ ...inputStyle, ...(err ? inputErrorStyle : {}) }}
          value={String(modal.valores[key])}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `m-${key}-error` : undefined}
          onChange={e => {
            if (!modal) return
            const valor = type === 'number' ? Number(e.target.value) : e.target.value
            if (key === 'descuentoARS') {
              const descuento = Number(valor) || 0
              setModal({
                ...modal,
                valores: {
                  ...modal.valores,
                  descuentoARS: descuento,
                  preventaARS: Math.max((Number(modal.valores.precioARS) || 0) - descuento, 0),
                },
              })
              return
            }
            setModal({ ...modal, valores: { ...modal.valores, [key]: valor } })
          }}
          onFocus={type === 'number' ? ev => ev.currentTarget.select() : undefined}
          onBlur={
            key === 'modelo'
              ? () => {
                  if (!modal.valores.modelo.trim()) setErrorModelo('El modelo es obligatorio')
                  else setErrorModelo('')
                }
              : undefined
          }
        />
        {err && (
          <p
            id={`m-${key}-error`}
            role="alert"
            style={{ fontSize: 11.5, color: '#DC2626', margin: '4px 0 0' }}
          >
            {err}
          </p>
        )}
        {key === 'descuentoARS' && !err && (
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '4px 0 0' }}>
            Preventa = Precio − Descuento (se calcula solo)
          </p>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: 8 }}>
      <style>{`
        .pm-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .pm-grid .pm-full { grid-column: 1 / -1; }
        @media (max-width: 520px) { .pm-grid { grid-template-columns: 1fr; } }
        .pe-input:focus { border-color: #FF6B2C !important; outline: none; }
        .pe-btn:focus-visible { outline: 2px solid #FF6B2C; outline-offset: 2px; }
        .pe-add:not(:disabled):hover { filter: brightness(.94); }
        .pe-iconbtn:hover:not(:disabled) { filter: brightness(.94); }
        .pe-cancel:hover:not(:disabled) { background: #E4E7EF !important; }
        .pm-card { animation: pmin .16s ease-out; }
        @keyframes pmin { from { opacity: 0; transform: translateY(8px) scale(.985); } to { opacity: 1; transform: none; } }
        .pe-spin { animation: pes 1s linear infinite; }
        @keyframes pes { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .pe-spin { animation: none !important; }
          .pm-card { animation: none !important; }
          .pe-add, .pe-iconbtn { transition: none !important; }
        }
      `}</style>

      {msg && (
        <div
          role={msg.t === 'success' ? 'status' : 'alert'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 10,
            marginBottom: 14,
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
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <input
          className="pe-input"
          style={{ ...inputStyle, flex: '1 1 200px', maxWidth: 320, minWidth: 0 }}
          placeholder="Buscar..."
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
          aria-label="Buscar en la lista de precios"
        />
        <button
          onClick={abrirNuevo}
          className="pe-btn pe-add"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: 'linear-gradient(135deg,#FF6B2C,#FF8A50)',
            color: '#fff',
            padding: '10px 18px',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'filter .15s',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 17 }} aria-hidden="true">
            add
          </span>
          Agregar {title}
        </button>
      </div>

      <div style={{ overflow: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid #E6E7F0', borderRadius: 10 }}>
        <table style={{ width: '100%', minWidth: 520, borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F4F6F9', textAlign: 'left' }}>
              <th scope="col" style={{ padding: '9px 10px' }}>
                Modelo
              </th>
              <th scope="col" style={{ padding: '9px 10px' }}>
                Almac.
              </th>
              <th scope="col" style={{ padding: '9px 10px' }}>
                Precio ARS
              </th>
              <th scope="col" style={{ padding: '9px 10px' }}>
                Preventa ARS
              </th>
              <th scope="col" style={{ padding: '9px 10px' }}>
                Descuento ARS
              </th>
              <th scope="col" style={{ padding: '9px 10px' }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr>
                <td colSpan={6} style={{ padding: 18, textAlign: 'center', color: '#8892A6' }}>
                  Cargando…
                </td>
              </tr>
            )}
            {!cargando && filtrados.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 18, textAlign: 'center', color: '#8892A6' }}>
                  {buscar ? 'Sin resultados para tu búsqueda.' : emptyText}
                </td>
              </tr>
            )}
            {filtrados.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid #E6E7F0' }}>
                <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.modelo}</td>
                <td style={{ padding: '8px 10px', color: '#667788' }}>{r.almacenamiento || '—'}</td>
                <td style={{ padding: '8px 10px' }}>{fmtARS(r.precioARS)}</td>
                <td style={{ padding: '8px 10px', color: '#B7950B' }}>{fmtARS(r.preventaARS)}</td>
                <td style={{ padding: '8px 10px', color: '#1E8449' }}>{fmtARS(r.descuentoARS)}</td>
                <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>
                  <button
                    onClick={() => abrirEditar(r)}
                    className="pe-btn pe-iconbtn"
                    aria-label={`Editar ${r.modelo} ${r.almacenamiento}`}
                    title="Editar"
                    style={{
                      marginRight: 6,
                      padding: '5px 8px',
                      background: '#2563EB',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 7,
                      cursor: 'pointer',
                      verticalAlign: 'middle',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 14, display: 'block' }}
                      aria-hidden="true"
                    >
                      edit
                    </span>
                  </button>
                  <button
                    onClick={() => eliminar(r.id)}
                    className="pe-btn pe-iconbtn"
                    aria-label={`Eliminar ${r.modelo} ${r.almacenamiento}`}
                    title="Eliminar"
                    style={{
                      padding: '5px 8px',
                      background: '#DC2626',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 7,
                      cursor: 'pointer',
                      verticalAlign: 'middle',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 14, display: 'block' }}
                      aria-hidden="true"
                    >
                      delete
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
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
            onClick={cerrarModal}
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,.45)' }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pm-titulo"
            ref={modalRef}
            tabIndex={-1}
            className="pm-card"
            style={{
              position: 'relative',
              zIndex: 1,
              width: 'min(92vw, 560px)',
              maxHeight: '90vh',
              overflow: 'auto',
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
                id="pm-titulo"
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
                  style={{ fontSize: 19, color: '#FF6B2C' }}
                  aria-hidden="true"
                >
                  {modal.modo === 'nuevo' ? 'add_circle' : 'edit'}
                </span>
                {modal.modo === 'nuevo' ? `Nuevo ${title}` : `Editar ${title}`}
              </h2>
              <button
                onClick={cerrarModal}
                disabled={guardando}
                className="pe-btn pe-iconbtn"
                aria-label="Cerrar"
                title="Cerrar (Esc)"
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
            {modal.modo === 'editar' && (
              <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 14px' }}>
                {modal.valores.modelo} {modal.valores.almacenamiento} · Venta actual:{' '}
                {fmtARS(Number(modal.valores.precioARS) || 0)}
              </p>
            )}

            <div className="pm-grid" style={{ marginTop: 10 }}>
              <div className="pm-full">{campoModal('modelo', 'Modelo', 'text', true, true)}</div>
              {campoModal('almacenamiento', 'Almacenamiento')}
              {campoModal('precioARS', 'Precio ARS', 'number')}
              {campoModal('preventaARS', 'Preventa ARS', 'number')}
              {campoModal('descuentoARS', 'Descuento ARS', 'number')}
            </div>

            <div className="pm-grid" style={{ marginTop: 10 }}>
              <div className="pm-full">
                <label htmlFor="m-imagen" style={labelStyle}>
                  Imagen (URL) — fondo blanco, ej. GSMArena bigpic
                </label>
                <input
                  id="m-imagen"
                  type="text"
                  value={(modal.valores as any).imageUrl || ''}
                  onChange={e =>
                    setModal({
                      ...modal,
                      valores: { ...modal.valores, imageUrl: e.target.value },
                    })
                  }
                  style={inputStyle}
                  placeholder="https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg"
                />
                {(modal.valores as any).imageUrl ? (
                  <img
                    src={(modal.valores as any).imageUrl}
                    alt="preview"
                    loading="lazy"
                    style={{ height: 90, marginTop: 8, border: '1px solid #E6E7F0', borderRadius: 8, padding: 4 }}
                  />
                ) : null}
              </div>
              <div className="pm-full">
                <label htmlFor="m-colores" style={labelStyle}>
                  Colores (separados por coma)
                </label>
                <input
                  id="m-colores"
                  type="text"
                  value={((modal.valores as any).colors || []).join(', ')}
                  onChange={e =>
                    setModal({
                      ...modal,
                      valores: {
                        ...modal.valores,
                        colors: e.target.value.split(',').map(c => c.trim()).filter(Boolean),
                      },
                    })
                  }
                  style={inputStyle}
                  placeholder="Titanio Natural, Titanio Azul"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button
                onClick={cerrarModal}
                disabled={guardando}
                className="pe-btn pe-cancel"
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
                onClick={guardar}
                disabled={guardando}
                className="pe-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  background: guardando ? '#7FD3A8' : '#0F9D58',
                  color: '#fff',
                  padding: '9px 20px',
                  border: 'none',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: guardando ? 'wait' : 'pointer',
                }}
              >
                {guardando ? (
                  <>
                    <span
                      className="material-symbols-outlined pe-spin"
                      style={{ fontSize: 15 }}
                      aria-hidden="true"
                    >
                      progress_activity
                    </span>
                    Guardando…
                  </>
                ) : (
                  <>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 15 }}
                      aria-hidden="true"
                    >
                      save
                    </span>
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
