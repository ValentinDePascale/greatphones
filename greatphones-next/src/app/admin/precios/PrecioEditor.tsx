'use client'

import { useEffect, useRef, useState } from 'react'
import { fmtARS } from '@/lib/precios'

export interface PrecioRow {
  id: string
  modelo: string
  almacenamiento: string
  precioARS: number
  preventaARS: number
  descuentoARS: number
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
  const [edit, setEdit] = useState<PrecioRow | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorModelo, setErrorModelo] = useState('')
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)
  const [form, setForm] = useState({
    modelo: '',
    almacenamiento: '',
    precioARS: 0,
    preventaARS: 0,
    descuentoARS: 0,
  })
  const modeloRef = useRef<HTMLInputElement>(null)

  const toast = (t: string, s: string) => {
    setMsg({ t, s })
    setTimeout(() => setMsg(null), 4000)
  }

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
  }, [endpoint])

  const filtrados = rows.filter(
    r =>
      !buscar || (r.modelo + ' ' + r.almacenamiento).toLowerCase().includes(buscar.toLowerCase()),
  )

  const startNuevo = () => {
    setNuevo(true)
    setEdit(null)
    setErrorModelo('')
    setForm({ modelo: '', almacenamiento: '', precioARS: 0, preventaARS: 0, descuentoARS: 0 })
    requestAnimationFrame(() => modeloRef.current?.focus())
  }
  const startEdit = (r: PrecioRow) => {
    setEdit(r)
    setNuevo(false)
    setErrorModelo('')
    setForm({
      modelo: r.modelo,
      almacenamiento: r.almacenamiento,
      precioARS: r.precioARS,
      preventaARS: r.preventaARS,
      descuentoARS: r.descuentoARS,
    })
    requestAnimationFrame(() => modeloRef.current?.focus())
  }
  const cerrarForm = () => {
    setEdit(null)
    setNuevo(false)
    setErrorModelo('')
  }

  const guardar = async () => {
    if (!form.modelo.trim()) {
      setErrorModelo('El modelo es obligatorio')
      modeloRef.current?.focus()
      return
    }
    setGuardando(true)
    try {
      const payload = {
        ...form,
        precioARS: Number(form.precioARS) || 0,
        preventaARS: Number(form.preventaARS) || 0,
        descuentoARS: Number(form.descuentoARS) || 0,
      }
      const method = edit ? 'PATCH' : 'POST'
      const r = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edit ? { id: edit.id, ...payload } : payload),
      })
      const d = await r.json()
      if (!r.ok) {
        toast('error', d.error || 'Error')
        return
      }
      toast('success', edit ? 'Precio actualizado' : 'Precio creado')
      cerrarForm()
      setRows(prev => {
        if (edit) return prev.map(x => (x.id === edit.id ? { ...x, ...payload } : x))
        return [...prev, d]
      })
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

  const field = (key: keyof typeof form, label: string, type = 'text', requerido = false) => {
    const err = key === 'modelo' ? errorModelo : ''
    return (
      <div>
        <label htmlFor={`f-${key}`} style={labelStyle}>
          {label}
          {requerido ? ' *' : ''}
        </label>
        <input
          ref={key === 'modelo' ? modeloRef : undefined}
          id={`f-${key}`}
          type={type}
          min={type === 'number' ? 0 : undefined}
          style={{ ...inputStyle, ...(err ? inputErrorStyle : {}) }}
          value={String(form[key])}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `f-${key}-error` : undefined}
          onChange={e =>
            setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })
          }
          onBlur={
            key === 'modelo'
              ? () => {
                  if (!form.modelo.trim()) setErrorModelo('El modelo es obligatorio')
                  else setErrorModelo('')
                }
              : undefined
          }
        />
        {err && (
          <p
            id={`f-${key}-error`}
            role="alert"
            style={{ fontSize: 11.5, color: '#DC2626', margin: '4px 0 0' }}
          >
            {err}
          </p>
        )}
      </div>
    )
  }

  const formAbierto = nuevo || edit

  return (
    <div style={{ padding: 8 }}>
      <style>{`
        .pe-grid { display: grid; grid-template-columns: minmax(180px,2fr) repeat(4,1fr); gap: 10px; }
        @media (max-width: 760px) { .pe-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .pe-grid { grid-template-columns: 1fr; } }
        .pe-input:focus { border-color: #FF6B2C !important; outline: none; }
        .pe-btn:focus-visible { outline: 2px solid #FF6B2C; outline-offset: 2px; }
        .pe-add:not(:disabled):hover { filter: brightness(.94); }
        .pe-iconbtn:hover { filter: brightness(.94); }
        .pe-spin { animation: pes 1s linear infinite; }
        @keyframes pes { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .pe-spin { animation: none !important; }
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
          style={{ ...inputStyle, maxWidth: 320 }}
          placeholder="Buscar..."
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
          aria-label="Buscar en la lista de precios"
        />
        {!formAbierto && (
          <button
            onClick={startNuevo}
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
        )}
      </div>

      {formAbierto && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #E6E7F0',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            boxShadow: '0 1px 2px rgba(23,23,45,.04)',
          }}
          role="form"
          aria-label={edit ? 'Editar precio' : 'Nuevo precio'}
        >
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 12, color: '#181B2E' }}>
            {edit ? 'Editar' : 'Nuevo'} {title}
          </div>
          <div className="pe-grid">
            {field('modelo', 'Modelo', 'text', true)}
            {field('almacenamiento', 'Almacenamiento')}
            {field('precioARS', 'Precio ARS', 'number')}
            {field('preventaARS', 'Preventa ARS', 'number')}
            {field('descuentoARS', 'Descuento ARS', 'number')}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
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
                padding: '9px 18px',
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
            <button
              onClick={cerrarForm}
              disabled={guardando}
              className="pe-btn"
              style={{
                background: '#EEF0F6',
                color: '#374151',
                padding: '9px 16px',
                border: 'none',
                borderRadius: 9,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ overflow: 'auto', border: '1px solid #E6E7F0', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
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
                    onClick={() => startEdit(r)}
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
    </div>
  )
}
