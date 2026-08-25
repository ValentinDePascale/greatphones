'use client'

import { useEffect, useMemo, useState } from 'react'
import { fmtARS } from '@/lib/precios'

const OPERADORES = ['Martin', 'Maca', 'Sam', 'Eva', 'Buda']
const inputStyle = { width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }
const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3D4356', marginTop: 12 }
const pasoStyle = (n: number) => ({ marginTop: 22, borderTop: '1px solid #EEF0F6', paddingTop: 16 })

const TRABAJOS = [
  { key: 'bateria', label: 'Batería' }, { key: 'pantalla', label: 'Pantalla' }, { key: 'camara', label: 'Cámara' },
  { key: 'microfono', label: 'Micrófono' }, { key: 'parlante', label: 'Parlante' }, { key: 'tapa', label: 'Tapa trasera' },
  { key: 'marco', label: 'Marco' }, { key: 'pin', label: 'Pin de carga' }, { key: 'flex', label: 'Flex de carga' },
  { key: 'botones', label: 'Botones laterales' }, { key: 'chasis', label: 'Chasis' },
]

interface Presu {
  trabajos: Array<{ nombre: string; precio: number | null; sinConfigurar?: boolean; motivo?: string }>
  precioTotal: number
  horasEstimadas: number
  estado: string
}

export default function ReparacionClient() {
  const [operador, setOperador] = useState('')
  const [tipo, setTipo] = useState('Particular')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [cliente, setCliente] = useState('')
  const [tel, setTel] = useState('')
  const [equipo, setEquipo] = useState('')
  const [imei, setImei] = useState('')
  const [pin, setPin] = useState('')
  const [falla1, setFalla1] = useState('')
  const [falla2, setFallad2] = useState('')
  const [esDiagnostico, setEsDiagnostico] = useState(false)
  const [marcados, setMarcados] = useState<Record<string, boolean>>({})
  const [modelos, setModelos] = useState<string[]>([])
  const [presu, setPresu] = useState<Presu | null>(null)
  const [precioCob, setPrecioCob] = useState(0)
  const [efec, setEfec] = useState(0)
  const [transf, setTransf] = useState(0)
  const [obs, setObs] = useState('')
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)

  const toast = (t: string, s: string) => { setMsg({ t, s }); setTimeout(() => setMsg(null), 5000) }

  // Cargar modelos de Toma de Equipos (para el selector de presupuesto)
  useEffect(() => {
    fetch('/api/admin/precios/toma', { credentials: 'include' }).then(r => r.json()).then(d => setModelos(Array.isArray(d) ? d.map((x: any) => x.modelo) : [])).catch(() => {})
  }, [])

  const cualquierTrabajo = TRABAJOS.some(t => marcados[t.key])
  const puedeCalcular = !esDiagnostico && equipo && cualquierTrabajo

  const recalcular = async () => {
    if (esDiagnostico) {
      setPresu({ trabajos: [], precioTotal: 0, horasEstimadas: 48, estado: 'DIAGNOSTICO' })
      return
    }
    if (!equipo || !cualquierTrabajo) { setPresu(null); return }
    try {
      const r = await fetch('/api/admin/taller', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modelo: equipo, trabajos: marcados }) })
      const d = await r.json()
      if (!r.ok) return toast('error', d.error || 'Error')
      setPresu(d)
      setPrecioCob(d.precioTotal || 0)
    } catch { toast('error', 'Error al calcular presupuesto') }
  }

  useEffect(() => { recalcular() }, [esDiagnostico, equipo, marcados])

  const textoPresupuesto = useMemo(() => {
    if (!presu) return ''
    const lineas = ['🔧 GreatPhones Service', '', 'Equipo:', equipo || '—', '', 'Trabajos:', '']
    if (presu.estado === 'DIAGNOSTICO') lineas.push('✓ Diagnóstico técnico')
    else presu.trabajos.forEach(t => lineas.push('✓ ' + t.nombre))
    lineas.push('', 'Precio estimado:', '')
    lineas.push(presu.estado === 'DIAGNOSTICO' ? 'A confirmar' : fmtARS(presu.precioTotal))
    lineas.push('', 'Tiempo estimado:', '', repDias(presu.horasEstimadas), '', 'Garantía:', '90 días')
    return lineas.join('\n')
  }, [presu, equipo])

  function repDias(horas: number) {
    const dias = Math.round((horas || 0) / 24) || 1
    return dias + (dias === 1 ? ' día hábil' : ' días hábiles')
  }

  const enviar = async () => {
    if (!operador) return toast('error', 'Seleccioná el operador')
    if (!cliente.trim()) return toast('error', 'Ingresá el nombre del cliente')
    if (!equipo.trim()) return toast('error', 'Ingresá el equipo')
    if (!falla1.trim()) return toast('error', 'Describí la falla principal')

    const trabajos = esDiagnostico ? ['Diagnóstico'] : (presu ? presu.trabajos.map(t => t.nombre) : [])
    const payload = {
      tipo, fecha, cliente: cliente.trim(), tel: tel.trim(), equipo: equipo.trim(),
      imei: imei.trim(), pin: pin.trim(), falla1: falla1.trim(), falla2: falla2.trim(),
      esDiagnostico, trabajos,
      precioCalculado: presu ? presu.precioTotal : 0,
      detallePresupuesto: presu ? presu.trabajos.map(t => `${t.nombre}: ${t.precio != null ? fmtARS(t.precio) : (t.motivo || 'sin configurar')}`).join(' | ') : '',
      tiempoEstimadoHoras: presu ? presu.horasEstimadas : 0,
      precioCob: Number(precioCob) || 0, efec: Number(efec) || 0, transf: Number(transf) || 0,
      obs: obs.trim(), operador,
    }
    try {
      const r = await fetch('/api/admin/taller/reparaciones', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const d = await r.json()
      if (!r.ok) return toast('error', d.error || 'Error')
      toast('success', `Reparación registrada — ${d.numero}`)
      setCliente(''); setTel(''); setEquipo(''); setImei(''); setPin(''); setFalla1(''); setFallad2('')
      setPrecioCob(0); setEfec(0); setTransf(0); setObs(''); setMarcados({}); setPresu(null); setEsDiagnostico(false)
    } catch { toast('error', 'Error al registrar') }
  }

  const copiarTexto = (t: string) => {
    navigator.clipboard?.writeText(t).then(() => toast('success', 'Copiado')).catch(() => {})
  }

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0 }}>🔧 Registrar Reparación</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Ingreso de reparación o diagnóstico con presupuesto automático</p>

      {msg && <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, color: '#fff', fontWeight: 600, fontSize: 13, background: msg.t === 'success' ? '#0F9D58' : '#DC2626' }}>{msg.s}</div>}

      <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)' }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>1 · ¿Quién y qué tipo de reparación?</div>
        <label style={labelStyle}>Operador: *</label>
        <select style={inputStyle} value={operador} onChange={e => setOperador(e.target.value)}>
          <option value="" disabled>Seleccionar...</option>
          {OPERADORES.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <div><label style={{ ...labelStyle, marginTop: 0 }}>Tipo:</label>
            <select style={inputStyle} value={tipo} onChange={e => setTipo(e.target.value)}>
              {['Particular', 'Garantía', 'Preventa', 'Interno'].map(t => <option key={t}>{t}</option>)}
            </select></div>
          <div><label style={{ ...labelStyle, marginTop: 0 }}>Fecha:</label>
            <input type="date" style={inputStyle} value={fecha} onChange={e => setFecha(e.target.value)} /></div>
        </div>

        <div style={pasoStyle(2)}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>2 · Datos del cliente</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <div><label style={{ ...labelStyle, marginTop: 0 }}>Cliente: *</label>
              <input style={inputStyle} value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nombre y apellido" /></div>
            <div><label style={{ ...labelStyle, marginTop: 0 }}>Teléfono:</label>
              <input style={inputStyle} value={tel} onChange={e => setTel(e.target.value)} placeholder="Ej: 2914123456" /></div>
          </div>
        </div>

        <div style={pasoStyle(3)}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>3 · Equipo</div>
          <label style={labelStyle}>Modelo para presupuesto (Toma de Equipos):</label>
          <input list="modelos-toma" style={inputStyle} value={equipo} onChange={e => setEquipo(e.target.value)} placeholder="🔎 Buscar modelo..." />
          <datalist id="modelos-toma">{modelos.map(m => <option key={m} value={m} />)}</datalist>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <div><label style={{ ...labelStyle, marginTop: 0 }}>IMEI (opcional):</label>
              <input style={inputStyle} value={imei} onChange={e => setImei(e.target.value)} placeholder="15 dígitos" /></div>
            <div><label style={{ ...labelStyle, marginTop: 0 }}>PIN (opcional):</label>
              <input style={inputStyle} value={pin} onChange={e => setPin(e.target.value)} placeholder="Ej: 1234" /></div>
          </div>
        </div>

        <div style={pasoStyle(4)}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>4 · Falla</div>
          <label style={labelStyle}>Falla principal: *</label>
          <input style={inputStyle} value={falla1} onChange={e => setFalla1(e.target.value)} placeholder="Describe la falla reportada" />
          <label style={labelStyle}>Falla 2 (opcional):</label>
          <input style={inputStyle} value={falla2} onChange={e => setFallad2(e.target.value)} placeholder="Falla adicional detectada" />
        </div>

        <div style={pasoStyle(5)}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>5 · Presupuesto automático</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 8, opacity: esDiagnostico ? 0.5 : 1 }}>
            {TRABAJOS.map(t => (
              <label key={t.key} style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                <input type="checkbox" disabled={esDiagnostico} checked={!!marcados[t.key]} onChange={e => setMarcados({ ...marcados, [t.key]: e.target.checked })} /> {t.label}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 12, padding: '8px 10px', background: '#F4F6F9', borderRadius: 6 }}>
            <b style={{ fontSize: 12.5 }}>Tipo de ingreso:</b>
            {([['reparacion', '○ Reparación'], ['diagnostico', '○ Diagnóstico']] as const).map(([v, lab]) => (
              <label key={v} style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                <input type="radio" checked={(v === 'diagnostico') === esDiagnostico} onChange={() => setEsDiagnostico(v === 'diagnostico')} /> {lab}
              </label>
            ))}
          </div>

          {presu && (
            <div style={{ marginTop: 12 }}>
              {presu.estado === 'DIAGNOSTICO' ? (
                <div style={{ background: '#FEF9E7', borderRadius: 10, padding: 12 }}>
                  <div><b>Precio:</b> A confirmar</div>
                  <div><b>Tiempo:</b> {repDias(48)}</div>
                  <div><b>Estado:</b> DIAGNÓSTICO</div>
                </div>
              ) : (
                <div style={{ background: '#F4F6F9', borderRadius: 10, padding: 12 }}>
                  <b>TRABAJOS</b>
                  {presu.trabajos.map((t, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 13 }}>
                      <span>✓ {t.nombre}</span>
                      <b style={{ color: t.precio != null ? '#181B2E' : '#B7950B' }}>{t.precio != null ? fmtARS(t.precio) : (t.motivo || 'sin configurar')}</b>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px dashed #D1D5DB', margin: '8px 0' }} />
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1E8449' }}>TOTAL: {fmtARS(presu.precioTotal)}</div>
                  <div style={{ fontSize: 12, color: '#667', marginTop: 2 }}>Tiempo estimado: {repDias(presu.horasEstimadas)}</div>
                </div>
              )}
              <div style={{ background: '#0B5345', color: '#fff', borderRadius: 8, padding: 10, marginTop: 10, fontSize: 12.5, whiteSpace: 'pre-wrap' }}>{textoPresupuesto}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => copiarTexto(textoPresupuesto)} style={{ padding: '8px 14px', background: '#5D6D7E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12.5, cursor: 'pointer' }}>📋 Copiar</button>
              </div>
            </div>
          )}
        </div>

        <div style={pasoStyle(6)}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>6 · Cobro</div>
          <label style={labelStyle}>Precio cobrado ($):</label>
          <input type="number" min={0} style={inputStyle} value={precioCob} onChange={e => setPrecioCob(Number(e.target.value))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <div><label style={{ ...labelStyle, marginTop: 0 }}>Cobrado efectivo ($):</label>
              <input type="number" min={0} style={inputStyle} value={efec} onChange={e => setEfec(Number(e.target.value))} /></div>
            <div><label style={{ ...labelStyle, marginTop: 0 }}>Cobrado transferencia ($):</label>
              <input type="number" min={0} style={inputStyle} value={transf} onChange={e => setTransf(Number(e.target.value))} /></div>
          </div>
        </div>

        <label style={labelStyle}>Observaciones:</label>
        <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={obs} onChange={e => setObs(e.target.value)} />

        <button onClick={enviar} style={{ width: '100%', marginTop: 20, background: 'linear-gradient(135deg,#4F46E5,#6366F1)', color: '#fff', padding: 12, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>✅ Registrar</button>
      </div>
    </div>
  )
}
