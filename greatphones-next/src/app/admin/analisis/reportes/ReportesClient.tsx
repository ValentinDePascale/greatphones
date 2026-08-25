'use client'

import { useEffect, useMemo, useState } from 'react'

const inputStyle = { padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }

function fmtP(n: number) { return '$' + (n || 0).toLocaleString('es-AR') }
function fmtUSD(n: number) { return 'US$' + (n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }) }

interface Entry { id: string; source: string; operationId: string | null; description: string; category: string | null; type: string; means: string; amount: number; amountUsd?: number | null; opDate: string; operator: string | null }
interface Balance { means: string; balance: number; balanceUsd?: number | null }

const MEAN_LABEL: Record<string, string> = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', CUOTAS: 'Cuotas', USD: 'USD', PAGO_ONLINE: 'Online' }
const CANAL: Record<string, 'online' | 'local' | 'otro'> = {
  ONLINE: 'online', PREORDER: 'online', SALE: 'local', REPAIR: 'local', PURCHASE: 'local',
}

export default function ReportesClient() {
  const [balances, setBalances] = useState<Balance[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [resumen, setResumen] = useState<Array<{ source: string; ingresos: number; egresos: number; cantidad: number }>>([])
  const [canales, setCanales] = useState<any>(null)
  const [pedidosOnline, setPedidosOnline] = useState<any>({ total: 0, cantidad: 0, items: [] })
  const [dolar, setDolar] = useState(0)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [filtroCanal, setFiltroCanal] = useState<'todos' | 'online' | 'local'>('todos')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [buscar, setBuscar] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    const params = new URLSearchParams()
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    const q = params.toString()
    try {
      const [r, rd] = await Promise.all([
        fetch('/api/admin/analisis/reportes' + (q ? '?' + q : ''), { credentials: 'include' }),
        fetch('/api/admin/precios/dolar?tipo=blue', { credentials: 'include' }),
      ])
      const d = await r.json()
      setBalances(d.balances || [])
      setEntries(d.entries || [])
      setResumen(d.resumen || [])
      setCanales(d.canales)
      setPedidosOnline(d.pedidosOnline || { total: 0, cantidad: 0, items: [] })
      const dt = await rd.json()
      if (dt && dt.venta) setDolar(dt.venta)
    } catch { /* silencioso */ }
  }

  const filtrados = useMemo(() => {
    return entries.filter(e => {
      if (filtroCanal === 'online' && CANAL[e.source] !== 'online') return false
      if (filtroCanal === 'local' && CANAL[e.source] !== 'local') return false
      if (filtroCanal === 'todos' && filtroTipo === 'EGRESO' && e.type !== 'EGRESO') return false
      if (filtroCanal === 'todos' && filtroTipo === 'INGRESO' && e.type !== 'INGRESO') return false
      if (buscar && !(e.operationId || '').toLowerCase().includes(buscar.toLowerCase()) && !e.description.toLowerCase().includes(buscar.toLowerCase())) return false
      return true
    })
  }, [entries, filtroCanal, filtroTipo, buscar])

  const totalIngresos = filtrados.filter(e => e.type === 'INGRESO').reduce((s, e) => s + e.amount, 0)
  const totalEgresos = filtrados.filter(e => e.type === 'EGRESO').reduce((s, e) => s + e.amount, 0)

  const bal = balances.reduce((acc: any, b) => { acc[b.means] = b; return acc }, {})
  const usdPesos = Math.round((bal.USD?.balanceUsd || 0) * dolar)

  const canalCard = (label: string, value: number, cantidad: number, accent: string) => (
    <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 12, padding: 14, borderTop: `3px solid ${accent}` }}>
      <b style={{ fontSize: 12.5 }}>{label}</b><br />
      <span style={{ fontSize: 18, fontWeight: 700 }}>{fmtP(value)}</span>
      <div style={{ fontSize: 11.5, color: '#667', marginTop: 2 }}>{cantidad} movimientos</div>
    </div>
  )

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0 }}>📈 Reportes</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Todos los ingresos del sistema — online y local</p>

      <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap', marginTop: 12 }}>
        <div><label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3D4356' }}>Desde</label>
          <input type="date" style={inputStyle} value={desde} onChange={e => setDesde(e.target.value)} /></div>
        <div><label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3D4356' }}>Hasta</label>
          <input type="date" style={inputStyle} value={hasta} onChange={e => setHasta(e.target.value)} /></div>
        <button onClick={load} style={{ padding: '10px 18px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Filtrar</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginTop: 16 }}>
        {canales && canalCard('💻 Ingresos Online', canales.online.total, canales.online.cantidad, '#7C3AED')}
        {canales && canalCard('🏪 Ingresos Local', canales.local.total, canales.local.cantidad, '#0F766E')}
        {canales && canalCard('💸 Egresos', canales.egresos.total, canales.egresos.cantidad, '#DC2626')}
        {canales && canalCard('🔁 Otros ingresos', canales.otros.total, canales.otros.cantidad, '#B7950B')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginTop: 12 }}>
        <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 12, padding: 14 }}>
          <b style={{ fontSize: 12.5 }}>💵 Efectivo</b><br /><span style={{ fontSize: 17, fontWeight: 700 }}>{fmtP(bal.EFECTIVO?.balance || 0)}</span>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 12, padding: 14 }}>
          <b style={{ fontSize: 12.5 }}>🏦 Transferencia</b><br /><span style={{ fontSize: 17, fontWeight: 700 }}>{fmtP(bal.TRANSFERENCIA?.balance || 0)}</span>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 12, padding: 14 }}>
          <b style={{ fontSize: 12.5 }}>💵 USD</b><br /><span style={{ fontSize: 17, fontWeight: 700 }}>{fmtUSD(bal.USD?.balanceUsd || 0)}</span>
          <div style={{ fontSize: 11, color: '#667' }}>≈ {fmtP(usdPesos)} {dolar ? `a ${fmtP(dolar)}` : ''}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 12, padding: 14 }}>
          <b style={{ fontSize: 12.5 }}>💳 Cuotas</b><br /><span style={{ fontSize: 17, fontWeight: 700 }}>{fmtP(bal.CUOTAS?.balance || 0)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginTop: 18 }}>
        {resumen.map(r => (
          <div key={r.source || 'OTRO'} style={{ background: '#F8FAFC', border: '1px solid #E6E7F0', borderRadius: 10, padding: 10 }}>
            <b style={{ fontSize: 12 }}>{r.source || 'OTRO'}</b>
            <div style={{ fontSize: 12, color: '#0F766E', fontWeight: 600 }}>Ingresos: {fmtP(r.ingresos)}</div>
            <div style={{ fontSize: 12, color: '#DC2626' }}>Egresos: {fmtP(r.egresos)}</div>
            <div style={{ fontSize: 11, color: '#889' }}>{r.cantidad} movs</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, padding: 24, marginTop: 20, boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)' }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>📒 Libro Diario</h3>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <select style={inputStyle} value={filtroCanal} onChange={e => setFiltroCanal(e.target.value as any)}>
            <option value="todos">Todos los canales</option>
            <option value="online">Solo online</option>
            <option value="local">Solo local</option>
          </select>
          <select style={inputStyle} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="INGRESO">Ingresos</option>
            <option value="EGRESO">Egresos</option>
          </select>
          <input style={{ ...inputStyle, flex: 1, minWidth: 220 }} placeholder="🔎 Buscar N° operación o descripción..." value={buscar} onChange={e => setBuscar(e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
          <div style={{ background: '#EAFAF1', borderRadius: 8, padding: 10 }}><b style={{ fontSize: 12 }}>Ingresos</b><br />{fmtP(totalIngresos)}</div>
          <div style={{ background: '#F9EBEA', borderRadius: 8, padding: 10 }}><b style={{ fontSize: 12 }}>Egresos</b><br />{fmtP(totalEgresos)}</div>
          <div style={{ background: '#F4F6F9', borderRadius: 8, padding: 10 }}><b style={{ fontSize: 12 }}>Saldo neto</b><br />{fmtP(totalIngresos - totalEgresos)}</div>
          <div style={{ background: '#F4F6F9', borderRadius: 8, padding: 10 }}><b style={{ fontSize: 12 }}>Movimientos</b><br />{filtrados.length}</div>
        </div>

        {pedidosOnline.cantidad > 0 && (
          <div style={{ marginTop: 14, background: '#FAF5FF', border: '1px solid #EDE9FE', borderRadius: 10, padding: 12, fontSize: 13 }}>
            <b>🛒 Pedidos online pagados:</b> {pedidosOnline.cantidad} · Total {fmtP(pedidosOnline.total)}
          </div>
        )}

        <div style={{ overflowX: 'auto', marginTop: 14, border: '1px solid #E6E7F0', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#F4F6F9', textAlign: 'left' }}>
                <th style={{ padding: 8 }}>Fecha</th><th style={{ padding: 8 }}>Canal</th><th style={{ padding: 8 }}>N° Operación</th>
                <th style={{ padding: 8 }}>Tipo</th><th style={{ padding: 8 }}>Medio</th><th style={{ padding: 8, textAlign: 'right' }}>Monto</th>
                <th style={{ padding: 8 }}>Descripción</th><th style={{ padding: 8 }}>Operador</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && <tr><td colSpan={8} style={{ padding: 14, textAlign: 'center', color: '#889' }}>Sin movimientos para este filtro.</td></tr>}
              {filtrados.map(e => (
                <tr key={e.id} style={{ borderTop: '1px solid #E6E7F0' }}>
                  <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{new Date(e.opDate).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td style={{ padding: 8 }}>{CANAL[e.source] === 'online' ? '💻 Online' : CANAL[e.source] === 'local' ? '🏪 Local' : e.source}</td>
                  <td style={{ padding: 8 }}>{e.operationId || '—'}</td>
                  <td style={{ padding: 8 }}>{e.type}</td>
                  <td style={{ padding: 8 }}>{MEAN_LABEL[e.means] || e.means}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{fmtP(e.amount)}{e.amountUsd ? ` (${fmtUSD(e.amountUsd)})` : ''}</td>
                  <td style={{ padding: 8 }}>{e.description}</td>
                  <td style={{ padding: 8 }}>{e.operator || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}