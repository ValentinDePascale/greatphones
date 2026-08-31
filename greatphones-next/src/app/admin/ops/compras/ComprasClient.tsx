'use client'

import { useEffect, useRef, useState } from 'react'
import AdminTopbar from '@/components/AdminTopbar'

const OPERADORES = ['Martin', 'Maca', 'Sam', 'Eva', 'Buda']
const TOTAL = 6
const STEPS = ['Operación', 'Equipo', 'Precio y pago', 'Reparación', 'Preventa', 'Confirmar']

function fmt(n: number) {
  return '$' + (n || 0).toLocaleString('es-AR')
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 10,
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
  fontSize: 12.5,
  fontWeight: 600,
  color: '#3D4356',
  marginTop: 14,
  marginBottom: 5,
}

export default function ComprasClient() {
  const [operador, setOperador] = useState('')
  const [tipo, setTipo] = useState('COMPRA')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [proveedor, setProveedor] = useState('')
  const [cuil, setCuil] = useState('')
  const [modelo, setModelo] = useState('')
  const [imei, setImei] = useState('')
  const [color, setColor] = useState('')
  const [estadoFisico, setEstadoFisico] = useState('Bueno')
  const [precioCompra, setPrecioCompra] = useState('')
  const [precioConsig, setPrecioConsig] = useState('')
  const [formaPago, setFormaPago] = useState('Efectivo')
  const [reparacion, setReparacion] = useState('No')
  const [costoRep, setCostoRep] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [esPreventa, setEsPreventa] = useState('No')
  const [preventas, setPreventas] = useState<
    { id: string; code: string; clientName: string; productModelName: string | null }[]
  >([])
  const [nPre, setNPre] = useState('')
  const [obs, setObs] = useState('')

  const [step, setStep] = useState(1)
  const [maxStep, setMaxStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverMsg, setServerMsg] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<{ numero: string; estado: string } | null>(null)
  const errRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let activo = true
    fetch('/api/admin/ops/compras', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (activo) setPreventas(Array.isArray(d) ? d : [])
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  const validarPaso = (p: number): Record<string, string> => {
    const e: Record<string, string> = {}
    if (p === 1 && !operador) e.operador = 'Seleccioná el operador'
    if (p === 2 && !modelo.trim()) e.modelo = 'Ingresá el modelo del equipo'
    if (p === 3) {
      if (tipo === 'COMPRA' && (!precioCompra || +precioCompra <= 0))
        e.precioCompra = 'El precio de compra debe ser mayor a 0'
      if (tipo === 'CONSIGNACION' && (!precioConsig || +precioConsig <= 0))
        e.precioConsig = 'El precio acordado debe ser mayor a 0'
    }
    if (p === 5 && esPreventa === 'Si' && !nPre) e.nPre = 'Seleccioná la preventa a vincular'
    return e
  }

  const limpiarError = (id: string) =>
    setErrors(prev => {
      if (!prev[id]) return prev
      const n = { ...prev }
      delete n[id]
      return n
    })

  const validarEnBlur = (id: string) =>
    setErrors(prev => {
      const nuevo = validarPaso(step)[id]
      if (nuevo && !prev[id]) return { ...prev, [id]: nuevo }
      if (!nuevo && prev[id]) {
        const n = { ...prev }
        delete n[id]
        return n
      }
      return prev
    })

  const irAPaso = (dest: number) => {
    if (dest > step) {
      const e = validarPaso(step)
      setErrors(e)
      if (Object.keys(e).length > 0) {
        requestAnimationFrame(() => {
          errRef.current?.focus({ preventScroll: true })
          errRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        })
        return
      }
    }
    setServerMsg(null)
    setErrors({})
    setStep(dest)
    setMaxStep(m => Math.max(m, dest))
  }

  const resetear = () => {
    setModelo('')
    setImei('')
    setProveedor('')
    setCuil('')
    setColor('')
    setPrecioCompra('')
    setPrecioConsig('')
    setCostoRep('')
    setPrecioVenta('')
    setObs('')
    setEsPreventa('No')
    setNPre('')
    setReparacion('No')
    setEstadoFisico('Bueno')
    setFormaPago('Efectivo')
    setFecha(new Date().toISOString().split('T')[0])
    setStep(1)
    setMaxStep(1)
    setErrors({})
    setServerMsg(null)
    setDone(null)
  }

  const enviar = async () => {
    const e = validarPaso(3)
    const e5 = validarPaso(5)
    const todos = { ...e, ...e5 }
    if (Object.keys(todos).length > 0) {
      setErrors(todos)
      const primero = Object.keys(todos)[0]
      const pasoDelError =
        primero === 'operador' ? 1 : primero === 'modelo' ? 2 : primero.startsWith('precio') ? 3 : 5
      setStep(pasoDelError)
      requestAnimationFrame(() => {
        errRef.current?.focus({ preventScroll: true })
        errRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
      return
    }
    setSending(true)
    setServerMsg(null)
    try {
      const r = await fetch('/api/admin/ops/compras', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          fecha,
          proveedor,
          cuil,
          modelo,
          imei,
          color,
          estadoFisico,
          precioCompra: +precioCompra || 0,
          precioConsig: +precioConsig || 0,
          formaPago,
          reparacion,
          costoRep: +costoRep || 0,
          precioVenta: +precioVenta || 0,
          esPreventa,
          nPreAsociada: esPreventa === 'Si' ? nPre : '',
          operador,
          obs,
        }),
      })
      const d = await r.json()
      if (!r.ok) {
        setServerMsg(d.error || 'Error al registrar la compra')
        return
      }
      setDone({ numero: d.numero, estado: d.estado })
    } catch {
      setServerMsg('Error de conexión. Intentá de nuevo.')
    } finally {
      setSending(false)
    }
  }

  const fieldProps = (id: string) => ({
    id,
    style: { ...inputStyle, ...(errors[id] ? inputErrorStyle : {}) },
    'aria-invalid': errors[id] ? true : undefined,
    'aria-describedby': errors[id] ? `${id}-error` : undefined,
  })

  const preventaSel = preventas.find(p => p.id === nPre)

  if (done) {
    return (
      <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
        <style>{`
          .cw-btn:focus-visible { outline: 2px solid #FF6B2C; outline-offset: 2px; }
          .cw-primary:not(:disabled):hover { filter: brightness(.94); }
        `}</style>
        <div
          role="status"
          style={{
            background: '#fff',
            border: '1px solid #E6E7F0',
            borderRadius: 14,
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 56, color: '#0F9D58' }}
            aria-hidden="true"
          >
            check_circle
          </span>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#181B2E', margin: '12px 0 4px' }}>
            Compra registrada
          </h2>
          <p style={{ fontSize: 13.5, color: '#6B7280', margin: 0 }}>
            Operación <strong style={{ color: '#181B2E' }}>{done.numero}</strong> · Estado:{' '}
            <strong style={{ color: '#181B2E' }}>{done.estado}</strong>
          </p>
          <button
            onClick={resetear}
            className="cw-btn cw-primary"
            style={{
              marginTop: 24,
              background: 'linear-gradient(135deg,#FF6B2C,#FF8A50)',
              color: '#fff',
              padding: '11px 28px',
              border: 'none',
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cargar otra compra
          </button>
        </div>
      </div>
    )
  }

  const resumen: [string, string][] = [
    ['Operador', operador || '—'],
    [
      'Tipo de ingreso',
      tipo === 'COMPRA' ? 'COMPRA — equipo propio' : 'CONSIGNACIÓN — equipo de tercero',
    ],
    ['Fecha', fecha],
    ['Proveedor', proveedor || '—'],
    ['Modelo', modelo || '—'],
    ['IMEI / Serie', imei || '—'],
    ['Color', color || '—'],
    ['Estado físico', estadoFisico],
    [
      tipo === 'COMPRA' ? 'Precio de compra' : 'Precio consignación',
      fmt(+(tipo === 'COMPRA' ? precioCompra : precioConsig) || 0),
    ],
    ['Forma de pago', formaPago],
    [
      '¿Necesita arreglo?',
      reparacion === 'Sí'
        ? `Sí — ${fmt(+costoRep || 0)} (venta est. ${fmt(+precioVenta || 0)})`
        : 'No',
    ],
    [
      'Preventa vinculada',
      esPreventa === 'Si' && preventaSel ? `${preventaSel.code} → ${preventaSel.clientName}` : 'No',
    ],
  ]

  return (
    <>
      <AdminTopbar titulo="Registrar Compra" />
      <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
        <style>{`
        .cw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .cw-radio-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px; }
        @media (max-width: 640px) { .cw-grid { grid-template-columns: 1fr; } .cw-steplabel { display: none; } }
        @media (max-width: 380px){ .cw-radio-grid{ grid-template-columns:1fr; } }
        .cw-input:focus { border-color: #FF6B2C !important; outline: none; }
        .cw-btn:focus-visible { outline: 2px solid #FF6B2C; outline-offset: 2px; }
        .cw-primary:not(:disabled):hover { filter: brightness(.94); }
        .cw-back:not(:disabled):hover { background: #F4F6F9; }
        .cw-dot-btn:focus-visible { outline: 2px solid #FF6B2C; outline-offset: 2px; }
        .cw-spin { animation: cws 1s linear infinite; }
        @keyframes cws { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .cw-spin { animation: none !important; }
          .cw-bar, .cw-dot-btn, .cw-btn { transition: none !important; }
        }
      `}</style>

        <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 18px' }}>
          Compra de equipos o consignación para el local
        </p>

        <nav aria-label="Progreso del formulario">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <p
              style={{ fontSize: 12.5, fontWeight: 700, color: '#181B2E', margin: 0 }}
              aria-hidden="true"
            >
              Paso {step} de {TOTAL} · {STEPS[step - 1]}
            </p>
            <p style={{ fontSize: 11.5, color: '#94A3B8', margin: 0 }} aria-hidden="true">
              {Math.round((step / TOTAL) * 100)}%
            </p>
          </div>
          <div
            style={{ height: 5, background: '#EDF0F6', borderRadius: 99, overflow: 'hidden' }}
            aria-hidden="true"
          >
            <div
              className="cw-bar"
              style={{
                height: '100%',
                width: `${(step / TOTAL) * 100}%`,
                background: 'linear-gradient(90deg,#FF6B2C,#FF8A50)',
                borderRadius: 99,
                transition: 'width .25s ease',
              }}
            />
          </div>
          <ol
            style={{
              display: 'flex',
              alignItems: 'center',
              listStyle: 'none',
              margin: '14px 0 0',
              padding: 0,
            }}
          >
            {STEPS.map((label, i) => {
              const n = i + 1
              const completo = n < step
              const activo = n === step
              const alcanzable = n <= maxStep
              return (
                <li
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: n < TOTAL ? 1 : '0 0 auto',
                    minWidth: 0,
                  }}
                >
                  <button
                    type="button"
                    className="cw-dot-btn"
                    onClick={() => alcanzable && irAPaso(n)}
                    disabled={!alcanzable}
                    aria-label={`Paso ${n}: ${label}${activo ? ' (actual)' : completo ? ' (completado)' : ''}`}
                    aria-current={activo ? 'step' : undefined}
                    title={label}
                    style={{
                      flexShrink: 0,
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      border: activo
                        ? '2.5px solid #FF6B2C'
                        : '2px solid ' + (completo ? '#FFD3BC' : '#E6E7F0'),
                      background: activo ? '#FF6B2C' : completo ? '#FFF1E8' : '#FBFBFD',
                      color: activo ? '#fff' : completo ? '#FF6B2C' : '#B6BCCB',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: alcanzable ? 'pointer' : 'default',
                      transition: 'background .15s, border-color .15s',
                    }}
                  >
                    {completo ? (
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16 }}
                        aria-hidden="true"
                      >
                        check
                      </span>
                    ) : (
                      n
                    )}
                  </button>
                  {n < TOTAL && (
                    <>
                      <span
                        className="cw-steplabel"
                        style={{
                          fontSize: 11,
                          fontWeight: activo ? 700 : 500,
                          color: activo ? '#FF6B2C' : completo ? '#F08A4B' : '#B6BCCB',
                          marginLeft: 6,
                          marginRight: 8,
                          whiteSpace: 'nowrap',
                        }}
                        aria-hidden="true"
                      >
                        {label}
                      </span>
                      <span
                        aria-hidden="true"
                        style={{
                          flex: 1,
                          minWidth: 8,
                          height: 2,
                          background: completo ? '#FFD3BC' : '#EDF0F6',
                          borderRadius: 2,
                          marginRight: 6,
                        }}
                      />
                    </>
                  )}
                </li>
              )
            })}
          </ol>
          <p
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)',
              whiteSpace: 'nowrap',
            }}
            role="status"
          >
            {`Paso ${step} de ${TOTAL}: ${STEPS[step - 1]}`}
          </p>
        </nav>

        <form
          onSubmit={ev => {
            ev.preventDefault()
            if (step < TOTAL) irAPaso(step + 1)
            else enviar()
          }}
          style={{
            background: '#fff',
            border: '1px solid #E6E7F0',
            borderRadius: 14,
            padding: 24,
            marginTop: 16,
            boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)',
          }}
        >
          {Object.keys(errors).length > 0 && (
            <div
              ref={errRef}
              tabIndex={-1}
              role="alert"
              aria-labelledby="cw-error-title"
              style={{
                background: '#FEF2F2',
                borderLeft: '4px solid #DC2626',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 16,
                outline: 'none',
              }}
            >
              <p
                id="cw-error-title"
                style={{ fontSize: 13, fontWeight: 700, color: '#B91C1C', margin: '0 0 6px' }}
              >
                Revisá estos datos para continuar:
              </p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {Object.entries(errors).map(([id, txt]) => (
                  <li key={id}>
                    <a href={`#${id}`} style={{ fontSize: 12.5, color: '#DC2626' }}>
                      {txt}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {serverMsg && (
            <div
              role="alert"
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 8,
                padding: '11px 14px',
                marginBottom: 16,
                color: '#B91C1C',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {serverMsg}
            </div>
          )}

          {step === 1 && (
            <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
              <legend style={{ fontSize: 15, fontWeight: 800, color: '#181B2E', marginBottom: 2 }}>
                ¿Quién carga esto y qué tipo de ingreso es?
              </legend>
              <label htmlFor="operador" style={labelStyle}>
                Operador *
              </label>
              <select
                {...fieldProps('operador')}
                className="cw-input"
                value={operador}
                onChange={e => {
                  setOperador(e.target.value)
                  limpiarError('operador')
                }}
                onBlur={() => validarEnBlur('operador')}
              >
                <option value="" disabled>
                  Seleccionar...
                </option>
                {OPERADORES.map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              {errors.operador && (
                <p
                  id="operador-error"
                  style={{ fontSize: 12, color: '#DC2626', margin: '5px 0 0' }}
                >
                  {errors.operador}
                </p>
              )}

              <label htmlFor="tipo" style={labelStyle}>
                Tipo de ingreso *
              </label>
              <select
                {...fieldProps('tipo')}
                className="cw-input"
                value={tipo}
                onChange={e => setTipo(e.target.value)}
              >
                <option value="COMPRA">COMPRA — equipo propio</option>
                <option value="CONSIGNACION">CONSIGNACION — equipo de tercero</option>
              </select>
              <p style={{ fontSize: 11.5, color: '#6B7280', margin: '5px 0 0', lineHeight: 1.5 }}>
                {tipo === 'COMPRA'
                  ? 'COMPRA: el equipo pasa a ser stock propio del local.'
                  : 'CONSIGNACIÓN: el equipo sigue siendo de tercero hasta que se venda.'}
              </p>

              <label htmlFor="fecha" style={labelStyle}>
                Fecha
              </label>
              <input
                type="date"
                {...fieldProps('fecha')}
                className="cw-input"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
              />
            </fieldset>
          )}

          {step === 2 && (
            <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
              <legend style={{ fontSize: 15, fontWeight: 800, color: '#181B2E', marginBottom: 2 }}>
                Datos del equipo
              </legend>
              <div className="cw-grid" style={{ marginTop: 12 }}>
                <div>
                  <label htmlFor="proveedor" style={{ ...labelStyle, marginTop: 0 }}>
                    Proveedor / Origen
                  </label>
                  <input
                    {...fieldProps('proveedor')}
                    className="cw-input"
                    value={proveedor}
                    onChange={e => setProveedor(e.target.value)}
                    placeholder="Ej: Juan Pérez, Particular"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="cuil" style={{ ...labelStyle, marginTop: 0 }}>
                    CUIL/CUIT proveedor
                  </label>
                  <input
                    {...fieldProps('cuil')}
                    className="cw-input"
                    value={cuil}
                    onChange={e => setCuil(e.target.value)}
                    placeholder="Ej: 20-12345678-9"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="cw-grid" style={{ marginTop: 10 }}>
                <div>
                  <label htmlFor="modelo" style={{ ...labelStyle, marginTop: 0 }}>
                    Equipo / Modelo *
                  </label>
                  <input
                    {...fieldProps('modelo')}
                    className="cw-input"
                    value={modelo}
                    onChange={e => {
                      setModelo(e.target.value)
                      limpiarError('modelo')
                    }}
                    onBlur={() => validarEnBlur('modelo')}
                    placeholder="iPhone 14"
                    autoComplete="off"
                  />
                  {errors.modelo && (
                    <p
                      id="modelo-error"
                      style={{ fontSize: 12, color: '#DC2626', margin: '5px 0 0' }}
                    >
                      {errors.modelo}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="imei" style={{ ...labelStyle, marginTop: 0 }}>
                    IMEI / N° de Serie
                  </label>
                  <input
                    {...fieldProps('imei')}
                    className="cw-input"
                    value={imei}
                    onChange={e => setImei(e.target.value)}
                    placeholder="15 dígitos"
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="cw-grid" style={{ marginTop: 10 }}>
                <div>
                  <label htmlFor="color" style={{ ...labelStyle, marginTop: 0 }}>
                    Color
                  </label>
                  <input
                    {...fieldProps('color')}
                    className="cw-input"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    placeholder="Negro"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="estadoFisico" style={{ ...labelStyle, marginTop: 0 }}>
                    Estado físico
                  </label>
                  <select
                    {...fieldProps('estadoFisico')}
                    className="cw-input"
                    value={estadoFisico}
                    onChange={e => setEstadoFisico(e.target.value)}
                  >
                    <option>Excelente</option>
                    <option>Bueno</option>
                    <option>Regular</option>
                    <option>Para Reparación</option>
                  </select>
                </div>
              </div>
            </fieldset>
          )}

          {step === 3 && (
            <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
              <legend style={{ fontSize: 15, fontWeight: 800, color: '#181B2E', marginBottom: 2 }}>
                Precio y forma de pago
              </legend>
              {tipo === 'COMPRA' ? (
                <>
                  <label htmlFor="precioCompra" style={labelStyle}>
                    Precio de compra ($) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    {...fieldProps('precioCompra')}
                    className="cw-input"
                    value={precioCompra}
                    onChange={e => {
                      setPrecioCompra(e.target.value)
                      limpiarError('precioCompra')
                    }}
                    onBlur={() => validarEnBlur('precioCompra')}
                    placeholder="0"
                  />
                  {errors.precioCompra && (
                    <p
                      id="precioCompra-error"
                      style={{ fontSize: 12, color: '#DC2626', margin: '5px 0 0' }}
                    >
                      {errors.precioCompra}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <label htmlFor="precioConsig" style={labelStyle}>
                    Precio acordado consignación ($) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    {...fieldProps('precioConsig')}
                    className="cw-input"
                    value={precioConsig}
                    onChange={e => {
                      setPrecioConsig(e.target.value)
                      limpiarError('precioConsig')
                    }}
                    onBlur={() => validarEnBlur('precioConsig')}
                    placeholder="0"
                  />
                  {errors.precioConsig && (
                    <p
                      id="precioConsig-error"
                      style={{ fontSize: 12, color: '#DC2626', margin: '5px 0 0' }}
                    >
                      {errors.precioConsig}
                    </p>
                  )}
                </>
              )}

              <label htmlFor="formaPago" style={labelStyle}>
                Forma de pago
              </label>
              <select
                {...fieldProps('formaPago')}
                className="cw-input"
                value={formaPago}
                onChange={e => setFormaPago(e.target.value)}
              >
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Mixto</option>
                <option>Pendiente</option>
              </select>
            </fieldset>
          )}

          {step === 4 && (
            <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
              <legend style={{ fontSize: 15, fontWeight: 800, color: '#181B2E', marginBottom: 2 }}>
                ¿Necesita arreglo antes de venderlo?
              </legend>
              <div
                className="cw-radio-grid"
                role="radiogroup"
                aria-label="¿Necesita reparación?"
              >
                {['No', 'Sí'].map(op => (
                  <button
                    key={op}
                    type="button"
                    role="radio"
                    aria-checked={reparacion === op}
                    onClick={() => setReparacion(op)}
                    style={{
                      padding: '13px 10px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 13.5,
                      fontWeight: 700,
                      border: reparacion === op ? '2px solid #FF6B2C' : '1.5px solid #E6E7F0',
                      background: reparacion === op ? '#FFF1E8' : '#FBFBFD',
                      color: reparacion === op ? '#E85A17' : '#64748B',
                      transition: 'border-color .15s, background .15s',
                    }}
                  >
                    {op}
                  </button>
                ))}
              </div>
              {reparacion === 'Sí' && (
                <div className="cw-grid" style={{ marginTop: 14 }}>
                  <div>
                    <label htmlFor="costoRep" style={{ ...labelStyle, marginTop: 0 }}>
                      Costo reparación ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      {...fieldProps('costoRep')}
                      className="cw-input"
                      value={costoRep}
                      onChange={e => setCostoRep(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="precioVenta" style={{ ...labelStyle, marginTop: 0 }}>
                      Precio estimado venta ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      {...fieldProps('precioVenta')}
                      className="cw-input"
                      value={precioVenta}
                      onChange={e => setPrecioVenta(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
              {estadoFisico === 'Para Reparación' && reparacion === 'No' && (
                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#B45309',
                    background: '#FFF8EB',
                    border: '1px solid #FDE9BE',
                    borderRadius: 8,
                    padding: '9px 12px',
                    marginTop: 12,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16 }}
                    aria-hidden="true"
                  >
                    info
                  </span>
                  El equipo fue marcado como “Para Reparación” en el paso 2.
                </p>
              )}
              {reparacion === 'Sí' && (
                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#0369A1',
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    borderRadius: 8,
                    padding: '9px 12px',
                    marginTop: 12,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16 }}
                    aria-hidden="true"
                  >
                    info
                  </span>
                  El equipo entrará a stock con disponibilidad 0 hasta marcarlo como listo en admin/productos.
                </p>
              )}
            </fieldset>
          )}

          {step === 5 && (
            <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
              <legend style={{ fontSize: 15, fontWeight: 800, color: '#181B2E', marginBottom: 2 }}>
                ¿Es para una preventa ya pactada?
              </legend>
              <div
                className="cw-radio-grid"
                role="radiogroup"
                aria-label="¿Es para una preventa?"
              >
                {['No', 'Si'].map(op => (
                  <button
                    key={op}
                    type="button"
                    role="radio"
                    aria-checked={esPreventa === op}
                    onClick={() => setEsPreventa(op)}
                    style={{
                      padding: '13px 10px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 13.5,
                      fontWeight: 700,
                      border: esPreventa === op ? '2px solid #FF6B2C' : '1.5px solid #E6E7F0',
                      background: esPreventa === op ? '#FFF1E8' : '#FBFBFD',
                      color: esPreventa === op ? '#E85A17' : '#64748B',
                      transition: 'border-color .15s, background .15s',
                    }}
                  >
                    {op}
                  </button>
                ))}
              </div>
              {esPreventa === 'Si' && (
                <div
                  style={{
                    background: '#EEF3FE',
                    borderLeft: '4px solid #2563EB',
                    borderRadius: 8,
                    padding: 14,
                    marginTop: 14,
                  }}
                >
                  <label htmlFor="nPre" style={{ ...labelStyle, marginTop: 0 }}>
                    Preventa asociada *
                  </label>
                  <select
                    {...fieldProps('nPre')}
                    className="cw-input"
                    value={nPre}
                    onChange={e => {
                      setNPre(e.target.value)
                      limpiarError('nPre')
                    }}
                    onBlur={() => validarEnBlur('nPre')}
                  >
                    <option value="">Seleccionar...</option>
                    {preventas.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.productModelName || ''} → {p.clientName}
                      </option>
                    ))}
                  </select>
                  {errors.nPre && (
                    <p
                      id="nPre-error"
                      style={{ fontSize: 12, color: '#DC2626', margin: '5px 0 0' }}
                    >
                      {errors.nPre}
                    </p>
                  )}
                </div>
              )}
              {esPreventa === 'Si' && (
                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#0369A1',
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    borderRadius: 8,
                    padding: '9px 12px',
                    marginTop: 12,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16 }}
                    aria-hidden="true"
                  >
                    info
                  </span>
                  El equipo no sumará stock (quedarà reservado). Cobra y entrega en "Entregar preventa".
                </p>
              )}
            </fieldset>
          )}

          {step === 6 && (
            <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
              <legend style={{ fontSize: 15, fontWeight: 800, color: '#181B2E', marginBottom: 2 }}>
                Observaciones y confirmación
              </legend>
              <label htmlFor="obs" style={{ ...labelStyle, marginTop: 12 }}>
                Observaciones
              </label>
              <textarea
                {...fieldProps('obs')}
                className="cw-input"
                style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
                value={obs}
                onChange={e => setObs(e.target.value)}
                placeholder="Detalles adicionales del equipo, acuerdo con el proveedor, etc."
              />

              <dl
                style={{
                  margin: '18px 0 0',
                  background: '#FAFBFD',
                  border: '1px solid #EDF0F6',
                  borderRadius: 10,
                  padding: '6px 16px',
                }}
              >
                {resumen.map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 16,
                      padding: '7px 0',
                      borderBottom: '1px solid #EFF1F6',
                    }}
                  >
                    <dt style={{ fontSize: 12, color: '#6B7280', margin: 0, flexShrink: 0 }}>
                      {k}
                    </dt>
                    <dd
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: '#181B2E',
                        margin: 0,
                        textAlign: 'right',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </fieldset>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            {step > 1 && (
              <button
                type="button"
                className="cw-btn cw-back"
                onClick={() => irAPaso(step - 1)}
                disabled={sending}
                style={{
                  padding: '12px 20px',
                  border: '1.5px solid #E6E7F0',
                  borderRadius: 10,
                  background: '#fff',
                  color: '#3D4356',
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 17 }}
                  aria-hidden="true"
                >
                  arrow_back
                </span>
                Volver
              </button>
            )}
            <button
              type="submit"
              className="cw-btn cw-primary"
              disabled={sending}
              style={{
                flex: 1,
                background: sending ? '#FFB48C' : 'linear-gradient(135deg,#FF6B2C,#FF8A50)',
                color: '#fff',
                padding: 12,
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: sending ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'filter .15s, background .15s',
              }}
            >
              {sending ? (
                <>
                  <span
                    className="material-symbols-outlined cw-spin"
                    style={{ fontSize: 18 }}
                    aria-hidden="true"
                  >
                    progress_activity
                  </span>
                  Registrando…
                </>
              ) : step < TOTAL ? (
                <>
                  Continuar
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 17 }}
                    aria-hidden="true"
                  >
                    arrow_forward
                  </span>
                </>
              ) : (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18 }}
                    aria-hidden="true"
                  >
                    check_circle
                  </span>
                  Registrar compra
                </>
              )}
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', margin: '12px 0 0' }}>
            Podés volver a los pasos anteriores con el menú superior para corregir cualquier dato.
          </p>
        </form>
      </div>
    </>
  )
}
