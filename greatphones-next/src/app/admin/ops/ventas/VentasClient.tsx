'use client'

import { useCallback, useEffect, useState } from 'react'

interface Equipo { id: string; code: string; imei: string; modelName: string; brand: string; color: string | null; storage: string | null; targetPrice: number | null }

const OPERADORES = ['Martin', 'Maca', 'Sam', 'Eva', 'Buda']
function fmt(n: number) { return '$' + (n || 0).toLocaleString('es-AR') }
const inputStyle = { width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }
const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3D4356', marginTop: 12 }

export default function VentasClient() {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [opEquipo, setOpEquipo] = useState('')
  const [operador, setOperador] = useState('')
  const [vendedor, setVendedor] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [cliente, setCliente] = useState('')
  const [cuil, setCuil] = useState('')
  const [tel, setTel] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [efec, setEfec] = useState('')
  const [transf, setTransf] = useState('')
  const [cuotas, setCuotas] = useState('')
  const [usd, setUsd] = useState('')
  const [accesorios, setAccesorios] = useState([{ nombre: '', precio: '' }, { nombre: '', precio: '' }, { nombre: '', precio: '' }])
  const [regalos, setRegalos] = useState(true)
  const [obs, setObs] = useState('')
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)

  const load = useCallback(async () => {
    try { const r = await fetch('/api/admin/ops/ventas', { credentials: 'include' }); const d = await r.json(); setEquipos(Array.isArray(d) ? d : []) } catch {}
  }, [])
  useEffect(() => { load() }, [load])

  const toast = (t: string, s: string) => { setMsg({ t, s }); setTimeout(() => setMsg(null), 5000) }

  const totalAcc = accesorios.reduce((s, a) => s + (parseInt(a.precio) || 0), 0)
  const precio = parseInt(precioVenta) || 0
  const totalOperacion = precio + totalAcc
  const usdPesos = Math.round((parseInt(usd) || 0) * 1000)
  const totalCobrado = (parseInt(efec) || 0) + (parseInt(transf) || 0) + (parseInt(cuotas) || 0) + usdPesos

  const enviar = async () => {
    if (!operador) return toast('error', 'Seleccioná el operador')
    if (!opEquipo) return toast('error', 'No hay equipos en stock disponibles')
    if (precio <= 0) return toast('error', 'El precio de venta debe ser > 0')
    if (!cliente.trim()) return toast('error', 'Ingresá el nombre del cliente')
    if (Math.abs(totalCobrado - totalOperacion) > 1) return toast('error', `El total cobrado (${fmt(totalCobrado)}) debe coincidir con el TOTAL OPERACIÓN (${fmt(totalOperacion)})`)

    const r = await fetch('/api/admin/ops/ventas', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inventoryItemId: opEquipo, fecha, precioVenta: precio, cliente, cuil, tel, vendedor, efectivo: parseInt(efec) || 0, transferencia: parseInt(transf) || 0, cuotas: parseInt(cuotas) || 0, usd: parseInt(usd) || 0, accesorios: accesorios.filter(a => a.nombre).map(a => ({ nombre: a.nombre, precio: parseInt(a.precio) || 0 })), entregarRegalos: regalos, obs, operador }) })
    const d = await r.json()
    if (!r.ok) return toast('error', d.error || 'Error')
    toast('success', `Venta registrada — ${d.numero}\nGanancia: ${fmt(d.gananciaTeorica)}`)
    setOpEquipo(''); setPrecioVenta(''); setCliente(''); setCuil(''); setTel(''); setEfec(''); setTransf(''); setCuotas(''); setUsd(''); setObs(''); setAccesorios([{ nombre: '', precio: '' }, { nombre: '', precio: '' }, { nombre: '', precio: '' }])
    load()
  }

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0 }}>💰 Registrar Venta</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Venta de equipo desde stock</p>

      {msg && <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, color: '#fff', fontWeight: 600, fontSize: 13, background: msg.t === 'success' ? '#0F9D58' : '#DC2626' }}>{msg.s}</div>}

      <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#181B2E', marginTop: 0 }}>1 · ¿Quién vende y qué equipo?</div>
        <label style={labelStyle}>Operador: *</label>
        <select style={inputStyle} value={operador} onChange={e => setOperador(e.target.value)}>
          <option value="" disabled>Seleccionar...</option>
          {OPERADORES.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <label style={labelStyle}>Vendedor:</label>
        <input style={inputStyle} value={vendedor} onChange={e => setVendedor(e.target.value)} placeholder="Quién atendió (si no es el operador)" />
        <label style={labelStyle}>Equipo a vender (de stock): *</label>
        <select style={inputStyle} value={opEquipo} onChange={e => { setOpEquipo(e.target.value); const eq = equipos.find(x => x.id === e.target.value); if (eq?.targetPrice) setPrecioVenta(String(eq.targetPrice)) }}>
          <option value="">Seleccionar equipo...</option>
          {equipos.map(e => <option key={e.id} value={e.id}>{e.code} — {e.brand} {e.modelName}{e.storage ? ' ' + e.storage : ''} {e.color ? '(' + e.color + ')' : ''}</option>)}
        </select>
        <label style={labelStyle}>Fecha venta:</label>
        <input type="date" style={inputStyle} value={fecha} onChange={e => setFecha(e.target.value)} />

        <div style={{ fontSize: 13, fontWeight: 700, color: '#181B2E', marginTop: 20 }}>2 · Datos del cliente</div>
        <label style={labelStyle}>Cliente: *</label>
        <input style={inputStyle} value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nombre y apellido" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <div><label style={{ ...labelStyle, marginTop: 0 }}>CUIL (opcional):</label><input style={inputStyle} value={cuil} onChange={e => setCuil(e.target.value)} /></div>
          <div><label style={{ ...labelStyle, marginTop: 0 }}>Teléfono:</label><input style={inputStyle} value={tel} onChange={e => setTel(e.target.value)} /></div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#181B2E', marginTop: 20 }}>3 · Precio y cobro</div>
        <label style={labelStyle}>Precio del Celular ($): *</label>
        <input type="number" style={inputStyle} value={precioVenta} onChange={e => setPrecioVenta(e.target.value)} />
        <div style={{ background: '#FEF9E7', padding: '12px 14px', borderRadius: 10, marginTop: 10, fontWeight: 700, color: '#7D6608' }}>TOTAL OPERACIÓN: {fmt(totalOperacion)}</div>
        <label style={labelStyle}>Cobrado en ($):</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[['Efectivo', efec, setEfec], ['Transferencia', transf, setTransf], ['Cuotas', cuotas, setCuotas], ['USD', usd, setUsd]].map(([lab, val, set], i) => (
            <div key={i}><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#3D4356' }}>{lab as string}</label>
              <input type="number" style={{ ...inputStyle, padding: 8 }} value={val as string} onChange={e => (set as any)(e.target.value)} /></div>
          ))}
        </div>
        <div style={{ background: '#D5F5E3', padding: '12px 14px', borderRadius: 10, marginTop: 10, fontWeight: 700 }}>Total cobrado: {fmt(totalCobrado)}{parseInt(usd) ? ` (incluye ${usd} USD)` : ''}</div>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#181B2E', marginTop: 20 }}>4 · Accesorios y regalo (opcional)</div>
        {accesorios.map((a, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginTop: 6 }}>
            <input style={inputStyle} value={a.nombre} onChange={e => { const n = [...accesorios]; n[i].nombre = e.target.value; setAccesorios(n) }} placeholder={`Accesorio ${i + 1}`} />
            <input type="number" style={{ ...inputStyle, padding: 8 }} value={a.precio} onChange={e => { const n = [...accesorios]; n[i].precio = e.target.value; setAccesorios(n) }} />
          </div>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13, color: '#3D4356' }}>
          <input type="checkbox" checked={regalos} onChange={e => setRegalos(e.target.checked)} style={{ width: 'auto' }} /> Entregar regalos de bienvenida
        </label>
        <label style={labelStyle}>Observaciones:</label>
        <input style={inputStyle} value={obs} onChange={e => setObs(e.target.value)} />

        <button onClick={enviar} style={{ width: '100%', marginTop: 20, background: 'linear-gradient(135deg,#0B5345,#148F77)', color: '#fff', padding: 12, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>✅ Confirmar venta</button>
      </div>
    </div>
  )
}