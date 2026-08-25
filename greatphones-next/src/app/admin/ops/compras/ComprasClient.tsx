'use client'

import { useCallback, useEffect, useState } from 'react'

const OPERADORES = ['Martin', 'Maca', 'Sam', 'Eva', 'Buda']
function fmt(n: number) { return '$' + (n || 0).toLocaleString('es-AR') }
const inputStyle = { width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }
const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3D4356', marginTop: 12 }
const pasoStyle = (n: number) => ({ background: '#FCFCFE', border: '1px solid #E6E7F0', borderRadius: 10, padding: '17px 19px', marginTop: 16 })

function PasoNum({ n }: { n: number }) {
  return <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#4F46E5,#6366F1)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, marginRight: 10 }}>{n}</span>
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
  const [preventas, setPreventas] = useState<{ id: string; code: string; clientName: string; productModelName: string | null }[]>([])
  const [nPre, setNPre] = useState('')
  const [obs, setObs] = useState('')
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)

  useEffect(() => { loadPreventas() }, [])
  const loadPreventas = useCallback(async () => {
    try { const r = await fetch('/api/admin/ops/compras', { credentials: 'include' }); const d = await r.json(); setPreventas(Array.isArray(d) ? d : []) } catch {}
  }, [])

  const toast = (t: string, s: string) => { setMsg({ t, s }); setTimeout(() => setMsg(null), 5000) }

  const enviar = async () => {
    if (!operador) return toast('error', 'Seleccioná el operador')
    if (!modelo.trim()) return toast('error', 'Ingresá el modelo del equipo')
    if (tipo === 'COMPRA' && (!precioCompra || +precioCompra <= 0)) return toast('error', 'Para COMPRA, el precio de compra debe ser > 0')
    if (tipo === 'CONSIGNACION' && (!precioConsig || +precioConsig <= 0)) return toast('error', 'Para CONSIGNACION, el precio acordado debe ser > 0')
    if (esPreventa === 'Si' && !nPre) return toast('error', 'Seleccioná la preventa a vincular')

    const r = await fetch('/api/admin/ops/compras', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo, fecha, proveedor, cuil, modelo, imei, color, estadoFisico, precioCompra: +precioCompra || 0, precioConsig: +precioConsig || 0, formaPago, reparacion, costoRep: +costoRep || 0, precioVenta: +precioVenta || 0, esPreventa, nPreAsociada: esPreventa === 'Si' ? nPre : '', operador, obs }) })
    const d = await r.json()
    if (!r.ok) return toast('error', d.error || 'Error')
    toast('success', `Compra registrada — ${d.numero} (${d.estado})`)
    setModelo(''); setImei(''); setProveedor(''); setCuil(''); setColor(''); setPrecioCompra(''); setPrecioConsig(''); setCostoRep(''); setPrecioVenta(''); setObs(''); setEsPreventa('No')
  }

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0 }}>🛒 Registrar Compra</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Compra de equipos o consignación para el local</p>

      {msg && <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, color: '#fff', fontWeight: 600, fontSize: 13, background: msg.t === 'success' ? '#0F9D58' : '#DC2626' }}>{msg.s}</div>}

      <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)' }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}><PasoNum n={1} />¿Quién carga esto y qué tipo de ingreso es?</div>
              <label style={labelStyle}>Operador: *</label>
              <select style={inputStyle} value={operador} onChange={e => setOperador(e.target.value)}>
                <option value="" disabled>Seleccionar...</option>
                {OPERADORES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <label style={labelStyle}>Tipo de ingreso: *</label>
              <select style={inputStyle} value={tipo} onChange={e => setTipo(e.target.value)}>
                <option value="COMPRA">COMPRA — equipo propio</option>
                <option value="CONSIGNACION">CONSIGNACION — equipo de tercero</option>
              </select>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>COMPRA: el equipo pasa a ser tuyo. CONSIGNACIÓN: sigue de tercero hasta venderlo.</div>
              <label style={labelStyle}>Fecha:</label>
              <input type="date" style={inputStyle} value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>

            <div style={pasoStyle(2)}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}><PasoNum n={2} />Datos del equipo</div>
              <label style={labelStyle}>Proveedor / Origen:</label>
              <input style={inputStyle} value={proveedor} onChange={e => setProveedor(e.target.value)} placeholder="Ej: Juan Pérez, Particular" />
              <label style={labelStyle}>CUIL/CUIT proveedor (opcional):</label>
              <input style={inputStyle} value={cuil} onChange={e => setCuil(e.target.value)} placeholder="Ej: 20-12345678-9" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                <div><label style={{ ...labelStyle, marginTop: 0 }}>Equipo / Modelo: *</label>
                  <input style={inputStyle} value={modelo} onChange={e => setModelo(e.target.value)} placeholder="iPhone 14" /></div>
                <div><label style={{ ...labelStyle, marginTop: 0 }}>IMEI / N° de Serie:</label>
                  <input style={inputStyle} value={imei} onChange={e => setImei(e.target.value)} placeholder="15 dígitos" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                <div><label style={{ ...labelStyle, marginTop: 0 }}>Color:</label>
                  <input style={inputStyle} value={color} onChange={e => setColor(e.target.value)} placeholder="Negro" /></div>
                <div><label style={{ ...labelStyle, marginTop: 0 }}>Estado físico:</label>
                  <select style={inputStyle} value={estadoFisico} onChange={e => setEstadoFisico(e.target.value)}>
                    <option>Excelente</option><option>Bueno</option><option>Regular</option><option>Para Reparación</option>
                  </select></div>
              </div>
            </div>

            <div style={pasoStyle(3)}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}><PasoNum n={3} />Precio y forma de pago</div>
              {tipo === 'COMPRA' ? (
                <>
                  <label style={labelStyle}>Precio de compra ($): *</label>
                  <input type="number" style={inputStyle} value={precioCompra} onChange={e => setPrecioCompra(e.target.value)} />
                </>
              ) : (
                <>
                  <label style={labelStyle}>Precio acordado consignación ($): *</label>
                  <input type="number" style={inputStyle} value={precioConsig} onChange={e => setPrecioConsig(e.target.value)} />
                </>
              )}
              <label style={labelStyle}>Forma de pago:</label>
              <select style={inputStyle} value={formaPago} onChange={e => setFormaPago(e.target.value)}>
                <option>Efectivo</option><option>Transferencia</option><option>Mixto</option><option>Pendiente</option>
              </select>
            </div>

            <div style={{ ...pasoStyle(4), opacity: reparacion === 'No' ? 0.5 : 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}><PasoNum n={4} />¿Necesita arreglo antes de venderlo?</div>
              <select style={inputStyle} value={reparacion} onChange={e => setReparacion(e.target.value)}><option>No</option><option>Sí</option></select>
              {reparacion === 'Sí' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                  <div><label style={{ ...labelStyle, marginTop: 0 }}>Costo reparación ($)</label><input type="number" style={inputStyle} value={costoRep} onChange={e => setCostoRep(e.target.value)} /></div>
                  <div><label style={{ ...labelStyle, marginTop: 0 }}>Precio estimado venta ($)</label><input type="number" style={inputStyle} value={precioVenta} onChange={e => setPrecioVenta(e.target.value)} /></div>
                </div>
              )}
            </div>

            <div style={pasoStyle(5)}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}><PasoNum n={5} />¿Es para una preventa ya pactada?</div>
              <select style={inputStyle} value={esPreventa} onChange={e => setEsPreventa(e.target.value)}><option>No</option><option>Si</option></select>
              {esPreventa === 'Si' && (
                <div style={{ background: '#EEF3FE', borderLeft: '4px solid #2563EB', borderRadius: 8, padding: 12, marginTop: 10 }}>
                  <label style={{ ...labelStyle, marginTop: 0 }}>Preventa asociada:</label>
                  <select style={inputStyle} value={nPre} onChange={e => setNPre(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {preventas.map(p => <option key={p.id} value={p.id}>{p.code} — {p.productModelName || ''} → {p.clientName}</option>)}
                  </select>
                </div>
              )}
            </div>

            <label style={labelStyle}>Observaciones:</label>
            <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={obs} onChange={e => setObs(e.target.value)} />

        <button onClick={enviar} style={{ width: '100%', marginTop: 20, background: 'linear-gradient(135deg,#4F46E5,#6366F1)', color: '#fff', padding: 12, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          ✅ Registrar compra
        </button>
      </div>
  )
}